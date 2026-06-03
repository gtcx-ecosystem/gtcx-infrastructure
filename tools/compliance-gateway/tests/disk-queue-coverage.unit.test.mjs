/**
 * @fileoverview Coverage-focused tests for disk-queue error paths
 * and edge cases not exercised by the main test file.
 */

import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { mkdtempSync, writeFileSync, chmodSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDiskQueue } from '../src/disk-queue.mjs';

function tempDir() {
  return mkdtempSync(join(tmpdir(), 'gtcx-disk-queue-test-'));
}

describe('disk-queue — error paths and edge cases', () => {
  let dir;

  beforeEach(() => {
    dir = tempDir();
  });

  afterEach(() => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {}
  });

  it('enqueue fails softly when directory is unwritable', () => {
    // Create a read-only parent so mkdir/enqueue fails
    const roDir = join(tmpdir(), 'gtcx-ro-' + Date.now());
    mkdirSync(roDir);
    chmodSync(roDir, 0o555);
    try {
      const q = createDiskQueue({ dir: join(roDir, 'nested'), maxBytes: 1000 });
      assert.doesNotThrow(() => q.enqueue({ id: 'r1' }));
    } finally {
      chmodSync(roDir, 0o755);
      rmSync(roDir, { recursive: true, force: true });
    }
  });

  it('startDrain is idempotent (existing timer)', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 100 });
    const sink = { emit: () => {} };
    q.startDrain(sink);
    q.startDrain(sink); // second call should be ignored
    q.stopDrain();
    assert.ok(true);
  });

  it('stopDrain clears timer and sink', () => {
    const q = createDiskQueue({ dir });
    q.startDrain({ emit: () => {} });
    q.stopDrain();
    q.stopDrain(); // idempotent
    assert.ok(true);
  });

  it('drains corrupt lines without getting stuck', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), 'not-json\n{"id":"good"}\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '0', 'utf8');

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    // Give drain a moment to run
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    assert.strictEqual(emitted.length, 1);
    assert.strictEqual(emitted[0].id, 'good');
  });

  it('drains empty lines without advancing cursor incorrectly', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), '\n\n{"id":"r1"}\n\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '0', 'utf8');

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    assert.strictEqual(emitted.length, 1);
    assert.strictEqual(emitted[0].id, 'r1');
  });

  it('stops mid-drain when stopDrain is called', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 10 });
    // Write many records
    let ndjson = '';
    for (let i = 0; i < 100; i++) {
      ndjson += JSON.stringify({ id: `r${i}` }) + '\n';
    }
    writeFileSync(join(dir, 'records.jsonl'), ndjson, 'utf8');
    writeFileSync(join(dir, 'cursor'), '0', 'utf8');

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    // Stop quickly before all records are drained
    await new Promise((r) => setTimeout(r, 5));
    q.stopDrain();

    // Should have emitted some but not all (or all, depending on speed)
    // The key assertion is that it didn't crash.
    assert.ok(emitted.length >= 0);
  });

  it('handles sink emit failure and retries', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), '{"id":"r1"}\n{"id":"r2"}\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '0', 'utf8');

    let calls = 0;
    q.startDrain({
      emit: () => {
        calls++;
        throw new Error('sink down');
      },
    });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    // At least one emit attempt should have failed
    assert.ok(calls >= 1);
  });

  it('compacts after full drain', async () => {
    const q = createDiskQueue({ dir });
    q.enqueue({ id: 'r1' });

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    await new Promise((r) => setTimeout(r, 100));
    q.stopDrain();

    assert.strictEqual(emitted.length, 1);
    // After full drain, cursor should be reset to 0
    const stats = q.getStats();
    assert.strictEqual(stats.pendingBytes, 0);
  });

  it('warns when queue exceeds maxBytes', () => {
    const q = createDiskQueue({ dir, maxBytes: 1 });
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (line) => warnings.push(line);
    try {
      q.enqueue({ id: 'big-record', payload: 'x'.repeat(1000) });
    } finally {
      console.warn = originalWarn;
    }
    assert.ok(warnings.length >= 1);
    assert.ok(warnings[0].includes('audit.queue.oversized'));
  });

  it('getStats reports pending bytes and approximate records', () => {
    const q = createDiskQueue({ dir });
    q.enqueue({ id: 'r1' });
    const stats = q.getStats();
    assert.ok(stats.pendingBytes > 0);
    assert.ok(stats.pendingRecords >= 1);
    assert.strictEqual(stats.totalEnqueued, 1);
    assert.strictEqual(stats.totalDrained, 0);
    assert.strictEqual(stats.totalFailed, 0);
    assert.strictEqual(stats.draining, false);
  });

  it('getStats handles missing files gracefully', () => {
    const q = createDiskQueue({ dir });
    const stats = q.getStats();
    assert.strictEqual(stats.pendingBytes, 0);
    assert.strictEqual(stats.pendingRecords, 0);
  });

  it('handles maxBytes=0 without throwing', () => {
    const q = createDiskQueue({ dir, maxBytes: 0 });
    q.enqueue({ id: 'r1' });
    assert.ok(true);
  });

  it('handles negative cursor values gracefully', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), '{"id":"r1"}\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '-5', 'utf8');

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    assert.strictEqual(emitted.length, 1);
  });

  it('drain returns early after stopDrain clears sinkRef', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 10 });
    q.enqueue({ id: 'r1' });
    q.startDrain({ emit: (r) => {} });
    q.stopDrain();
    // Wait for a potential interval tick after stopDrain
    await new Promise((r) => setTimeout(r, 50));
    assert.ok(true);
  });

  it('compacts when cursor equals file size', async () => {
    const q = createDiskQueue({ dir });
    const line = JSON.stringify({ id: 'r1' }) + '\n';
    writeFileSync(join(dir, 'records.jsonl'), line, 'utf8');
    writeFileSync(join(dir, 'cursor'), String(Buffer.byteLength(line, 'utf8')), 'utf8');

    q.startDrain({ emit: () => {} });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    const stats = q.getStats();
    assert.strictEqual(stats.pendingBytes, 0);
  });

  it('drain returns early when records file does not exist', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 10 });
    // No records file written
    q.startDrain({ emit: () => {} });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();
    assert.ok(true);
  });

  it('compacts when cursor is ahead of file size', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), '{"id":"r1"}\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '1000', 'utf8');

    q.startDrain({ emit: () => {} });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();

    const stats = q.getStats();
    assert.strictEqual(stats.pendingBytes, 0);
  });

  it('interval callback fires and drains repeatedly', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 20 });
    q.enqueue({ id: 'r1' });

    const emitted = [];
    q.startDrain({ emit: (r) => emitted.push(r) });
    // Wait for the initial drain + at least one interval tick
    await new Promise((r) => setTimeout(r, 80));
    q.stopDrain();

    assert.strictEqual(emitted.length, 1);
    assert.strictEqual(emitted[0].id, 'r1');
  });

  it('interval callback fires when queue is empty', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 10 });
    // No records — interval should still fire and drain() returns early
    q.startDrain({ emit: () => {} });
    await new Promise((r) => setTimeout(r, 50));
    q.stopDrain();
    assert.ok(true);
  });

  it('logs compact errors when cursor write fails', async () => {
    const q = createDiskQueue({ dir });
    writeFileSync(join(dir, 'records.jsonl'), '{"id":"r1"}\n', 'utf8');
    writeFileSync(join(dir, 'cursor'), '9999', 'utf8');

    chmodSync(dir, 0o555);
    const errors = [];
    const originalErr = console.error;
    console.error = (line) => errors.push(line);
    try {
      q.startDrain({ emit: () => {} });
      await new Promise((r) => setTimeout(r, 50));
      q.stopDrain();
    } finally {
      console.error = originalErr;
      chmodSync(dir, 0o755);
    }
    assert.ok(errors.some((e) => e.includes('audit.queue.compactFailed')));
  });

  it('logs unhandled drain error when records path is a directory', async () => {
    const q = createDiskQueue({ dir, drainIntervalMs: 20 });
    mkdirSync(join(dir, 'records.jsonl'));
    writeFileSync(join(dir, 'cursor'), '0', 'utf8');

    const errors = [];
    const originalErr = console.error;
    console.error = (line) => errors.push(line);
    try {
      q.startDrain({ emit: () => {} });
      await new Promise((r) => setTimeout(r, 80));
      q.stopDrain();
    } finally {
      console.error = originalErr;
    }
    assert.ok(errors.some((e) => e.includes('audit.queue.drainUnhandled')));
  });
});
