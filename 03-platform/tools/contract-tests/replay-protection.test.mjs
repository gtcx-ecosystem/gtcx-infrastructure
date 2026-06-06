import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { replayGuardMiddleware } from '../replay-protection/src/middleware.mjs';

describe('replay-protection contract', () => {
  it('refuses construction without verifySignature by default', () => {
    assert.throws(
      () =>
        replayGuardMiddleware({
          nonceStore: { consume: async () => true },
        }),
      /verifySignature is required/
    );
  });
});
