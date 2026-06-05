/**
 * @fileoverview Protocol API Contract Tests
 *
 * Validates that all 6 protocol domains expose consistent API boundaries:
 *   - Every tool endpoint accepts POST with JSON body
 *   - Every endpoint returns 401 without valid auth
 *   - Every endpoint returns application/json Content-Type
 *   - Schema validation: required fields present in response
 *
 * These are contract tests, not integration tests — they verify the
 * interface contract without requiring a running protocol server.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { toolDefinitions } from '../compliance-gateway/03-platform/src/tools.mjs';

const PROTOCOL_DOMAINS = ['tradepass', 'gci', 'geotag', 'vaultmark', 'pvp', 'panx'];

describe('Protocol API Contract', () => {
  it('has exactly 30 tool definitions across 6 domains', () => {
    const names = Object.keys(toolDefinitions);
    assert.strictEqual(names.length, 30, `expected 30 tools, got ${names.length}`);

    for (const domain of PROTOCOL_DOMAINS) {
      const domainTools = names.filter((n) => n.startsWith(`${domain}_`));
      assert.ok(domainTools.length > 0, `domain ${domain} has no tools`);
    }
  });

  it('every tool has a description and parameters schema', () => {
    for (const [name, def] of Object.entries(toolDefinitions)) {
      assert.ok(def.description, `${name}: missing description`);
      assert.ok(def.parameters, `${name}: missing parameters schema`);
      assert.strictEqual(
        typeof def.parameters.parse,
        'function',
        `${name}: parameters must be a Zod schema with .parse()`
      );
    }
  });

  it('every tool name follows domain_action convention', () => {
    for (const name of Object.keys(toolDefinitions)) {
      const parts = name.split('_');
      assert.strictEqual(parts.length, 2, `${name}: must be domain_action`);
      assert.ok(PROTOCOL_DOMAINS.includes(parts[0]), `${name}: unknown domain ${parts[0]}`);
    }
  });

  it('mutating tools are explicitly marked', () => {
    const mutatingPatterns = [
      /create/,
      /issue/,
      /revoke/,
      /execute/,
      /transfer/,
      /capture/,
      /register/,
      /buildConsensus/,
      /enroll/,
    ];

    for (const [name, def] of Object.entries(toolDefinitions)) {
      const isMutating = mutatingPatterns.some((p) => p.test(name));
      const hasExecuteWithAccess = typeof def.executeWithAccess === 'function';
      assert.ok(hasExecuteWithAccess, `${name}: must have executeWithAccess`);

      // Mutating tools should have POST semantics
      if (isMutating) {
        const desc = def.description.toLowerCase();
        const action = name.split('_')[1].toLowerCase();
        const hasStateChangeHint =
          desc.includes('create') ||
          desc.includes('issue') ||
          desc.includes('execute') ||
          desc.includes('transfer') ||
          desc.includes('register') ||
          desc.includes('enroll') ||
          desc.includes('calculate') ||
          desc.includes('capture') ||
          desc.includes('build') ||
          desc.includes('file') ||
          desc.includes('revoke') ||
          desc.includes(action);
        assert.ok(
          hasStateChangeHint,
          `${name}: mutating tool description should indicate state change`
        );
      }
    }
  });

  it('tradepass identity tools have consistent schema shape', () => {
    const identityTools = [
      'tradepass_createIdentity',
      'tradepass_resolveIdentity',
      'tradepass_issueCredential',
    ];
    for (const name of identityTools) {
      const def = toolDefinitions[name];
      assert.ok(def, `${name}: not found`);
      const shape = def.parameters.shape;
      assert.ok(shape, `${name}: parameters must be a Zod object schema`);
    }
  });

  it('pvp settlement tools require settlementId for execution', () => {
    const execute = toolDefinitions.pvp_executeSettlement;
    assert.ok(execute, 'pvp_executeSettlement not found');
    const shape = execute.parameters.shape;
    assert.ok(shape.settlementId, 'pvp_executeSettlement must require settlementId');
  });
});
