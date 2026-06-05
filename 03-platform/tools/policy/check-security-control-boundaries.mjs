#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const cloudflaredConfig = path.join(
  repoRoot,
  'infra',
  'kubernetes',
  'base',
  'services',
  'cloudflared',
  'config.yaml'
);
const complianceGatewayManifest = path.join(
  repoRoot,
  'infra',
  'kubernetes',
  'base',
  'services',
  'compliance-gateway.yaml'
);

let exitCode = 0;

function fail(message) {
  console.error(`security-control-boundaries: ${message}`);
  exitCode = 1;
}

const cloudflared = readFileSync(cloudflaredConfig, 'utf8');
const complianceGateway = readFileSync(complianceGatewayManifest, 'utf8');

if (cloudflared.includes('query.gtcx.trade')) {
  fail('query.gtcx.trade must not be published until an external zero-trust boundary exists');
}

if (!/name:\s*NODE_ENV\s*\n\s+value:\s*['"]production['"]/.test(complianceGateway)) {
  fail('compliance-gateway deployment must run with NODE_ENV=production');
}

if (!/name:\s*COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON\b/.test(complianceGateway)) {
  fail('compliance-gateway deployment must wire COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON');
}

if (
  !/name:\s*COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON[\s\S]*?secretKeyRef:[\s\S]*?name:\s*compliance-gateway-secrets[\s\S]*?key:\s*COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON/.test(
    complianceGateway
  )
) {
  fail(
    'COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON must come from compliance-gateway-secrets via secretKeyRef'
  );
}

if (exitCode !== 0) {
  process.exit(exitCode);
}

console.log('Security control boundary checks passed');
