/**
 * @fileoverview Coverage-focused tests for fail-closed branches not
 * exercised by the main test file.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import { failClosed, failClosedSync } from '../src/fail-closed.mjs';

describe('failClosedSync — onStub failure', () => {
  it('logs onStub failures in the sync variant', () => {
    const logs = [];
    const result = failClosedSync(
      'gateway.sync.stub',
      () => {
        throw new Error('primary failure');
      },
      {
        onError: 'log-and-return-null',
        onStub: () => {
          throw new Error('stub failure');
        },
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.deepStrictEqual(
      logs.map((entry) => entry.type),
      ['failClosed.failure', 'failClosed.onStub.failure']
    );
  });
});

describe('failClosed — non-Error throws', () => {
  it('handles non-Error throws in async variant', async () => {
    const logs = [];
    const result = await failClosed(
      'gateway.non-error',
      () => {
        throw 'string error';
      },
      {
        onError: 'log-and-return-null',
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.strictEqual(logs[0].error, 'string error');
  });

  it('handles non-Error throws in sync variant', () => {
    const logs = [];
    const result = failClosedSync(
      'gateway.sync.non-error',
      () => {
        throw 42;
      },
      {
        onError: 'log-and-return-null',
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.strictEqual(logs[0].error, '42');
  });

  it('logs non-Error onStub failures in async variant', async () => {
    const logs = [];
    await failClosed(
      'gateway.stub.non-error',
      () => {
        throw new Error('primary');
      },
      {
        onError: 'log-and-return-null',
        onStub: () => {
          throw 'stub string';
        },
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(logs[1].error, 'stub string');
  });

  it('logs non-Error onStub failures in sync variant', () => {
    const logs = [];
    failClosedSync(
      'gateway.sync.stub.non-error',
      () => {
        throw new Error('primary');
      },
      {
        onError: 'log-and-return-null',
        onStub: () => {
          throw 42;
        },
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(logs[1].error, '42');
  });
});

describe('failClosedSync — rethrow-in-production non-production', () => {
  it('returns null in development for rethrow-in-production mode', () => {
    const logs = [];
    const result = failClosedSync(
      'gateway.sync.rip.dev',
      () => {
        throw new Error('dev error');
      },
      {
        onError: 'rethrow-in-production',
        nodeEnv: 'development',
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.strictEqual(logs[0].mode, 'rethrow-in-production');
  });
});

describe('failClosed — default logger', () => {
  it('uses console.error when no logger is provided', async () => {
    const original = console.error;
    const logs = [];
    console.error = (line) => logs.push(line);
    try {
      await failClosed('gateway.default', async () => {
        throw new Error('default log');
      }, { onError: 'log-and-return-null' });
      assert.ok(logs.length >= 1);
      const parsed = JSON.parse(logs[0]);
      assert.strictEqual(parsed.type, 'failClosed.failure');
      assert.strictEqual(parsed.error, 'default log');
    } finally {
      console.error = original;
    }
  });
});
