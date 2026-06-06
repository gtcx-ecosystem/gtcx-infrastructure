import assert from 'node:assert';
import { describe, it } from 'node:test';

import { getTrafficBlockReason } from '../src/runtime-policy.mjs';

describe('Replay Guard runtime policy', () => {
  it('does not block traffic in development without Redis', () => {
    assert.strictEqual(getTrafficBlockReason({
      nodeEnv: 'development',
      redisConfigured: false,
      redisConnected: false,
    }), null);
  });

  it('blocks production traffic when REDIS_URL is missing', () => {
    assert.match(
      getTrafficBlockReason({
        nodeEnv: 'production',
        redisConfigured: false,
        redisConnected: false,
      }) ?? '',
      /REDIS_URL is not set/
    );
  });

  it('blocks production traffic when Redis is unavailable', () => {
    assert.match(
      getTrafficBlockReason({
        nodeEnv: 'production',
        redisConfigured: true,
        redisConnected: false,
      }) ?? '',
      /Redis connectivity is restored/
    );
  });
});
