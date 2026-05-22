#!/usr/bin/env node
/**
 * @fileoverview Audit Flush Sidecar
 *
 * Subscribes to the gtcx.audit.> JetStream subject hierarchy, batches
 * signed records, verifies them with @gtcx/audit-signer, and writes
 * NDJSON objects to a WORM S3 bucket with Object Lock retention.
 *
 * Designed to be deployed alongside the compliance-gateway in K8s.
 * Exposes /health and /ready endpoints on PORT (default 8080).
 *
 * Operational contract:
 *   - At-least-once delivery from JetStream (durable consumer).
 *   - Verification before write: records that fail signature OR
 *     chain checks are quarantined to a `_quarantine/` S3 prefix,
 *     never silently dropped.
 *   - Backpressure-aware: when S3 PutObject latency exceeds 5s,
 *     pause JetStream consumption until the queue drains.
 *   - Graceful shutdown: drain in-flight batch + ack/nak before exit.
 *
 * No business logic. No retry-with-modification. The sidecar's job is
 * "move bytes through a verifiable pipeline." Everything else lives in
 * the gateway.
 */

import { createServer } from 'node:http';
import { verifyChain, fromNdjson } from '@gtcx/audit-signer';
import {
  startNatsConsumer,
  drainNats,
  natsConnectionState,
} from './nats-consumer.mjs';
import {
  buildS3Client,
  putBatch,
  s3LastSuccessTimestamp,
} from './s3-uploader.mjs';

const PORT = Number(process.env.PORT || 8080);
const BATCH_SIZE = Number(process.env.AUDIT_FLUSH_BATCH_SIZE || 500);
const BATCH_INTERVAL_MS = Number(process.env.AUDIT_FLUSH_INTERVAL_MS || 10_000);
const BUCKET = process.env.AUDIT_S3_BUCKET;
const REGION = process.env.AUDIT_S3_REGION || 'af-south-1';

if (!BUCKET) {
  console.error(JSON.stringify({
    level: 'fatal',
    type: 'audit-flush.startup.refused',
    message: 'AUDIT_S3_BUCKET is required',
  }));
  process.exit(78); // EX_CONFIG
}

let buffer = [];
const s3 = buildS3Client({ region: REGION });

// ---------------------------------------------------------------------------
// Batch flusher
// ---------------------------------------------------------------------------

/**
 * Extract the tenant suffix from a JetStream subject. The audit-sink
 * publishes per-tenant subjects of the form
 *   gtcx.audit.compliance-gateway.<tenantId>
 * The last segment is the tenant. Falls back to 'default' for legacy
 * single-tenant publishers and to 'unknown' for malformed subjects.
 *
 * @param {string} subject
 * @returns {string}
 */
export function tenantFromSubject(subject) {
  if (typeof subject !== 'string' || subject.length === 0) return 'unknown';
  const parts = subject.split('.');
  // gtcx.audit.<service>.<tenant?> — tenant is the 4th segment when present.
  if (parts.length >= 4 && /^[a-z0-9-]+$/.test(parts[3])) return parts[3];
  if (parts.length >= 3) return 'default';
  return 'unknown';
}

/**
 * Flush a batch of envelope tuples `{ record, subject }` to S3. Records
 * are verified as a chain BEFORE any S3 PutObject; tampered batches go
 * to the `_quarantine/` prefix. Valid batches are grouped by tenant
 * (extracted from the JetStream subject) and written under
 * `tenant=<tid>/` prefixes.
 *
 * @param {Array<{ record: object, subject?: string }>} envelopes
 * @param {{ putBatch?: typeof putBatch }} [deps]
 * @returns {Promise<{ written: number, quarantined: number }>}
 */
