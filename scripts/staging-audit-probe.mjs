#!/usr/bin/env node
/**
 * Staging audit API probe — infra #50–#52 gate.
 * Exits 0 when POST /audit/bundles is routed (not 404).
 */
const base = (process.env.GTCX_STAGING_AUDIT_URL ?? 'https://api.staging.gtcx.trade').replace(
  /\/$/,
  '',
);
const ua = process.env.GTCX_STAGING_UA ?? 'Mozilla/5.0 (GTCX staging-audit-probe)';

async function probe(path, init = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'User-Agent': ua,
      ...(init.headers ?? {}),
    },
  });
  return res.status;
}

const bundles = await probe('/audit/bundles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});
const query = await probe('/audit/query', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});

console.log(`POST ${base}/audit/bundles → ${bundles}`);
console.log(`POST ${base}/audit/query → ${query}`);

if (bundles === 404 || query === 404) {
  console.error('FAIL: audit routes still 404 (ingress or compliance-gateway image)');
  process.exit(1);
}

console.log('PASS: audit routes reachable (expect 400/405/503 until signed bundle + resolver)');
process.exit(0);
