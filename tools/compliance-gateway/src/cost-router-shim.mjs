/**
 * BaselineOS cost-router shim — canonical routing for compliance-gateway.
 *
 * When baseline-os is built, uses routeInferenceRequest() from baselineos/cost-router.
 * Falls back to legacy selectProvider() in providers.mjs on import failure.
 *
 * Set BASELINE_COST_ROUTER=0 to force legacy-only routing.
 */

import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath  } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let baselineRouter = null;

async function loadBaselineRouter() {
  if (baselineRouter !== null) return baselineRouter;
  if (process.env.BASELINE_COST_ROUTER === '0') {
    baselineRouter = false;
    return false;
  }
  const candidates = [
    join(__dirname, '../../../../baseline-os/packages/baselineos/dist/core/cost-router.js'),
    join(__dirname, '../../../../baseline-os/packages/baselineos/src/core/cost-router.ts'),
  ];
  for (const path of candidates) {
    try {
      const mod = await import(pathToFileURL(path).href);
      if (mod.routeInferenceRequest) {
        baselineRouter = mod;
        return mod;
      }
    } catch {
      // try next
    }
  }
  baselineRouter = false;
  return false;
}

/**
 * Map a Baseline RouteDecision to a compliance-gateway provider entry.
 *
 * @param {string} query
 * @param {import('./providers.mjs')} providersMod
 */
export async function selectProviderViaBaseline(query, providersMod) {
  const router = await loadBaselineRouter();
  if (!router) return null;

  const decision = router.routeInferenceRequest({ prompt: query });
  if (!decision) return null;

  const registry = providersMod.getProviders?.() ?? [];
  const byId = registry.find((p) => p.name === decision.registryId);
  if (byId) return byId;

  const byModel = registry.find((p) => p.model === decision.model);
  if (byModel) return byModel;

  const byProvider = registry.find((p) => p.name?.includes(decision.provider));
  return byProvider ?? null;
}
