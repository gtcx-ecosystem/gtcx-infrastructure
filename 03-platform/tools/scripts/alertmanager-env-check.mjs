#!/usr/bin/env node
/**
 * @fileoverview Fail closed on Alertmanager placeholder env defaults.
 *
 * Ensures `04-ship/docker/docker-compose.infra.yml` rejects CHANGE_ME_DEV and
 * no-op Slack URLs unless GTCX_ALERTS_DEV_MODE=1 before envsubst renders
 * alertmanager.yml. Prevents silent paging blackholes in staging/production.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const COMPOSE_PATH = join(ROOT, '04-ship', 'docker', 'docker', 'docker-compose.infra.yml');

const REQUIRED_MARKERS = [
  'GTCX_ALERTS_DEV_MODE',
  'PAGERDUTY_SERVICE_KEY',
  "in ''|CHANGE_ME_DEV",
  'no-op',
  'envsubst < /tmp/alertmanager.yml.tpl',
];

export function validateAlertmanagerCompose(text) {
  const failures = [];
  for (const marker of REQUIRED_MARKERS) {
    if (!text.includes(marker)) {
      failures.push(`missing required marker: ${marker}`);
    }
  }

  // Stop at the next sibling *service* (``\n  svc:\n    child``), not at ``\n  command``.
  const initSection = text.match(
    /alertmanager-config-init:[\s\S]*?(?=\n  [a-z][a-z0-9-]*:\n    |\s*$)/
  )?.[0];
  if (!initSection) {
    failures.push('alertmanager-config-init service block not found');
    return failures;
  }

  const commandBlock = initSection.match(/command:[\s\S]*/)?.[0] ?? '';
  if (!commandBlock.includes("PAGERDUTY_SERVICE_KEY")) {
    failures.push('missing PAGERDUTY placeholder guard in init command');
  }

  const envsubstIndex = commandBlock.indexOf('envsubst');
  const pagerdutyCaseIndex = commandBlock.indexOf('PAGERDUTY_SERVICE_KEY');
  if (
    envsubstIndex >= 0 &&
    pagerdutyCaseIndex >= 0 &&
    envsubstIndex < pagerdutyCaseIndex
  ) {
    failures.push('placeholder guard must run before envsubst');
  }

  return failures;
}

function main() {
  const text = readFileSync(COMPOSE_PATH, 'utf8');
  const failures = validateAlertmanagerCompose(text);
  if (failures.length > 0) {
    console.error('[alertmanager-env-check] Alertmanager compose guard drift:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log(
    '[alertmanager-env-check] docker-compose.infra.yml rejects alert placeholders outside GTCX_ALERTS_DEV_MODE=1'
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
