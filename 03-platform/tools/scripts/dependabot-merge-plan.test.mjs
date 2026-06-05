import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { classifyPr, summarizeReadiness } from './dependabot-merge-plan.mjs';

describe('dependabot-merge-plan', () => {
  it('classifies tiers and rejects @types/node majors', () => {
    assert.equal(classifyPr('chore(deps): bump tinyexec from 1.2.2 to 1.2.4'), 'tier1');
    assert.equal(classifyPr('chore(deps): bump @eslint/js from 9.28.0 to 9.39.4'), 'tier2');
    assert.equal(classifyPr('chore(deps): bump ai from 5.0.192 to 6.0.193'), 'tier4-batch');
    assert.equal(classifyPr('chore(deps): bump @types/node from 22 to 25'), 'reject');
  });

  it('flags tier1 blocked when CI is red', () => {
    const prs = [{ number: 80, title: 'chore(deps): bump tinyexec from 1.2.2 to 1.2.4' }];
    const checks = new Map([[80, [{ name: 'ci', state: 'FAIL' }]]]);
    const { failures } = summarizeReadiness(prs, checks);
    assert.ok(failures.some((f) => f.includes('tier1 blocked')));
  });
});
