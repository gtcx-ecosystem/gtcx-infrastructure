#!/usr/bin/env node
/**
 * Generate a PKCS#8 DER Ed25519 private key as base64 for AUDIT_SIGNING_KEY_B64.
 * Use when compliance-gateway pods fail with audit.signer.keyLoadFailed
 * (often caused by PEM/JSON pasted into the secret instead of DER b64).
 *
 * Does not print the raw key unless --print-b64 is passed (avoid logs).
 */
import { generateKeyPairSync } from 'node:crypto';
import { writeFileSync } from 'node:fs';

function freshKeyB64() {
  const { privateKey } = generateKeyPairSync('ed25519');
  const der = privateKey.export({ format: 'der', type: 'pkcs8' });
  return Buffer.from(der).toString('base64');
}

const args = new Set(process.argv.slice(2));
const keyB64 = freshKeyB64();

if (args.has('--print-b64')) {
  process.stdout.write(`${keyB64}\n`);
  process.exit(0);
}

const outPath = 'compliance-gateway-audit-signing-key.b64';
writeFileSync(outPath, keyB64, { mode: 0o600 });
process.stdout.write(
  [
    `Wrote ${outPath} (mode 600).`,
    '',
    'Update the cluster secret (namespace gtcx-staging after kustomize nameSuffix):',
    '',
    '  kubectl create secret generic compliance-gateway-audit-key-staging \\',
    '    --from-file=AUDIT_SIGNING_KEY_B64=./compliance-gateway-audit-signing-key.b64 \\',
    '    -n gtcx-staging --dry-run=client -o yaml | kubectl apply -f -',
    '',
    'Or patch existing:',
    '',
    '  kubectl create secret generic compliance-gateway-audit-key-staging \\',
    '    --from-file=AUDIT_SIGNING_KEY_B64=./compliance-gateway-audit-signing-key.b64 \\',
    '    -n gtcx-staging --save-config -o yaml --dry-run=client | kubectl apply -f -',
    '',
    'Then rollout compliance-gateway-staging.',
    '',
  ].join('\n'),
);
