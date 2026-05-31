import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { stripEnvPrefix } from './runbook-commands-check.mjs';

describe('runbook-commands-check stripEnvPrefix', () => {
  it('strips a single FOO=1 prefix', () => {
    assert.equal(stripEnvPrefix('FOO=1 pnpm test'), 'pnpm test');
  });

  it('strips multiple env-var assignments', () => {
    assert.equal(
      stripEnvPrefix('NODE_ENV=production GTCX_REGION=af-south-1 pnpm ctl deploy plan'),
      'pnpm ctl deploy plan',
    );
  });

  it('strips quoted-value env assignments (no whitespace in value)', () => {
    assert.equal(stripEnvPrefix('LOG_LEVEL=warn pnpm test'), 'pnpm test');
  });

  it('leaves lines without env prefix unchanged', () => {
    assert.equal(stripEnvPrefix('pnpm test'), 'pnpm test');
  });

  it('does NOT mistake `name: value` (config style) for env prefix', () => {
    // env prefix requires `=`, not `:` — config lines must pass through.
    assert.equal(stripEnvPrefix('name: value pnpm test'), 'name: value pnpm test');
  });
});
