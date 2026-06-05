/**
 * @fileoverview Unit tests for the zero-dependency Prometheus emitter.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import {
  incrementCounter,
  setGauge,
  renderMetrics,
  resetMetrics,
} from '../03-platform/src/metrics.mjs';

describe('metrics', () => {
  beforeEach(() => resetMetrics());
  afterEach(() => resetMetrics());

  it('renders a counter with HELP and TYPE', () => {
    incrementCounter('compliance_gateway_audit_records_total', { action: 'auth:success' });
    const out = renderMetrics();
    assert.match(out, /# HELP compliance_gateway_audit_records_total/);
    assert.match(out, /# TYPE compliance_gateway_audit_records_total counter/);
    assert.match(out, /compliance_gateway_audit_records_total\{action="auth:success"\} 1/);
  });

  it('sums repeated increments under identical labels', () => {
    incrementCounter('compliance_gateway_requests_total', { route: '/v1/query', status: '200' });
    incrementCounter('compliance_gateway_requests_total', { route: '/v1/query', status: '200' });
    incrementCounter('compliance_gateway_requests_total', { route: '/v1/query', status: '200' }, 3);
    const out = renderMetrics();
    assert.match(out, /compliance_gateway_requests_total\{route="\/v1\/query",status="200"\} 5/);
  });

  it('renders a gauge', () => {
    setGauge('compliance_gateway_audit_chain_in_memory', undefined, 42);
    const out = renderMetrics();
    assert.match(out, /# TYPE compliance_gateway_audit_chain_in_memory gauge/);
    assert.match(out, /compliance_gateway_audit_chain_in_memory 42/);
  });

  it('escapes quotes and newlines in label values', () => {
    incrementCounter('compliance_gateway_requests_total', { route: 'weird"path\nwith-newline', status: '500' });
    const out = renderMetrics();
    assert.match(out, /\\"/);
    assert.match(out, /\\n/);
  });

  it('truncates very long label values', () => {
    const longPath = 'x'.repeat(200);
    incrementCounter('compliance_gateway_requests_total', { route: longPath, status: '200' });
    const out = renderMetrics();
    // 64-char cap defined in escapeLabel
    const match = out.match(/route="([^"]+)"/);
    assert.ok(match);
    assert.ok(match[1].length <= 64);
  });
});
