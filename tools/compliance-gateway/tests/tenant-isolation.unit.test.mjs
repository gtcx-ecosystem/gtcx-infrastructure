/**
 * @fileoverview Tenant boundary tests.
 *
 * Verifies that:
 *   1. Tokens carry tenantId from the JSON config to the principal.
 *   2. Tokens without tenantId default to 'default' (legacy behavior).
 *   3. Budget overrides resolve in tenant → subject → default order.
 *   4. getSpend reports tenantId in its result.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  buildEvidenceBundle,
  initAuditSigner,
  resetAuditSigner,
  signAuditEvent,
} from '../src/audit.mjs';
import {
  loadAuthState,
  authenticateHeaders,
  buildAccessProfile,
  parseApprovalContext,
} from '../src/auth.mjs';
import { checkBudget, getSpend, resetBudget } from '../src/budget.mjs';

function tokensFor(env) {
  return {
    COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
      {
        token: 'tenant-a-tok',
        subject: 'tenant-a-ops',
        permissions: ['query:read'],
        tenantId: 'tenant-a',
      },
      {
        token: 'tenant-b-tok',
        subject: 'tenant-b-ops',
        permissions: ['query:read'],
        tenantId: 'tenant-b',
      },
      {
        token: 'legacy-tok',
        subject: 'legacy-ops',
        permissions: ['query:read'],
      },
    ]),
    ...env,
  };
}

describe('tenant boundary — auth', () => {
  it('stamps tenantId on the principal when the config provides it', () => {
    const state = loadAuthState(tokensFor({ NODE_ENV: 'test' }));
    assert.strictEqual(state.configurationError, null);

    const auth = authenticateHeaders({ authorization: 'Bearer tenant-a-tok' }, state, 'query:read');
    assert.strictEqual(auth.ok, true);
    assert.strictEqual(auth.principal.tenantId, 'tenant-a');
  });

  it("defaults tenantId to 'default' when the config omits it", () => {
    const state = loadAuthState(tokensFor({ NODE_ENV: 'test' }));
    const auth = authenticateHeaders({ authorization: 'Bearer legacy-tok' }, state, 'query:read');
    assert.strictEqual(auth.ok, true);
    assert.strictEqual(auth.principal.tenantId, 'default');
  });

  it('buildAccessProfile carries tenantId through', () => {
    const state = loadAuthState(tokensFor({ NODE_ENV: 'test' }));
    const auth = authenticateHeaders({ authorization: 'Bearer tenant-b-tok' }, state, 'query:read');
    const profile = buildAccessProfile(auth.principal, parseApprovalContext({}));
    assert.strictEqual(profile.tenantId, 'tenant-b');
  });
});

describe('tenant boundary — budget', () => {
  beforeEach(async () => {
    await resetBudget();
  });
  afterEach(async () => {
    delete process.env.GTCX_PRINCIPAL_BUDGETS_JSON;
    await resetBudget();
  });

  it('applies tenant-scoped overrides via tenant:<id> key', async () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = JSON.stringify({
      'tenant:big-tenant': { qps: 100, dailyUsd: 500 },
    });
    await resetBudget();
    const r = await checkBudget('any-subject', 'big-tenant');
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.limits.qps, 100);
    assert.strictEqual(r.limits.dailyUsd, 500);
  });

  it('subject-scoped override takes precedence over tenant-scoped', async () => {
    process.env.GTCX_PRINCIPAL_BUDGETS_JSON = JSON.stringify({
      'tenant:t1': { qps: 100, dailyUsd: 100 },
      'subject-a': { qps: 5, dailyUsd: 1 },
    });
    await resetBudget();
    const r = await checkBudget('subject-a', 't1');
    assert.strictEqual(r.limits.qps, 5);
    assert.strictEqual(r.limits.dailyUsd, 1);
  });

  it('getSpend returns the tenantId', async () => {
    const s = await getSpend('a', 'demo-tenant');
    assert.strictEqual(s.tenantId, 'demo-tenant');
  });
});

describe('tenant boundary — evidence bundle (regression for default leak)', () => {
  function silence(fn) {
    const out = console.warn;
    const err = console.error;
    console.warn = () => {};
    console.error = () => {};
    try {
      return fn();
    } finally {
      console.warn = out;
      console.error = err;
    }
  }

  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('does NOT return tenant-a records when caller is tenantId=default', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'global', target: 'x', tenantId: 'default' });
      signAuditEvent({ actor: 'b', action: 'mining', target: 'y', tenantId: 'tenant-a' });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'default' });
    assert.strictEqual(bundle.recordCount, 1, 'default principal must not see tenant-a records');
  });

  it('does NOT return tenant-b records to a tenant-a principal', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'event', target: 'x', tenantId: 'tenant-a' });
      signAuditEvent({ actor: 'b', action: 'event', target: 'y', tenantId: 'tenant-b' });
    });
    const bundle = buildEvidenceBundle({ tenantId: 'tenant-a' });
    assert.strictEqual(bundle.recordCount, 1);
    assert.strictEqual(bundle.tenantId, 'tenant-a');
  });

  it('refuses to build a bundle without an explicit tenantId', () => {
    silence(() => {
      signAuditEvent({ actor: 'a', action: 'evt', target: 'x', tenantId: 'tenant-a' });
    });
    assert.throws(() => buildEvidenceBundle({}), /tenantId is required/);
  });
});
