/**
 * @fileoverview Auth and Policy Branch Coverage Tests
 *
 * Targets the error-handling and edge-case branches in auth.mjs and policy.mjs
 * that are not exercised by the happy-path integration tests.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  loadAuthState,
  getHeader,
  parseBearerToken,
  authenticateHeaders,
} from '../src/auth.mjs';
import { canAccessTool, buildRuntimePolicyPrompt } from '../src/policy.mjs';

describe('loadAuthState edge cases', () => {
  it('returns configuration error for invalid JSON', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: 'not-json',
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('Invalid'));
  });

  it('returns configuration error for empty array', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: '[]',
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('non-empty array'));
  });

  it('returns configuration error for non-array wrapper', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: '{"tokens": []}',
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('non-empty array'));
  });

  it('returns configuration error when entry is not an object', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify(['string-entry']),
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('must be an object'));
  });

  it('returns configuration error when token is missing', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([{ subject: 'x', permissions: ['p'] }]),
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('token, subject, and at least one permission'));
  });

  it('returns configuration error when subject is missing', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([{ token: 'x', permissions: ['p'] }]),
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('token, subject, and at least one permission'));
  });

  it('returns configuration error when permissions are empty', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([{ token: 'x', subject: 'y', permissions: [] }]),
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('token, subject, and at least one permission'));
  });

  it('returns configuration error for duplicate subjects', () => {
    const state = loadAuthState({
      NODE_ENV: 'production',
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
        { token: 'a', subject: 'dup', permissions: ['p'] },
        { token: 'b', subject: 'dup', permissions: ['p'] },
      ]),
    });
    assert.strictEqual(state.tokens.length, 0);
    assert.ok(state.configurationError.includes('duplicate auth subject'));
  });

  it('uses default dev token in development when env is missing', () => {
    const state = loadAuthState({ NODE_ENV: 'development' });
    assert.strictEqual(state.defaulted, true);
    assert.strictEqual(state.tokens.length, 1);
    assert.strictEqual(state.tokens[0].subject, 'local-dev-readonly');
  });

  it('falls back to default when NODE_ENV is undefined', () => {
    const state = loadAuthState({});
    assert.strictEqual(state.defaulted, true);
    assert.strictEqual(state.tokens[0].subject, 'local-dev-readonly');
  });

  it('uses label when provided', () => {
    const state = loadAuthState({
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
        { token: 'a', subject: 's', permissions: ['p'], label: 'My Label' },
      ]),
    });
    assert.strictEqual(state.tokens[0].label, 'My Label');
  });

  it('falls back to subject when label is empty', () => {
    const state = loadAuthState({
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
        { token: 'a', subject: 's', permissions: ['p'], label: '' },
      ]),
    });
    assert.strictEqual(state.tokens[0].label, 's');
  });

  it('filters out non-string permissions', () => {
    const state = loadAuthState({
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([
        { token: 'a', subject: 's', permissions: ['p', 123, '', 'valid'] },
      ]),
    });
    assert.deepStrictEqual(state.tokens[0].permissions, ['p', 'valid']);
  });
});

describe('getHeader', () => {
  it('returns first element for array header', () => {
    assert.strictEqual(getHeader({ 'x-custom': ['first', 'second'] }, 'x-custom'), 'first');
  });

  it('returns null for empty array header', () => {
    assert.strictEqual(getHeader({ 'x-custom': [] }, 'x-custom'), null);
  });

  it('returns null for undefined header', () => {
    assert.strictEqual(getHeader({}, 'x-missing'), null);
  });

  it('is case-insensitive', () => {
    assert.strictEqual(getHeader({ 'content-type': 'application/json' }, 'Content-Type'), 'application/json');
  });
});

describe('parseBearerToken', () => {
  it('returns null for null header', () => {
    assert.strictEqual(parseBearerToken(null), null);
  });

  it('returns null for non-Bearer prefix', () => {
    assert.strictEqual(parseBearerToken('Basic abc'), null);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(parseBearerToken(''), null);
  });

  it('handles lowercase bearer', () => {
    assert.strictEqual(parseBearerToken('bearer tok-en_123'), 'tok-en_123');
  });
});

describe('authenticateHeaders edge cases', () => {
  it('returns 503 when auth is misconfigured', () => {
    const authState = loadAuthState({ NODE_ENV: 'production', COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: 'bad' });
    const result = authenticateHeaders({}, authState, 'query:read');
    assert.strictEqual(result.status, 503);
    assert.ok(result.error.includes('Invalid'));
  });

  it('returns 401 when authorization header is missing', () => {
    const authState = loadAuthState({
      COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: JSON.stringify([{ token: 't', subject: 's', permissions: ['query:read'] }]),
    });
    const result = authenticateHeaders({}, authState, 'query:read');
    assert.strictEqual(result.status, 401);
    assert.ok(result.error.includes('Missing bearer token'));
  });
});

describe('canAccessTool branches', () => {
  it('returns false when canQuery is false', () => {
    assert.strictEqual(canAccessTool('anyTool', { canQuery: false, canMutate: true }), false);
  });

  it('returns true for read-only tools when canQuery is true', () => {
    assert.strictEqual(canAccessTool('tradepass_resolveIdentity', { canQuery: true, canMutate: false }), true);
  });

  it('returns false for mutating tools when canMutate is false', () => {
    assert.strictEqual(canAccessTool('pvp_executeSettlement', { canQuery: true, canMutate: false }), false);
  });

  it('returns true for mutating tools when canMutate is true', () => {
    assert.strictEqual(canAccessTool('pvp_executeSettlement', { canQuery: true, canMutate: true }), true);
  });
});

describe('buildRuntimePolicyPrompt branches', () => {
  it('includes mutating instructions when canMutate is true', () => {
    const prompt = buildRuntimePolicyPrompt({
      canMutate: true,
      permissions: ['query:read', 'query:mutate'],
      subject: 'test-op',
      approval: { ticket: 'GTCX-123' },
    });
    assert.ok(prompt.includes('Mutating tools are enabled'));
    assert.ok(prompt.includes('GTCX-123'));
  });

  it('includes disabled instructions when canMutate is false', () => {
    const prompt = buildRuntimePolicyPrompt({
      canMutate: false,
      permissions: ['query:read'],
      subject: 'test-op',
      approval: { ticket: null },
    });
    assert.ok(prompt.includes('DISABLED'));
  });

  it('shows none for empty permissions', () => {
    const prompt = buildRuntimePolicyPrompt({
      canMutate: false,
      permissions: [],
      subject: 'test-op',
      approval: { ticket: null },
    });
    assert.ok(prompt.includes('Caller permissions: none'));
  });
});
