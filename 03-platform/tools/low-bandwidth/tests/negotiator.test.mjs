import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  acceptsLowBandwidth,
  resolveLevel,
  mostRestrictive,
  encodingForLevel,
  replayWindowForLevel,
} from '../03-platform/src/negotiator.mjs';

describe('acceptsLowBandwidth', () => {
  it('returns true for gtcx-lbw-v1', () => {
    assert.strictEqual(acceptsLowBandwidth('gtcx-lbw-v1'), true);
  });

  it('returns true when mixed with other encodings', () => {
    assert.strictEqual(acceptsLowBandwidth('gzip, gtcx-lbw-v1, br'), true);
  });

  it('returns false for plain gzip', () => {
    assert.strictEqual(acceptsLowBandwidth('gzip, br'), false);
  });

  it('returns false for undefined', () => {
    assert.strictEqual(acceptsLowBandwidth(undefined), false);
  });

  it('returns false for empty string', () => {
    assert.strictEqual(acceptsLowBandwidth(''), false);
  });

  it('handles array headers', () => {
    assert.strictEqual(acceptsLowBandwidth(['gzip', 'gtcx-lbw-v1']), true);
  });

  it('handles non-string values', () => {
    assert.strictEqual(acceptsLowBandwidth(123), false);
  });
});

describe('resolveLevel', () => {
  it('defaults to normal', () => {
    assert.strictEqual(resolveLevel(), 'normal');
  });

  it('uses explicit mode when provided', () => {
    assert.strictEqual(resolveLevel({ mode: 'minimal' }), 'minimal');
    assert.strictEqual(resolveLevel({ mode: 'reduced' }), 'reduced');
    assert.strictEqual(resolveLevel({ mode: 'offline' }), 'offline');
  });

  it('is case-insensitive for mode', () => {
    assert.strictEqual(resolveLevel({ mode: 'MINIMAL' }), 'minimal');
    assert.strictEqual(resolveLevel({ mode: 'Reduced ' }), 'reduced');
  });

  it('falls back to header when mode invalid', () => {
    assert.strictEqual(resolveLevel({ mode: 'unknown', acceptEncoding: 'gtcx-lbw-v1' }), 'reduced');
  });

  it('falls back to normal when no signals', () => {
    assert.strictEqual(resolveLevel({ mode: 'invalid', acceptEncoding: 'gzip' }), 'normal');
  });

  it('prefers mode over header', () => {
    assert.strictEqual(resolveLevel({ mode: 'minimal', acceptEncoding: 'gtcx-lbw-v1' }), 'minimal');
  });
});

describe('mostRestrictive', () => {
  it('returns normal for empty array', () => {
    assert.strictEqual(mostRestrictive([]), 'normal');
  });

  it('returns normal for null/undefined', () => {
    assert.strictEqual(mostRestrictive(null), 'normal');
    assert.strictEqual(mostRestrictive(undefined), 'normal');
  });

  it('picks the most restrictive level', () => {
    assert.strictEqual(mostRestrictive(['normal', 'minimal']), 'minimal');
    assert.strictEqual(mostRestrictive(['reduced', 'normal']), 'reduced');
    assert.strictEqual(mostRestrictive(['offline', 'minimal']), 'offline');
  });

  it('ignores unknown levels', () => {
    assert.strictEqual(mostRestrictive(['normal', 'unknown', 'minimal']), 'minimal');
  });

  it('handles single item', () => {
    assert.strictEqual(mostRestrictive(['reduced']), 'reduced');
  });
});

describe('encodingForLevel', () => {
  it('maps all levels correctly', () => {
    assert.strictEqual(encodingForLevel('normal'), 'json');
    assert.strictEqual(encodingForLevel('reduced'), 'compact-json');
    assert.strictEqual(encodingForLevel('minimal'), 'minimal-binary');
    assert.strictEqual(encodingForLevel('offline'), 'none');
  });

  it('defaults to json for unknown', () => {
    assert.strictEqual(encodingForLevel('unknown'), 'json');
  });
});

describe('replayWindowForLevel', () => {
  it('returns 5 for normal', () => {
    assert.strictEqual(replayWindowForLevel('normal'), 5);
  });

  it('returns 15 for non-normal', () => {
    assert.strictEqual(replayWindowForLevel('reduced'), 15);
    assert.strictEqual(replayWindowForLevel('minimal'), 15);
    assert.strictEqual(replayWindowForLevel('offline'), 15);
  });

  it('defaults to 5 for unknown', () => {
    assert.strictEqual(replayWindowForLevel('bogus'), 5);
  });
});
