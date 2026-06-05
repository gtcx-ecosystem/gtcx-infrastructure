import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  DEFAULT_DEV_TOKEN,
  authenticateHeaders,
  buildAccessProfile,
  loadAuthState,
  parseApprovalContext,
} from '../03-platform/src/auth.mjs';

describe('compliance-gateway auth', () => {
  it('fails closed in production when auth config is missing', () => {
    const authState = loadAuthState({ NODE_ENV: 'production' });
    assert.ok(authState.configurationError);
    const result = authenticateHeaders({}, authState, 'query:read');
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.status, 503);
  });

  it('uses a read-only default token in local development', () => {
    const authState = loadAuthState({ NODE_ENV: 'development' });
    assert.strictEqual(authState.defaulted, true);

    const auth = authenticateHeaders(
      { authorization: `Bearer ${DEFAULT_DEV_TOKEN}` },
      authState,
      'query:read'
    );
    assert.strictEqual(auth.ok, true);
    assert.ok(auth.principal);

    const access = buildAccessProfile(auth.principal, parseApprovalContext({}));
    assert.strictEqual(access.canQuery, true);
    assert.strictEqual(access.canMutate, false);
  });

  it('requires mutation permission and explicit approval metadata', () => {
    const authState = loadAuthState({
      NODE_ENV: 'test',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
        {
          token: 'mutate-token',
          subject: 'security-operator',
          permissions: ['query:read', 'query:mutate', 'tools:read', 'providers:read'],
        },
      ]),
    });

    const auth = authenticateHeaders(
      { authorization: 'Bearer mutate-token' },
      authState,
      'query:read'
    );
    assert.strictEqual(auth.ok, true);
    assert.ok(auth.principal);

    const withoutApproval = buildAccessProfile(auth.principal, parseApprovalContext({}));
    assert.strictEqual(withoutApproval.canMutate, false);

    const withApproval = buildAccessProfile(auth.principal, parseApprovalContext({
      'x-gtcx-approval-ticket': 'GTCX-123',
      'x-gtcx-approved-by': 'security-lead',
      'x-gtcx-approval-reason': 'credential remediation',
      'x-idempotency-key': 'idem-123',
    }));
    assert.strictEqual(withApproval.canMutate, true);
  });
});
