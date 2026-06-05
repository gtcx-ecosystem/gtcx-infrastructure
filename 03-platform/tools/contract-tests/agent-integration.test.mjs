/**
 * SIGNAL INF-009 — agent integration smoke (no live LLM / cluster).
 */
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { getPromptMetadata, PROMPT_VERSION } from '../compliance-gateway/03-platform/src/system-prompt.mjs';
import { recordLlmTrace } from '../compliance-gateway/03-platform/src/llm-trace.mjs';
import { runStaticChecks } from '../eval-pipeline/injection-suite.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('agent integration smoke', () => {
  it('agent:next-work emits traceId', () => {
    const out = execSync('node 03-platform/scripts/agent-next-work.mjs', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    const json = JSON.parse(out);
    assert.equal(json.ok, true);
    assert.match(json.traceId, /^[0-9a-f-]{36}$/i);
  });

  it('injection-suite static checks pass', () => {
    const results = runStaticChecks();
    assert.ok(results.length >= 10);
    for (const r of results) {
      assert.equal(r.schemaPassed, true, r.id);
      assert.equal(r.hasDelimiter, true, r.id);
      assert.equal(r.hasEndDelimiter, true, r.id);
    }
  });

  it('prompt semver manifest exists', () => {
    assert.equal(PROMPT_VERSION, '1.0.0');
    const manifest = join(
      ROOT,
      `01-docs/05-audit/prompts/compliance-gateway@${PROMPT_VERSION}/manifest.json`,
    );
    assert.equal(existsSync(manifest), true);
    assert.equal(getPromptMetadata().engine, 'compliance-gateway');
  });

  it('llm-trace shim loads', () => {
    const r = recordLlmTrace({ traceId: '00000000-0000-4000-8000-000000000001' });
    assert.equal(r.backend, 'none');
  });
});
