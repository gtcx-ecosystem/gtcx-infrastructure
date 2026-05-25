/**
 * @fileoverview NATS JetStream consumer for signed audit records.
 *
 * Soft-loads the `nats` package; if it's not installed we run a no-op
 * consumer so the rest of the sidecar (HTTP probes, batch flusher) is
 * still testable in environments without a broker.
 *
 * Durable consumer name + subject are read from env. At-least-once
 * delivery is the contract; the batch flusher dedupes by record id.
 */

let state = { connected: false, lastMessageAt: 0 };
let conn = null;
let sub = null;

const NATS_URL = process.env.NATS_URL || 'nats://nats.gtcx.svc.cluster.local:4222';
const SUBJECT = process.env.AUDIT_NATS_SUBJECT || 'gtcx.audit.>';
const DURABLE_NAME = process.env.AUDIT_NATS_DURABLE || 'audit-flush';

/**
 * Start consuming. Returns an opaque handle for shutdown.
 *
 * @param {{ onRecord: (record: object) => void }} deps
 * @returns {Promise<{ stop: () => Promise<void> }>}
 */
export async function startNatsConsumer(deps) {
  const natsMod = await import('@nats-io/transport-node').catch(() => null);
  if (!natsMod) {
    console.error(JSON.stringify({
      level: 'warn',
      type: 'audit-flush.nats.module-missing',
      message: 'nats package not installed; consumer disabled',
    }));
    return { stop: async () => {} };
  }
  try {
    conn = await natsMod.connect({ servers: NATS_URL, name: 'audit-flush' });
    state.connected = true;
    const jsm = await conn.jetstreamManager();
    // Ensure a durable consumer exists; absent broker config we let the
    // ensure call fail silently because the stream may be provisioned
    // by infra/kubernetes/base/services/nats.yaml.
    try {
      await jsm.consumers.add(DURABLE_NAME, { durable_name: DURABLE_NAME, ack_policy: 'explicit' });
    } catch { /* already exists */ }

    const js = conn.jetstream();
    sub = await js.subscribe(SUBJECT, { config: { durable_name: DURABLE_NAME } });
    (async () => {
      for await (const m of sub) {
        try {
          const text = m.data.toString('utf-8');
          const record = JSON.parse(text);
          state.lastMessageAt = Date.now();
          // Pass the JetStream subject through so the flusher can
          // derive tenantId without needing it inside the signed record.
          deps.onRecord(record, m.subject);
          m.ack();
        } catch (err) {
          console.error(JSON.stringify({
            level: 'error',
            type: 'audit-flush.nats.parse-failed',
            error: err.message,
          }));
          m.nak();
        }
      }
    })();
    console.log(JSON.stringify({
      level: 'info',
      type: 'audit-flush.nats.connected',
      url: NATS_URL,
      subject: SUBJECT,
      durable: DURABLE_NAME,
    }));
  } catch (err) {
    state.connected = false;
    console.error(JSON.stringify({
      level: 'error',
      type: 'audit-flush.nats.connect-failed',
      error: err.message,
      url: NATS_URL,
    }));
  }
  return {
    stop: async () => {
      try {
        if (sub) await sub.drain();
        if (conn) await conn.close();
      } catch { /* swallow during shutdown */ }
      state.connected = false;
    },
  };
}

export async function drainNats(handle) {
  if (handle && typeof handle.stop === 'function') {
    await handle.stop();
  }
}

export function natsConnectionState() {
  return { ...state };
}

/** Test-only reset. */
export function _resetForTests() {
  state = { connected: false, lastMessageAt: 0 };
  conn = null;
  sub = null;
}
