/**
 * @fileoverview Per-IP throttle on the auth-failure path.
 *
 * The auth-failure handler in server.mjs signs and chain-appends an
 * audit record on every rejected request. Without a rate limit, a
 * bearer brute-force at the ALB's allowed rate (e.g. 100 req/s) turns
 * into an audit-DoS amplifier: 100 Ed25519 signatures + chain appends
 * per second per attacker. The legitimate audit signal is buried; the
 * in-memory chain checkpoint flips constantly; downstream JetStream +
 * WORM ingest pays the cost.
 *
 * Fix: count auth failures per source IP in a sliding window. Once
 * the threshold is crossed, return 429 immediately AND skip the
 * signAuditEvent call entirely (still increment a metric counter so
 * operators see the abuse pattern on the dashboard).
 *
 * Constants are intentionally generous — a real on-call rotation
 * occasionally types tokens wrong; we're throttling abuse, not
 * humans.
 */

import { isIP } from 'node:net';

const DEFAULT_THRESHOLD = Number(process.env.GTCX_AUTH_FAILURE_THRESHOLD || 20);
const DEFAULT_WINDOW_MS = Number(process.env.GTCX_AUTH_FAILURE_WINDOW_MS || 60_000);
const DEFAULT_MAX_IPS = Number(process.env.GTCX_AUTH_FAILURE_MAX_IPS || 10_000);

/** @type {Map<string, { count: number, firstFailMs: number, throttledUntilMs: number, lastSeenMs: number }>} */
const ipState = new Map();

/**
 * @typedef {object} ThrottleConfig
 * @property {number} [threshold=20]   - failures in window before throttle
 * @property {number} [windowMs=60000] - rolling window length in ms
 * @property {number} [throttleMs]     - duration of the 429 lockout; defaults to windowMs
 * @property {number} [maxIps=10000]   - maximum tracked source IPs
 */

function normalizeConfig(cfg = {}) {
  const threshold = cfg.threshold ?? DEFAULT_THRESHOLD;
  const windowMs = cfg.windowMs ?? DEFAULT_WINDOW_MS;
  const throttleMs = cfg.throttleMs ?? windowMs;
  const maxIps = cfg.maxIps ?? DEFAULT_MAX_IPS;
  return { threshold, windowMs, throttleMs, maxIps };
}

function retryAfterSeconds(untilMs, now) {
  return Math.max(1, Math.ceil((untilMs - now) / 1000));
}

function configuredTrustedProxyCidrs() {
  return (process.env.GTCX_TRUSTED_PROXY_CIDRS || '')
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeIp(ip) {
  if (typeof ip !== 'string') return '';
  const withoutZone = ip
    .trim()
    .replace(/^\[|\]$/g, '')
    .split('%')[0];
  if (withoutZone.toLowerCase().startsWith('::ffff:')) {
    const mapped = withoutZone.slice(7);
    return isIP(mapped) === 4 ? mapped : withoutZone;
  }
  return withoutZone;
}

function ipv4ToBytes(ip) {
  const parts = ip.split('.').map((part) => Number(part));
  /* c8 ignore next 4 — defensive: isIP already validated the shape */
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return null;
  }
  return parts;
}

function ipv6ToBytes(ip) {
  let normalized = ip.toLowerCase();
  const ipv4Match = normalized.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (ipv4Match) {
    const ipv4 = ipv4ToBytes(ipv4Match[1]);
    if (!ipv4) return null;
    const hi = ((ipv4[0] << 8) | ipv4[1]).toString(16);
    const lo = ((ipv4[2] << 8) | ipv4[3]).toString(16);
    normalized = normalized.slice(0, -ipv4Match[1].length) + `${hi}:${lo}`;
  }

  const halves = normalized.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null;
  const hextets = [...left, ...Array(missing).fill('0'), ...right];
  if (hextets.length !== 8) return null;

  const bytes = [];
  for (const hextet of hextets) {
    if (!/^[0-9a-f]{1,4}$/.test(hextet)) return null;
    const value = Number.parseInt(hextet, 16);
    bytes.push((value >> 8) & 0xff, value & 0xff);
  }
  return bytes;
}

function ipToBytes(ip) {
  const normalized = normalizeIp(ip);
  const family = isIP(normalized);
  if (family === 4) return { family, bytes: ipv4ToBytes(normalized) };
  if (family === 6) return { family, bytes: ipv6ToBytes(normalized) };
  return null;
}

function parseCidr(cidr) {
  const parts = cidr.split('/');
  if (parts.length > 2) return null;
  const [rawIp, rawPrefix] = parts;
  const parsed = ipToBytes(rawIp);
  if (!parsed?.bytes) return null;
  const maxPrefix = parsed.family === 4 ? 32 : 128;
  const prefix =
    rawPrefix === undefined || rawPrefix === ''
      ? maxPrefix
      : /^\d+$/.test(rawPrefix)
        ? Number.parseInt(rawPrefix, 10)
        : Number.NaN;
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > maxPrefix) return null;
  return { ...parsed, prefix };
}

function bytesMatchPrefix(ipBytes, cidrBytes, prefix) {
  const wholeBytes = Math.floor(prefix / 8);
  const remainingBits = prefix % 8;
  for (let i = 0; i < wholeBytes; i += 1) {
    if (ipBytes[i] !== cidrBytes[i]) return false;
  }
  if (remainingBits === 0) return true;
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (ipBytes[wholeBytes] & mask) === (cidrBytes[wholeBytes] & mask);
}