export async function flushBatch(envelopes, deps = { putBatch }) {
  if (envelopes.length === 0) return { written: 0, quarantined: 0 };

  const records = envelopes.map((e) => e.record);

  // Verify the chain locally before sending bytes anywhere. A tampered
  // record gets quarantined under a separate prefix; the auditor learns
  // about the issue rather than the bytes silently disappearing.
  let verification;
  try {
    const reconstructed = fromNdjson(records.map((r) => JSON.stringify(r)).join('\n'));
    verification = verifyChain(reconstructed);
  } catch (err) {
    verification = { valid: false, firstInvalidIndex: 0, reason: err.message };
  }

  const now = new Date();
  const datePrefix = now.toISOString().slice(0, 13).replace(/[-T]/g, '/');
  const chainHead = records[records.length - 1]?.payloadHash?.slice(0, 12)
    ?? records[records.length - 1]?.signature?.slice(0, 12)
    ?? 'unknown';

  if (!verification.valid) {
    const key = `_quarantine/${datePrefix}/${Date.now()}-${chainHead}.ndjson`;
    await deps.putBatch(s3, BUCKET, key, records, {
      reason: 'chain-verification-failed',
      firstInvalidIndex: String(verification.firstInvalidIndex),
    });
    console.error(JSON.stringify({
      level: 'error',
      type: 'audit-flush.batch.quarantined',
      key,
      count: records.length,
      reason: verification.reason,
    }));
    return { written: 0, quarantined: records.length };
  }

  // Tenant routing comes from the JetStream subject (per Sprint 5's
  // audit-sink contract). Mixed-subject batches get split into one
  // S3 object per tenant prefix.
  const groups = new Map();
  for (const env of envelopes) {
    const tenantId = tenantFromSubject(env.subject ?? '');
    if (!groups.has(tenantId)) groups.set(tenantId, []);
    groups.get(tenantId).push(env.record);
  }

  let written = 0;
  for (const [tenantId, group] of groups) {
    const key = `tenant=${tenantId}/${datePrefix}/${Date.now()}-${chainHead}.ndjson`;
    await deps.putBatch(s3, BUCKET, key, group);
    written += group.length;
  }
  return { written, quarantined: 0 };
}

// ---------------------------------------------------------------------------
// Scheduled flush
// ---------------------------------------------------------------------------

let lastBatchAt = Date.now();
async function scheduledFlush() {
  if (buffer.length === 0) return;
  if (buffer.length < BATCH_SIZE && Date.now() - lastBatchAt < BATCH_INTERVAL_MS) return;
  const batch = buffer;
  buffer = [];
  lastBatchAt = Date.now();
  try {
    const result = await flushBatch(batch);
    console.log(JSON.stringify({
      level: 'info',
      type: 'audit-flush.batch.complete',
      written: result.written,
      quarantined: result.quarantined,
    }));
  } catch (err) {
    // Push the batch back and let the next interval retry. JetStream
    // hasn't acked yet (we ack inside putBatch), so the records remain
    // pending on the broker side too.
    buffer = batch.concat(buffer);
    console.error(JSON.stringify({
      level: 'error',
      type: 'audit-flush.batch.failed',
      error: err.message,
    }));
  }
}

const flushTimer = setInterval(scheduledFlush, 1000);
flushTimer.unref?.();

// ---------------------------------------------------------------------------
// NATS consumer wiring
// ---------------------------------------------------------------------------

const natsHandle = startNatsConsumer({
  onRecord: (record, subject) => {
    buffer.push({ record, subject });
    if (buffer.length >= BATCH_SIZE) {
      scheduledFlush();
    }
  },
});

// ---------------------------------------------------------------------------
// HTTP probes
// ---------------------------------------------------------------------------

const server = createServer((req, res) => {
  const url = req.url ?? '/';
  if (url === '/health') {
    // Liveness — process is up and the flush timer is running.
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      bufferDepth: buffer.length,
      natsConnected: natsConnectionState().connected,
    }));
    return;
  }
  if (url === '/ready') {
    // Readiness — NATS is connected AND at least one S3 write has
    // succeeded recently. A 2-minute lookback prevents flapping.
    const natsOk = natsConnectionState().connected;
    const s3Recent = s3LastSuccessTimestamp() > Date.now() - 120_000;
    const ready = natsOk && (s3Recent || buffer.length === 0);
    res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: ready ? 'ready' : 'not-ready',
      natsConnected: natsOk,
      s3RecentWrite: s3Recent,
      bufferDepth: buffer.length,
    }));
    return;
  }
  res.writeHead(404).end();
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal) {
  console.log(JSON.stringify({
    level: 'info',
    type: 'audit-flush.shutdown',
    signal,
    bufferDepth: buffer.length,
  }));
  clearInterval(flushTimer);
  try {
    await scheduledFlush();
    await drainNats(natsHandle);
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      type: 'audit-flush.shutdown.failed',
      error: err.message,
    }));
  } finally {
    server.close(() => process.exit(0));
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(JSON.stringify({
      level: 'info',
      type: 'audit-flush.listening',
      port: PORT,
      bucket: BUCKET,
      region: REGION,
      batchSize: BATCH_SIZE,
      batchIntervalMs: BATCH_INTERVAL_MS,
    }));
  });
}

export { server };
