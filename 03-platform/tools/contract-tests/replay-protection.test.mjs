import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { replayGuardMiddleware } from '../replay-protection/03-platform/src/middleware.mjs';

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
