/**
 * @fileoverview Unit tests for the cost-router shim.
 *
 * The shim dynamically imports baseline-os/cost-router and falls back
 * to legacy routing on failure. Module-level caching and env-gated
 * loading mean we exercise most branches in child processes so each
 * test gets a fresh ESM cache.
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const PKG_ROOT = dirname(fileURLToPath(import.meta.url));
const BASELINE_ROUTER = join(
  PKG_ROOT,
  '../../../../baseline-os/packages/baselineos/dist/core/cost-router.js',
);

function ensureBaselineRouterStub() {
  if (!existsSync(BASELINE_ROUTER)) {
    mkdirSync(dirname(BASELINE_ROUTER), { recursive: true });
    writeFileSync(
      BASELINE_ROUTER,
      'export function routeInferenceRequest() { return null; }\n',
      'utf8',
    );
  }
}

function runInChild(code, env = {}) {
  return spawnSync(process.execPath, ['--eval', code], {
    cwd: dirname(PKG_ROOT),
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

describe('cost-router-shim — BASELINE_COST_ROUTER=0', () => {
  it('forces legacy-only routing and returns null', () => {
    const code = `
      import { selectProviderViaBaseline } from './src/cost-router-shim.mjs';
      const result = await selectProviderViaBaseline('hello', { getProviders: () => [] });
      console.log(JSON.stringify({ result }));
    `;
    const r = runInChild(code, { BASELINE_COST_ROUTER: '0' });
    assert.strictEqual(r.status, 0, r.stderr);
    const parsed = JSON.parse(r.stdout.trim());
    assert.strictEqual(parsed.result, null);
  });
});

describe('cost-router-shim — import failure fallback', () => {
  it('falls back to false when baseline-os module is missing', () => {
    ensureBaselineRouterStub();
    // Temporarily hide the real module so all candidate paths fail.
    const backup = BASELINE_ROUTER + '.bak';
    renameSync(BASELINE_ROUTER, backup);
    try {
      const code = `
        import { selectProviderViaBaseline } from './src/cost-router-shim.mjs';
        const result = await selectProviderViaBaseline('hello', { getProviders: () => [] });
        console.log(JSON.stringify({ result }));
      `;
      const r = runInChild(code);
      assert.strictEqual(r.status, 0, r.stderr);
      const parsed = JSON.parse(r.stdout.trim());
      assert.strictEqual(parsed.result, null);
    } finally {
      renameSync(backup, BASELINE_ROUTER);
    }
  });
});

describe('cost-router-shim — provider matching branches', () => {
  it('matches by registryId, model, provider, and returns null on no match', () => {
    ensureBaselineRouterStub();
    const original = readFileSync(BASELINE_ROUTER, 'utf8');
    const mock = `
      export function routeInferenceRequest({ prompt }) {
        if (prompt === 'by-id') return { registryId: 'prov-a', model: 'm-a', provider: 'p-a' };
        if (prompt === 'by-model') return { registryId: 'unknown', model: 'm-b', provider: 'p-b' };
        if (prompt === 'by-provider') return { registryId: 'unknown', model: 'unknown', provider: 'c' };
        if (prompt === 'no-match') return { registryId: 'unknown', model: 'unknown', provider: 'unknown' };
        return null;
      }
    `;
    writeFileSync(BASELINE_ROUTER, mock, 'utf8');
    try {
      const code = `
        import { selectProviderViaBaseline } from './src/cost-router-shim.mjs';
        const providers = [
          { name: 'prov-a', model: 'm-a' },
          { name: 'prov-b', model: 'm-b' },
          { name: 'other-c-name', model: 'm-c' },
        ];
        const byId = await selectProviderViaBaseline('by-id', { getProviders: () => providers });
        const byModel = await selectProviderViaBaseline('by-model', { getProviders: () => providers });
        const byProvider = await selectProviderViaBaseline('by-provider', { getProviders: () => providers });
        const noMatch = await selectProviderViaBaseline('no-match', { getProviders: () => providers });
        const noDecision = await selectProviderViaBaseline('no-decision', { getProviders: () => providers });
        console.log(JSON.stringify({ byId, byModel, byProvider, noMatch, noDecision }));
      `;
      const r = runInChild(code);
      assert.strictEqual(r.status, 0, r.stderr);
      const parsed = JSON.parse(r.stdout.trim());
      assert.deepStrictEqual(parsed.byId, { name: 'prov-a', model: 'm-a' });
      assert.deepStrictEqual(parsed.byModel, { name: 'prov-b', model: 'm-b' });
      assert.deepStrictEqual(parsed.byProvider, { name: 'other-c-name', model: 'm-c' });
      assert.strictEqual(parsed.noMatch, null);
      assert.strictEqual(parsed.noDecision, null);
    } finally {
      writeFileSync(BASELINE_ROUTER, original, 'utf8');
    }
  });
});
