import assert from 'node:assert';
import { describe, it } from 'node:test';

import {
  buildRuntimePolicyPrompt,
  canAccessTool,
  isMutatingToolName,
} from '../03-platform/src/policy.mjs';

describe('compliance-gateway tool policy', () => {
  it('classifies consequential settlement execution as mutating', () => {
    assert.strictEqual(isMutatingToolName('pvp_executeSettlement'), true);
    assert.strictEqual(isMutatingToolName('pvp_getSettlementSummary'), false);
  });

  it('hides mutating tools from read-only callers', () => {
    const readOnly = { canMutate: false, canQuery: true };
    assert.strictEqual(canAccessTool('tradepass_resolveIdentity', readOnly), true);
    assert.strictEqual(canAccessTool('tradepass_issueCredential', readOnly), false);
  });

  it('renders a deny-mutating runtime policy statement when approval is absent', () => {
    const prompt = buildRuntimePolicyPrompt({
      approval: { ticket: null },
      canMutate: false,
      permissions: ['query:read'],
      subject: 'auditor',
    });
    assert.match(prompt, /Mutating tools are DISABLED/);
  });
});
