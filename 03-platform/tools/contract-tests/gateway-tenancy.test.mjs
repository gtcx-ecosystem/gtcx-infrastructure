import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  getExceptions,
  initAuditSigner,
  resetAuditSigner,
  signAuditEvent,
} from '../compliance-gateway/src/audit.mjs';

function silence(fn) {
  const out = console.log;
  const err = console.error;
  console.log = () => {};
  console.error = () => {};
  try {
    return fn();
  } finally {
    console.log = out;
    console.error = err;
  }
}

describe('gateway tenancy contract', () => {
  beforeEach(() => {
    resetAuditSigner();
    initAuditSigner({ NODE_ENV: 'test' }, true);
  });
  afterEach(() => resetAuditSigner());

  it('isolates platform auth-failure events from tenant principals', () => {
    silence(() => {
      signAuditEvent({
        actor: 'unknown',
        action: 'auth:failure',
        target: '/v1/query',
        tenantId: 'platform',
        payload: { tenantId: 'platform', sourceIp: '10.0.0.1' },
      });
    });
    assert.equal(getExceptions({ tenantId: 'platform' }).totalExceptions, 1);
    assert.equal(getExceptions({ tenantId: 'zw' }).totalExceptions, 0);
    assert.equal(getExceptions({ tenantId: 'ke' }).totalExceptions, 0);
  });
});