export function isIpInCidrs(ip, cidrs) {
  const parsedIp = ipToBytes(ip);
  if (!parsedIp?.bytes) return false;
  for (const cidr of cidrs) {
    const parsedCidr = parseCidr(cidr);
    if (!parsedCidr?.bytes || parsedCidr.family !== parsedIp.family) continue;
    if (bytesMatchPrefix(parsedIp.bytes, parsedCidr.bytes, parsedCidr.prefix)) return true;
  }
  return false;
}

function isLiveState(state, now, windowMs) {
  return state.throttledUntilMs > now || now - state.firstFailMs <= windowMs;
}

function touchIp(ip, state) {
  ipState.delete(ip);
  ipState.set(ip, state);
}

function pruneState(now, cfg, protectedIp) {
  for (const [ip, state] of ipState) {
    if (ip !== protectedIp && !isLiveState(state, now, cfg.windowMs)) {
      ipState.delete(ip);
    }
  }

  const maxIps = Math.max(1, Math.floor(cfg.maxIps));
  while (ipState.size > maxIps) {
    let evicted = false;
    for (const [ip] of ipState) {
      if (ip === protectedIp && ipState.size === 1) break;
      if (ip === protectedIp) continue;
      ipState.delete(ip);
      evicted = true;
      break;
    }
    if (!evicted) break;
  }
}

/**
 * Check whether the given IP is currently throttled. Side-effect free.
 * Reads existing state set by `recordAuthFailure`; takes no config
 * because the lockout-until timestamp is already baked into state.
 *
 * @param {string} ip
 * @returns {{ throttled: boolean, retryAfterSeconds?: number }}
 */
export function isAuthThrottled(ip) {
  const now = Date.now();
  const state = ipState.get(ip);
  if (!state) return { throttled: false };
  state.lastSeenMs = now;
  touchIp(ip, state);
  if (state.throttledUntilMs <= now) return { throttled: false };
  return {
    throttled: true,
    retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
  };
}

/**
 * Record an auth failure for the given IP. Returns the post-update
 * state so the caller can decide whether to log abuse-detected.
 *
 * @param {string} ip
 * @param {ThrottleConfig} [cfg]
 * @returns {{ count: number, throttled: boolean, retryAfterSeconds?: number }}
 */
export function recordAuthFailure(ip, cfg = {}) {
  const normalized = normalizeConfig(cfg);
  const now = Date.now();

  let state = ipState.get(ip);
  if (!state || !isLiveState(state, now, normalized.windowMs)) {
    state = { count: 0, firstFailMs: now, throttledUntilMs: 0, lastSeenMs: now };
  }
  state.lastSeenMs = now;
  state.count += 1;

  if (state.count >= normalized.threshold && state.throttledUntilMs <= now) {
    state.throttledUntilMs = now + normalized.throttleMs;
  }

  touchIp(ip, state);
  pruneState(now, normalized, ip);

  if (state.throttledUntilMs > now) {
    return {
      count: state.count,
      throttled: true,
      retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
    };
  }
  return { count: state.count, throttled: false };
}

/**
 * Atomically record a failure and decide whether the caller may still
 * emit the regulator-facing auth-failure audit event. Existing lockouts
 * do not extend the window; newly-crossed thresholds return `shouldSign`
 * false so the threshold-crossing request does not amplify into another
 * signed audit record.
 *
 * @param {string} ip
 * @param {ThrottleConfig} [cfg]
 * @returns {{ count: number, throttled: boolean, alreadyThrottled: boolean, shouldSign: boolean, retryAfterSeconds?: number }}
 */
export function recordAndCheckAuthFailure(ip, cfg = {}) {
  const normalized = normalizeConfig(cfg);
  const now = Date.now();
  const state = ipState.get(ip);
  if (state?.throttledUntilMs > now) {
    state.lastSeenMs = now;
    touchIp(ip, state);
    pruneState(now, normalized, ip);
    return {
      count: state.count,
      throttled: true,
      alreadyThrottled: true,
      shouldSign: false,
      retryAfterSeconds: retryAfterSeconds(state.throttledUntilMs, now),
    };
  }

  const updated = recordAuthFailure(ip, normalized);
  return {
    ...updated,
    alreadyThrottled: false,
    shouldSign: !updated.throttled,
  };
}

/**
 * Clear the failure counter on auth success — humans who fat-fingered
 * their token once and then logged in correctly shouldn't carry a
 * counter forward into the next session.
 *
 * @param {string} ip
 */
export function clearAuthFailures(ip) {
  ipState.delete(ip);
}

/**
 * Extract the source IP from an http.IncomingMessage. X-Forwarded-For is
 * trusted only when the socket peer is an explicitly configured proxy.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {{ trustedProxyCidrs?: string[] }} [opts]
 * @returns {string}
 */
export function sourceIpFromRequest(req, opts = {}) {
  const remoteAddress = normalizeIp(req.socket?.remoteAddress ?? '');
  const trustedProxyCidrs = opts.trustedProxyCidrs ?? configuredTrustedProxyCidrs();
  const xff = req.headers?.['x-forwarded-for'];
  const xffValue = Array.isArray(xff) ? xff[0] : xff;
  if (
    typeof xffValue === 'string' &&
    xffValue.length > 0 &&
    isIpInCidrs(remoteAddress, trustedProxyCidrs)
  ) {
    const forwardedFor = normalizeIp(xffValue.split(',')[0]);
    if (isIP(forwardedFor)) return forwardedFor;
  }
  return remoteAddress || 'unknown';
}

/**
 * Test-only.
 */
export function _resetForTests() {
  ipState.clear();
}

/**
 * Test-only.
 */
export function _stateSizeForTests() {
  return ipState.size;
}
