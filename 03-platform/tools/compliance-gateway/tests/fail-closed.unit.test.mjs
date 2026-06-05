import assert from 'node:assert';
import { describe, it } from 'node:test';

import { failClosed, failClosedSync } from '../03-platform/src/fail-closed.mjs';

const noopLogger = () => {};

describe('failClosed runtime helper', () => {
  it('returns async values on success', async () => {
    const result = await failClosed('gateway.success', async () => 'ok', { logger: noopLogger });
    assert.strictEqual(result, 'ok');
  });

  it('logs and returns null when configured for fallback', async () => {
    const logs = [];
    const result = await failClosed(
      'gateway.fallback',
      () => {
        throw new Error('missing optional catalog');
      },
      {
        onError: 'log-and-return-null',
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.strictEqual(logs[0].type, 'failClosed.failure');
    assert.strictEqual(logs[0].name, 'gateway.fallback');
  });

  it('rethrows in production for rethrow-in-production mode', async () => {
    await assert.rejects(
      () =>
        failClosed(
          'gateway.prod',
          () => {
            throw new Error('prod failure');
          },
          {
            onError: 'rethrow-in-production',
            nodeEnv: 'production',
            logger: noopLogger,
          }
        ),
      /prod failure/
    );
  });

  it('logs onStub failures explicitly', async () => {
    const logs = [];
    const result = await failClosed(
      'gateway.stub',
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

describe('failClosedSync runtime helper', () => {
  it('returns sync values on success', () => {
    const result = failClosedSync('gateway.sync.success', () => 42, { logger: noopLogger });
    assert.strictEqual(result, 42);
  });

  it('logs and returns null when configured for fallback', () => {
    const logs = [];
    const result = failClosedSync(
      'gateway.sync.fallback',
      () => {
        throw new Error('bad ndjson');
      },
      {
        onError: 'log-and-return-null',
        logger: (payload) => logs.push(payload),
      }
    );
    assert.strictEqual(result, null);
    assert.strictEqual(logs[0].type, 'failClosed.failure');
  });

  it('rethrows unknown modes instead of silently swallowing', () => {
    assert.throws(
      () =>
        failClosedSync(
          'gateway.sync.unknown',
          () => {
            throw new Error('unknown mode');
          },
          {
            // @ts-expect-error intentional invalid mode
            onError: 'silent',
            logger: noopLogger,
          }
        ),
      /unknown mode/
    );
  });
});
