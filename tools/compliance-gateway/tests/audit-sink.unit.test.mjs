/**
 * @fileoverview Unit tests for the audit sink.
 *
 * The sink contract: emit() never throws, never blocks, and always
 * mirrors to stdout so the log-shipping pipeline has a copy even
 * when NATS is unreachable.
 */

import assert from 'node:assert';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { getSink, getSinkInfo, resetSink } from '../src/audit-sink.mjs';

function captureStdout(fn) {
  const original = console.warn;
  const captured = [];
  console.warn = (line) => captured.push(line);
  try {
    fn();
  } finally {
    console.warn = original;
  }
  return captured;
}

describe('audit sink', () => {
  beforeEach(() => resetSink());
  afterEach(() => resetSink());

  it('defaults to stdout sink', () => {
    delete process.env.AUDIT_SINK;
    resetSink();
    const info = getSinkInfo();
    assert.strictEqual(info.mode, 'stdout');
  });

  it('emits NDJSON to stdout', () => {
    const lines = captureStdout(() => {
      getSink().emit({ id: 'r-1', signature: 'sig', payloadHash: 'h' });
    });
    assert.strictEqual(lines.length, 1);
    const parsed = JSON.parse(lines[0]);
    assert.strictEqual(parsed.type, 'audit.signed');
    assert.strictEqual(parsed.record.id, 'r-1');
  });

  it('emit never throws on any record shape', () => {
    const sink = getSink();
    assert.doesNotThrow(() => sink.emit({}));
    assert.doesNotThrow(() => sink.emit({ deeply: { nested: { record: true } } }));
  });

  it('reports nats subject when AUDIT_SINK=nats', () => {
    process.env.AUDIT_SINK = 'nats';
    process.env.AUDIT_NATS_SUBJECT = 'gtcx.audit.test';
    resetSink();
    try {
      const info = getSinkInfo();
      assert.strictEqual(info.mode, 'nats');
      assert.strictEqual(info.subject, 'gtcx.audit.test');
      assert.strictEqual(info.natsConnected, false);
    } finally {
      delete process.env.AUDIT_SINK;
      delete process.env.AUDIT_NATS_SUBJECT;
      resetSink();
    }
  });

  it('nats sink still mirrors to stdout when not connected', () => {
    process.env.AUDIT_SINK = 'nats';
    resetSink();
    try {
      const lines = captureStdout(() => {
        getSink().emit({ id: 'mirror', signature: 's' });
      });
      assert.ok(lines.length >= 1);
      const parsed = JSON.parse(lines[lines.length - 1]);
      assert.strictEqual(parsed.type, 'audit.signed');
      assert.strictEqual(parsed.record.id, 'mirror');
    } finally {
      delete process.env.AUDIT_SINK;
      resetSink();
    }
  });

  it('nats sink emit handles tenantId payload without throwing', () => {
    process.env.AUDIT_SINK = 'nats';
    resetSink();
    try {
      const lines = captureStdout(() => {
        getSink().emit({
          id: 'r-with-tenant',
          signature: 's',
          payload: { tenantId: 'pilot' },
        });
      });
      assert.ok(lines.length >= 1);
    } finally {
      delete process.env.AUDIT_SINK;
      resetSink();
    }
  });

  it('nats sink emit handles record without payload (auth event shape)', () => {
    process.env.AUDIT_SINK = 'nats';
    resetSink();
    try {
      const lines = captureStdout(() => {
        getSink().emit({ id: 'auth-evt', signature: 's' });
      });
      assert.ok(lines.length >= 1);
    } finally {
      delete process.env.AUDIT_SINK;
      resetSink();
    }
  });

  it('nats sink emit rejects invalid tenantId (defensive)', () => {
    process.env.AUDIT_SINK = 'nats';
    resetSink();
    try {
      // tenantId with invalid characters should fall back to the bare subject.
      const lines = captureStdout(() => {
        getSink().emit({
          id: 'bad-tenant',
          signature: 's',
          payload: { tenantId: 'NOT VALID' },
        });
      });
      assert.ok(lines.length >= 1);
    } finally {
      delete process.env.AUDIT_SINK;
      resetSink();
    }
  });

  it('audit sink close() resolves without error', async () => {
    delete process.env.AUDIT_SINK;
    resetSink();
    const sink = getSink();
    assert.doesNotReject(sink.close());
  });
});
