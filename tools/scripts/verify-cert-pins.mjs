#!/usr/bin/env node
/**
 * @fileoverview Verify Certificate Pins — Staging
 *
 * Connects to the staging HTTPS endpoint, extracts the SPKI fingerprint
 * (SHA-256 of the Subject Public Key Info), and emits it in the format
 * expected by mobile cert-pins.json.
 *
 * Usage:
 *   node tools/scripts/verify-cert-pins.mjs [--host=api.staging.gtcx.trade] [--port=443]
 *
 * Output (JSON):
 *   {
 *     "host": "api.staging.gtcx.trade",
 *     "spkiFingerprint": "sha256/ABCD...",
 *     "validFrom": "...",
 *     "validTo": "...",
 *     "subject": "CN=..."
 *   }
 *
 * Exit codes:
 *   0 = success, fingerprint extracted
 *   1 = connection or certificate error
 */

import { connect } from 'node:tls';
import { createHash } from 'node:crypto';

const DEFAULT_HOST = 'api.staging.gtcx.trade';
const DEFAULT_PORT = 443;

const args = process.argv.slice(2);
let host = DEFAULT_HOST;
let port = DEFAULT_PORT;

for (const arg of args) {
  if (arg.startsWith('--host=')) host = arg.slice('--host='.length);
  if (arg.startsWith('--port=')) port = parseInt(arg.slice('--port='.length), 10);
}

function getSpkiFingerprint(cert) {
  // cert.pubkey is a Buffer containing the DER-encoded Subject Public Key Info
  const spki = cert.pubkey;
  if (!spki) throw new Error('No pubkey found in certificate');
  const hash = createHash('sha256').update(spki).digest('base64');
  return `sha256/${hash}`;
}

async function verifyCertPins() {
  console.log(`=== Certificate Pin Verification ===`);
  console.log(`Host: ${host}:${port}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  const result = await new Promise((resolve, reject) => {
    const socket = connect(port, host, { servername: host }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();

      if (!cert || Object.keys(cert).length === 0) {
        reject(new Error('No certificate received from peer'));
        return;
      }

      try {
        const fingerprint = getSpkiFingerprint(cert);
        resolve({
          host,
          port,
          spkiFingerprint: fingerprint,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          subject: cert.subject.CN || cert.subject,
          issuer: cert.issuer.CN || cert.issuer,
          serialNumber: cert.serialNumber,
        });
      } catch (err) {
        reject(err);
      }
    });

    socket.on('error', (err) => {
      reject(new Error(`TLS connection failed: ${err.message}`));
    });

    socket.setTimeout(15000, () => {
      socket.destroy();
      reject(new Error('TLS connection timeout'));
    });
  });

  console.log('Certificate details:');
  console.log(`  Subject:    ${result.subject}`);
  console.log(`  Issuer:     ${result.issuer}`);
  console.log(`  Valid from: ${result.validFrom}`);
  console.log(`  Valid to:   ${result.validTo}`);
  console.log('');
  console.log('SPKI Fingerprint (add to cert-pins.json):');
  console.log(`  ${result.spkiFingerprint}`);
  console.log('');
  console.log('Full JSON output:');
  console.log(JSON.stringify(result, null, 2));

  return result;
}

verifyCertPins().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('');
  console.error(`[FAIL] ${err.message}`);
  console.error('');
  console.error('If the endpoint is not yet live, this is expected.');
  console.error('Re-run after the ALB is provisioned and DNS resolves.');
  process.exit(1);
});
