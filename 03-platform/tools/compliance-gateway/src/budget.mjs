/**
 * @fileoverview Per-principal budget + QPS limiter.
 *
 * Bounds the blast radius of a stolen or buggy token. Two layers:
 *
 *   1. QPS  — sliding-window rate limit per principal (default 10 req/s).
 *   2. Cost — daily USD token budget per principal (default $5).
 *
 * STORAGE.
 *
 * Budget state is delegated to `./budget-store.mjs`. The default backend
 * remains in-process memory, preserving dev/test behavior. Production can
 * opt into shared Redis enforcement with GTCX_BUDGET_STORE_BACKEND=redis
 * and GTCX_BUDGET_REDIS_URL, preventing HPA replicas from multiplying the
 * documented per-principal QPS and daily-spend limits.
 */

import { _resetForTests as resetBudgetStoreForTests, getBudgetStore } from './budget-store.mjs';

const QPS_LIMIT = Number(process.env.GTCX_QPS_LIMIT || '10');
const QPS_WINDOW_MS = Number(process.env.GTCX_QPS_WINDOW_MS || '1000');
const DAILY_BUDGET_USD = Number(process.env.GTCX_DAILY_BUDGET_USD || '5');

// Optional per-principal overrides via JSON env var:
//   GTCX_PRINCIPAL_BUDGETS_JSON='{"hq-test":{"qps":50,"dailyUsd":100}}'
function loadOverrides() {
  const raw = process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

let overrides = loadOverrides();

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function principalLimits(subject, tenantId = 'default') {
  // Override resolution order: tenant-scoped > subject-scoped > defaults.
  const tenantOverride = overrides[`tenant:${tenantId}`] || {};
  const subjectOverride = overrides[subject] || {};
  const merged = { ...tenantOverride, ...subjectOverride };
  return {
    qps: Number.isFinite(merged.qps) ? merged.qps : QPS_LIMIT,
    dailyUsd: Number.isFinite(merged.dailyUsd) ? merged.dailyUsd : DAILY_BUDGET_USD,
  };
}

function storeSubject(subject, tenantId = 'default') {
  return `${tenantId}:${subject}`;
}

/**
 * Check QPS and current spend BEFORE the LLM call. Records the request
 * for QPS purposes; spend is recorded separately via recordSpend.
 *
 * @param {string} subject
 * @returns {Promise<{ ok: true, limits: { qps: number, dailyUsd: number } } | { ok: false, status: 429, reason: 'qps' | 'budget', retryAfterSeconds?: number, limits: { qps: number, dailyUsd: number }, spentUsd: number }>}
 */
export async function checkBudget(subject, tenantId = 'default') {
  const limits = principalLimits(subject, tenantId);
  const store = await getBudgetStore();
  const scopedSubject = storeSubject(subject, tenantId);

  // QPS — sliding window.
  const hitCount = await store.recordQpsHit(scopedSubject, QPS_WINDOW_MS);
  const day = todayUtc();
  const spent = await store.readDailySpend(scopedSubject, day);
  if (hitCount > limits.qps) {
    return {
      ok: false,
      status: 429,
      reason: 'qps',
      retryAfterSeconds: Math.ceil(QPS_WINDOW_MS / 1000),
      limits,
      spentUsd: spent,
    };
  }

  // Budget — daily.
  if (spent >= limits.dailyUsd) {
    return {
      ok: false,
      status: 429,
      reason: 'budget',
      retryAfterSeconds: secondsUntilUtcMidnight(),
      limits,
      spentUsd: spent,
    };
  }

  return { ok: true, limits };
}

/**
 * Record actual USD spend after a request completes. Called from the
 * /v1/query success path with the estimated cost.
 *
 * @param {string} subject
 * @param {number} usd
 * @param {string} [tenantId]
 */
export async function recordSpend(subject, usd, tenantId = 'default') {
  if (!subject || !Number.isFinite(usd) || usd <= 0) return;
  const store = await getBudgetStore();
  const day = todayUtc();
  await store.addDailySpend(storeSubject(subject, tenantId), day, usd);
}

/**
 * Get current spend for a principal (for /v1/budget and metrics).
 *
 * @param {string} subject
 * @param {string} [tenantId]
 * @returns {Promise<{ day: string, subject: string, tenantId: string, spentUsd: number, limits: { qps: number, dailyUsd: number }, backend: string }>}
 */
export async function getSpend(subject, tenantId = 'default') {
  const store = await getBudgetStore();
  const day = todayUtc();
  return {
    day,
    subject,
    tenantId,
    spentUsd: await store.readDailySpend(storeSubject(subject, tenantId), day),
    limits: principalLimits(subject, tenantId),
    backend: store.info().backend,
  };
}

function secondsUntilUtcMidnight() {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  );
  return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Reset all in-process budget state (intended for tests only).
 */
export async function resetBudget() {
  await resetBudgetStoreForTests();
  overrides = loadOverrides();
}
