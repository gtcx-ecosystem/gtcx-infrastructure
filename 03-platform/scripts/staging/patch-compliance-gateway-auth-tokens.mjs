#!/usr/bin/env node
/**
 * Patch COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON on staging from AWS SM AUDIT_TOKEN.
 * Run after kubectl apply -k when auth secret was reset to [].
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const SECRET = process.env.CG_AUTH_SECRET ?? 'compliance-gateway-secrets-staging-858mcd8b88';
const NS = process.env.CG_NAMESPACE ?? 'gtcx-staging';
const SM = process.env.SM_SECRET_ID ?? 'gtcx/staging/mobile-audit-e2e-credentials';

const aws = execSync(
  `aws secretsmanager get-secret-value --secret-id ${SM} --output json`,
  { encoding: 'utf8' },
);
const raw = JSON.parse(aws).SecretString;
const token = raw.match(/"AUDIT_TOKEN":"([^"]+)"/)?.[1];
if (!token) throw new Error('AUDIT_TOKEN not found in SM secret');

const auth = JSON.stringify([
  {
    token,
    subject: 'staging-mobile-e2e',
    permissions: ['audit:read', 'query:read', 'tools:read', 'providers:read'],
    label: 'staging-audit-e2e',
    tenantId: 'zw',
  },
]);

writeFileSync('/tmp/cg-auth-patch.json', JSON.stringify({ stringData: { COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON: auth } }));
execSync(`kubectl patch secret ${SECRET} -n ${NS} --type=merge --patch-file=/tmp/cg-auth-patch.json`, {
  stdio: 'inherit',
});
console.log(`Patched ${SECRET} in ${NS} (token length ${token.length})`);
