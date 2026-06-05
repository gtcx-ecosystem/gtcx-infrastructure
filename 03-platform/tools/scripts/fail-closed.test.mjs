import assert from 'node:assert';
import { describe, it } from 'node:test';

import { failClosed } from './fail-closed.mjs';

const noopLogger = () => {};

describe('failClosed', () => {
  it('returns the value on success', async () => {
    const result = await failClosed('test.success', () => 42, { logger: noopLogger });
    assert.strictEqual(result, 42);
  });

  it('awaits async functions', async () => {
    const result = await failClosed('test.async', async () => 'ok', { logger: noopLogger });
    assert.strictEqual(result, 'ok');
  });

  it('rethrows by default (mode: rethrow)', async () => {
    await assert.rejects(
      () => failClosed('test.rethrow', () => { throw new Error('boom'); }, { logger: noopLogger }),
      /boom/,
    );
  });

  it('rethrows in production when mode is rethrow-in-production', async () => {
    await assert.rejects(
      () =>
        failClosed('test.prod', () => { throw new Error('prod-boom'); }, {
          onError: 'rethrow-in-production',
          nodeEnv: 'production',
          logger: noopLogger,
        }),
      /prod-boom/,
    );
  });

  it('returns null outside production when mode is rethrow-in-production', async () => {
    const result = await failClosed('test.dev', () => { throw new Error('dev-boom'); }, {
      onError: 'rethrow-in-production',
      nodeEnv: 'development',
      logger: noopLogger,
    });
    assert.strictEqual(result, null);
  });

  it('always returns null when mode is log-and-return-null', async () => {
    const result = await failClosed('test.lognull', () => { throw new Error('always'); }, {
      onError: 'log-and-return-null',
      nodeEnv: 'production',
      logger: noopLogger,
    });
    assert.strictEqual(result, null);
  });

  it('invokes onStub when returning null', async () => {
    let stubCalled = false;
    await failClosed('test.stub', () => { throw new Error('x'); }, {
      onError: 'log-and-return-null',
      onStub: () => { stubCalled = true; },
      logger: noopLogger,
    });
    assert.strictEqual(stubCalled, true);
  });

  it('emits a structured loud log line on every failure', async () => {
    const captured = [];
    const logger = (payload) => captured.push(payload);
    await failClosed('test.log', () => { throw new Error('logged'); }, {
      onError: 'log-and-return-null',
      logger,
    });
    assert.strictEqual(captured.length, 1);
    assert.strictEqual(captured[0].name, 'test.log');
    assert.strictEqual(captured[0].error, 'logged');
    assert.strictEqual(captured[0].type, 'failClosed.failure');
  });

  it('does NOT provide a silent-swallow mode', async () => {
    // This is a behavioral test of the API surface — if someone adds
    // `mode: 'silent'` later, it must NOT be honored. We assert that
    // an unknown mode falls back to rethrow (the safest default).
    await assert.rejects(
      () =>
        failClosed('test.unknown', () => { throw new Error('caught'); }, {
          // @ts-expect-error intentional invalid mode
          onError: 'silent',
          logger: noopLogger,
        }),
      /caught/,
    );
  });
});
