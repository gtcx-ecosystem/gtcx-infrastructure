/**
 * @fileoverview Audit Record Sink — pluggable durable emitter.
 *
 * The default sink writes signed audit records to stdout as NDJSON, which
 * is shipped via Promtail/Loki/CloudWatch and ends up in the WORM S3
 * bucket via the audit-flush sidecar.
 *
 * Optionally, AUDIT_SINK=nats enables direct publish to NATS JetStream
 * on the configured subject. This is the recommended sink for high
 * volume deployments because it gives at-least-once delivery and
 * decouples gateway pod lifetime from chain durability.
 *
 * When NATS is unreachable, records are buffered to a durable local disk
 * queue (append-only JSONL + byte-offset cursor). A background drain
 * loop replays queued records to NATS when connectivity returns. The
 * queue survives process restart and SIGKILL. See ADR-024.
 *
 * Sinks fail-soft: a transient sink error never blocks the signing path
 * or the request; the in-memory chain remains the authoritative copy
 * until the next checkpoint.
 */

import { createDiskQueue } from './disk-queue.mjs';

function sinkMode() {
  const explicit = process.env.AUDIT_SINK?.toLowerCase();
  const env = process.env.NODE_ENV || 'development';
  const isProdLike = env === 'production' || env === 'staging';

  if (explicit) {
    // Fail-closed: stdout is never allowed in production-like environments,
    // even if explicitly requested. This prevents misconfigurations where
    // AUDIT_SINK=stdout is set in a production Deployment.
    if (isProdLike && explicit === 'stdout') {
      throw new Error(
        `AUDIT_SINK=stdout is not permitted in NODE_ENV=${env}. ` +
          `Use 'nats' (recommended) or omit AUDIT_SINK to default to NATS.`
      );
    }
    return explicit;
  }

  // Default to durable NATS sink in production and staging;
  // stdout is acceptable only in development and test environments.
  return isProdLike ? 'nats' : 'stdout';
}
function natsSubject() { return process.env.AUDIT_NATS_SUBJECT || 'gtcx.audit.compliance-gateway'; }
function natsUrl() { return process.env.NATS_URL || 'nats://nats.gtcx.svc.cluster.local:4222'; }

let natsClient = null;
let natsConnectPromise = null;
let diskQueue = null;

/**
 * @typedef {{
 *   emit: (record: object) => void,
 *   close: () => Promise<void>,
 *   mode: string,
 * }} AuditSink
 */

function stdoutSink() {
  return {
    mode: 'stdout',
    emit(record) {
      console.log(JSON.stringify({ type: 'audit.signed', record }));
    },
    async close() {},
  };
}

/* c8 ignore start — requires live NATS broker; stdout sink + drain paths are fully tested */
async function connectNats() {
  if (natsClient) return natsClient;
  if (natsConnectPromise) return natsConnectPromise;
  natsConnectPromise = (async () => {
    try {
      const mod = await import('nats').catch(() => null);
      if (!mod) {
        console.error(JSON.stringify({
          level: 'warn',
          type: 'audit.sink.nats.unavailable',
          message: 'nats package not installed; falling back to stdout sink',
        }));
        return null;
      }
      const nc = await mod.connect({ servers: natsUrl(), name: 'compliance-gateway-audit' });
      natsClient = nc;
      console.log(JSON.stringify({
        level: 'info',
        type: 'audit.sink.nats.connected',
        url: natsUrl(),
        subject: natsSubject(),
      }));
      return nc;
    } catch (err) {
      console.error(JSON.stringify({
        level: 'error',
        type: 'audit.sink.nats.connectFailed',
        error: err.message,
        url: natsUrl(),
      }));
      return null;
    }
  })();
  return natsConnectPromise;
}

function natsPublishRaw(record) {
  if (!natsClient) return false;
  try {
    const tenantId = record?.payload?.tenantId;
    const subject = tenantId && typeof tenantId === 'string' && /^[a-z0-9-]+$/.test(tenantId)
      ? `${natsSubject()}.${tenantId}`
      : natsSubject();
    natsClient.publish(subject, JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

function natsSink({ onNatsUnavailable } = {}) {
  // Kick off the connect in the background; stdout serves as the failover.
  connectNats();
  return {
    mode: 'nats',
    emit(record) {
      // Always mirror to stdout so log aggregation has a copy even if
      // JetStream is briefly unreachable.
      console.log(JSON.stringify({ type: 'audit.signed', record }));
      const ok = natsPublishRaw(record);
      if (!ok && onNatsUnavailable) {
        onNatsUnavailable(record);
      }
    },
    async close() {
      if (natsClient) {
        try { await natsClient.drain(); } catch { /* shutdown drain — safe to ignore */ }
      }
    },
  };
}
/* c8 ignore stop */

let activeSink = null;

/**
 * Resolve the active audit sink for the process. Lazily constructed so
 * tests can call resetSink() between cases.
 *
 * @returns {AuditSink}
 */
export function getSink() {
  if (activeSink) return activeSink;
  if (sinkMode() === 'nats') {
    diskQueue = createDiskQueue({
      dir: process.env.AUDIT_QUEUE_DIR || '/tmp/gtcx-audit-queue',
      maxBytes: parseInt(process.env.AUDIT_QUEUE_MAX_BYTES || '104857600', 10),
      drainIntervalMs: parseInt(process.env.AUDIT_QUEUE_DRAIN_INTERVAL_MS || '5000', 10),
    });
    activeSink = natsSink({
      onNatsUnavailable: (record) => diskQueue.enqueue(record),
    });
    diskQueue.startDrain({
      emit: (record) => {
        // Raw NATS publish without stdout mirror or re-queue
        natsPublishRaw(record);
      },
    });
  } else {
    activeSink = stdoutSink();
  }
  return activeSink;
}

/**
 * Reset the sink (intended for tests only).
 */
export function resetSink() {
  activeSink = null;
  if (diskQueue) {
    diskQueue.stopDrain();
    diskQueue = null;
  }
  natsClient = null;
  natsConnectPromise = null;
}

/**
 * Inspectable mode for /health.
 *
 * @returns {{ mode: string, subject?: string, natsConnected?: boolean }}
 */
export function getSinkInfo() {
  const mode = sinkMode();
  const info = {
    mode: mode === 'nats' ? 'nats' : 'stdout',
    ...(mode === 'nats' ? { subject: natsSubject(), natsConnected: natsClient !== null } : {}),
  };
  if (diskQueue) {
    info.queue = diskQueue.getStats();
  }
  return info;
}
