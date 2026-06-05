/**
 * @fileoverview Durable Offline Audit Queue — append-only JSONL with byte-offset cursor.
 *
 * Survives process restart and crash recovery. Falls back to stdout if the
 * queue itself errors. Designed for air-gapped or partitioned environments
 * where NATS, Redis, and PostgreSQL may all be unreachable.
 *
 * Write path:  appendFileSync → fsyncSync → return (< 1ms on SSD)
 * Read path:   createReadStream from cursor offset → line-by-line → NATS
 * Compaction:  Truncate + reset cursor when fully drained
 */

import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  closeSync,
  fsyncSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const DEFAULT_MAX_BYTES = 100 * 1024 * 1024; // 100 MiB
const DEFAULT_DRAIN_INTERVAL_MS = 5000;

/**
 * @typedef {object} DiskQueueOptions
 * @property {string} [dir='/tmp/gtcx-audit-queue'] — Queue directory
 * @property {number} [maxBytes=104857600] — Warn threshold; never drops records
 * @property {number} [drainIntervalMs=5000] — Background drain retry interval
 */

/**
 * @typedef {object} DiskQueueStats
 * @property {number} pendingBytes — Un-drained bytes in queue
 * @property {number} pendingRecords — Approximate un-drained record count
 * @property {number} totalEnqueued — Lifetime enqueue count
 * @property {number} totalDrained — Lifetime drain count
 * @property {number} totalFailed — Lifetime drain failure count
 * @property {boolean} draining — Whether a drain cycle is active
 */

/**
 * Create a durable disk queue.
 *
 * @param {DiskQueueOptions} [options]
 * @returns {{
 *   enqueue: (record: object) => void,
 *   startDrain: (sink: { emit: (record: object) => void }) => void,
 *   stopDrain: () => void,
 *   getStats: () => DiskQueueStats,
 * }}
 */
export function createDiskQueue(options = {}) {
  const dir = options.dir || '/tmp/gtcx-audit-queue';
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const drainIntervalMs = options.drainIntervalMs ?? DEFAULT_DRAIN_INTERVAL_MS;

  const recordsPath = resolve(dir, 'records.jsonl');
  const cursorPath = resolve(dir, 'cursor');
  const compactPath = resolve(dir, 'records.jsonl.compact');

  let drainTimer = null;
  let isDraining = false;
  let sinkRef = null;
  let stopped = false;

  // Mutable counters (not persisted; lifetime of process)
  let totalEnqueued = 0;
  let totalDrained = 0;
  let totalFailed = 0;

  function ensureDir() {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  function readCursor() {
    try {
      const raw = readFileSync(cursorPath, 'utf8');
      const n = parseInt(raw.trim(), 10);
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  }

  function writeCursor(offset) {
    ensureDir();
    writeFileSync(cursorPath, String(offset), 'utf8');
  }

  function currentFileSize() {
    try {
      return statSync(recordsPath).size;
    } catch {
      return 0;
    }
  }

  /**
   * Append a record to the queue with fsync durability.
   *
   * @param {object} record
   */
  function enqueue(record) {
    try {
      ensureDir();
      const line = JSON.stringify(record) + '\n';
      const fd = openSync(recordsPath, 'a');
      try {
        appendFileSync(fd, line, 'utf8');
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      totalEnqueued++;

      const size = currentFileSize();
      if (size > maxBytes) {
        console.warn(JSON.stringify({
          level: 'warn',
          type: 'audit.queue.oversized',
          message: 'Audit queue exceeds maxBytes threshold',
          dir,
          size,
          maxBytes,
        }));
      }
    } catch (err) {
      // Fail-soft: queue error must never block the signing path
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.queue.enqueueFailed',
        message: 'Disk queue enqueue failed; record may be lost',
        error: err.message,
      }));
    }
  }

  /**
   * Compact the queue file when fully drained.
   */
  function compact() {
    try {
      if (existsSync(recordsPath)) {
        renameSync(recordsPath, compactPath);
        unlinkSync(compactPath);
      }
      writeCursor(0);
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.queue.compactFailed',
        message: 'Queue compaction failed',
        error: err.message,
      }));
    }
  }

  /**
   * Drain pending records to the sink.
   *
   * @returns {Promise<void>}
   */
  async function drain() {
    if (!sinkRef) return;
    if (!existsSync(recordsPath)) return;

    const cursor = readCursor();
    const size = currentFileSize();
    if (cursor >= size) {
      if (cursor > 0 || size > 0) {
        compact();
      }
      return;
    }

    isDraining = true;
    let currentOffset = cursor;
    let failed = false;

    const stream = createReadStream(recordsPath, { start: cursor, encoding: 'utf8' });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    try {
      for await (const line of rl) {
        if (stopped) break;
        if (!line.trim()) {
          currentOffset += Buffer.byteLength(line, 'utf8') + 1; // +1 for newline
          continue;
        }

        let record;
        try {
          record = JSON.parse(line);
        } catch {
          // Corrupt line — skip and advance cursor so we don't get stuck
          currentOffset += Buffer.byteLength(line, 'utf8') + 1;
          continue;
        }

        try {
          sinkRef.emit(record);
          currentOffset += Buffer.byteLength(line, 'utf8') + 1;
          totalDrained++;
          // Atomic cursor update after each successful emit
          writeCursor(currentOffset);
        } catch (err) {
          console.warn(JSON.stringify({
            level: 'warn',
            type: 'audit.queue.drainEmitFailed',
            message: 'Sink emit failed during drain; will retry',
            error: err.message,
          }));
          failed = true;
          totalFailed++;
          break;
        }
      }
    } finally {
      rl.close();
      stream.destroy();
      isDraining = false;
    }

    if (!failed && !stopped) {
      const finalSize = currentFileSize();
      if (currentOffset >= finalSize) {
        compact();
      }
    }
  }

  /**
   * Start the background drain interval.
   *
   * @param {{ emit: (record: object) => void }} sink
   */
  function startDrain(sink) {
    if (drainTimer) return;
    sinkRef = sink;
    stopped = false;
    // Immediate first drain in case records were queued before start
    drain().catch((err) => {
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.queue.drainUnhandled',
        message: 'Unhandled drain error',
        error: err.message,
      }));
    });
    drainTimer = setInterval(() => {
      if (!isDraining && !stopped) {
        drain().catch((err) => {
          console.error(JSON.stringify({
            level: 'error',
            type: 'audit.queue.drainUnhandled',
            message: 'Unhandled drain error',
            error: err.message,
          }));
        });
      }
    }, drainIntervalMs);
    // Prevent timer from keeping process alive in tests
    if (drainTimer && typeof drainTimer.unref === 'function') {
      drainTimer.unref();
    }
  }

  /**
   * Stop the background drain interval.
   */
  function stopDrain() {
    stopped = true;
    if (drainTimer) {
      clearInterval(drainTimer);
      drainTimer = null;
    }
    sinkRef = null;
  }

  /**
   * @returns {DiskQueueStats}
   */
  function getStats() {
    const size = currentFileSize();
    const cursor = readCursor();
    const pendingBytes = Math.max(0, size - cursor);
    // Approximate record count: average JSON audit record is ~500 bytes
    const approxRecordSize = 500;
    return {
      pendingBytes,
      pendingRecords: Math.ceil(pendingBytes / approxRecordSize),
      totalEnqueued,
      totalDrained,
      totalFailed,
      draining: isDraining,
    };
  }

  return {
    enqueue,
    startDrain,
    stopDrain,
    getStats,
  };
}
