/**
 * @fileoverview NATS JetStream consumer for signed audit records.
 *
 * Dynamically imports `@nats-io/transport-node`. The transport import
 * is injectable so tests can simulate broker outage / reconnect without
 * a real NATS process. At-least-once delivery is the contract; the
 * batch flusher dedupes by record id.
 *
 * Reconnect: the prior version did a single connect attempt and
 * silently left the consumer dead if the broker rolled or the
 * subscription closed mid-stream. Now we exponential-backoff retry
 * with jitter, indefinitely, exposing reconnectAttempts via state.
 */

const DEFAULTS = {
  initialDelayMs: 250,
  maxDelayMs: 30_000,
  jitterFraction: 0.3,
};

let state = {
  connected: false,
  lastMessageAt: 0,
  reconnectAttempts: 0,
  lastError: null,
};
let stopped = false;
let conn = null;
let sub = null;

const NATS_URL = process.env.NATS_URL || 'nats://nats.gtcx.svc.cluster.local:4222';
const SUBJECT = process.env.AUDIT_NATS_SUBJECT || 'gtcx.audit.>';
const DURABLE_NAME = process.env.AUDIT_NATS_DURABLE || 'audit-flush';

/**
 * Compute the next retry delay with full-jitter exponential backoff.
 *
 * @param {number} attempt - 1-indexed retry attempt
 * @param {{ initialDelayMs: number, maxDelayMs: number, jitterFraction: number }} cfg
 * @returns {number}
 */
export function nextRetryDelayMs(attempt, cfg = DEFAULTS) {
  const exp = Math.min(cfg.maxDelayMs, cfg.initialDelayMs * 2 ** (attempt - 1));
  const jitter = exp * cfg.jitterFraction * (Math.random() * 2 - 1);
  return Math.max(50, Math.round(exp + jitter));
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    t.unref?.();
  });
}

/**
 * Connect once and consume until the subscription ends (broker hangup,
 * remote close, etc). Returns when the loop ends so the outer reconnect
 * supervisor can re-enter.
 *
 * @param {object} natsMod
 * @param {{ onRecord: (record: object, subject: string) => void, retry: { initialDelayMs: number, maxDelayMs: number, jitterFraction: number } }} deps
 */
async function runOnce(natsMod, deps) {
  conn = await natsMod.connect({ servers: NATS_URL, name: 'audit-flush' });
  state.connected = true;
  state.lastError = null;

  const jsm = await conn.jetstreamManager();
  try {
    await jsm.consumers.add(DURABLE_NAME, { durable_name: DURABLE_NAME, ack_policy: 'explicit' });
  } catch { /* already exists */ }

  const js = conn.jetstream();
  sub = await js.subscribe(SUBJECT, { config: { durable_name: DURABLE_NAME } });

  console.log(JSON.stringify({
    level: 'info',
    type: 'audit-flush.nats.connected',
    url: NATS_URL,
    subject: SUBJECT,
    durable: DURABLE_NAME,
    reconnectAttempts: state.reconnectAttempts,
  }));

  for await (const m of sub) {
    if (stopped) break;
    try {
      const text = m.data.toString('utf-8');
      const record = JSON.parse(text);
      state.lastMessageAt = Date.now();
      // Pass the JetStream subject through so the flusher can derive
      // tenantId without needing it inside the signed record.
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
}

/**
 * Start consuming. Supervises connect/run cycles indefinitely until
 * `stop()` is called. Returns an opaque handle for shutdown.
 *
 * @param {{
 *   onRecord: (record: object, subject: string) => void,
 *   loadNats?: () => Promise<object | null>,
 *   retry?: { initialDelayMs?: number, maxDelayMs?: number, jitterFraction?: number },
 * }} deps
 * @returns {Promise<{ stop: () => Promise<void> }>}
 */
export async function startNatsConsumer(deps) {
  const loader =
    deps.loadNats ?? (() => import('@nats-io/transport-node').catch(() => null));
  const natsMod = await loader();
  if (!natsMod) {
    console.error(JSON.stringify({
      level: 'warn',
      type: 'audit-flush.nats.module-missing',
      message: '@nats-io/transport-node not installed; consumer disabled',
    }));
    return { stop: async () => {} };
  }

  const retry = { ...DEFAULTS, ...(deps.retry ?? {}) };
  stopped = false;
  state.reconnectAttempts = 0;

  // Supervise. Each iteration is one full connect-subscribe-consume
  // lifecycle. When the for-await loop ends (broker hangup, etc.) we
  // backoff and reconnect. The catch wraps connect failures (broker
  // unreachable, auth failure) the same way.
  const supervisor = (async () => {
    while (!stopped) {
      try {
        await runOnce(natsMod, deps);
        state.connected = false;
        if (stopped) break;
        state.reconnectAttempts += 1;
        const delay = nextRetryDelayMs(state.reconnectAttempts, retry);
        console.warn(JSON.stringify({
          level: 'warn',
          type: 'audit-flush.nats.reconnecting',
          reason: 'subscription-ended',
          delayMs: delay,
          attempts: state.reconnectAttempts,
        }));
        await sleep(delay);
      } catch (err) {
        state.connected = false;
        state.lastError = err.message;
        state.reconnectAttempts += 1;
        const delay = nextRetryDelayMs(state.reconnectAttempts, retry);
        console.error(JSON.stringify({
          level: 'error',
          type: 'audit-flush.nats.connect-failed',
          error: err.message,
          url: NATS_URL,
          delayMs: delay,
          attempts: state.reconnectAttempts,
        }));
        if (stopped) break;
        await sleep(delay);
      }
    }
  })();
  // Detach: the supervisor lives for the process lifetime. unref isn't
  // available on bare promises; the setTimeout inside sleep() handles
  // not pinning the loop. Hold a reference so it isn't GC'd.
  supervisor.catch(() => {});

  return {
    stop: async () => {
      stopped = true;
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
  state = {
    connected: false,
    lastMessageAt: 0,
    reconnectAttempts: 0,
    lastError: null,
  };
  stopped = false;
  conn = null;
  sub = null;
}
