import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateAlertmanagerCompose } from './alertmanager-env-check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const COMPOSE_PATH = join(ROOT, '04-ship', 'docker', 'docker', 'docker-compose.infra.yml');

describe('alertmanager-env-check', () => {
  it('passes on the committed docker-compose.infra.yml guard', () => {
    const text = readFileSync(COMPOSE_PATH, 'utf8');
    const failures = validateAlertmanagerCompose(text);
    assert.deepEqual(failures, []);
  });

  it('fails when the init command renders without a placeholder guard', () => {
    const failures = validateAlertmanagerCompose(`
alertmanager-config-init:
  environment:
    GTCX_ALERTS_DEV_MODE: \${GTCX_ALERTS_DEV_MODE:-}
  command: >
    sh -c "envsubst < /tmp/alertmanager.yml.tpl > /out/alertmanager.yml"
`);
    assert.ok(failures.some((f) => f.includes('PAGERDUTY placeholder guard')));
  });

  it('fails when envsubst precedes the pagerduty placeholder guard', () => {
    const failures = validateAlertmanagerCompose(
      [
        'alertmanager-config-init:',
        '    command: >',
        '      sh -c "envsubst < /tmp/alertmanager.yml.tpl &&',
        "             case PAGERDUTY_SERVICE_KEY in ''|CHANGE_ME_DEV) exit 1;; esac;",
        '           fi"',
        '  alertmanager:',
        '    image: x',
      ].join('\n')
    );
    assert.ok(failures.some((f) => f.includes('before envsubst')));
  });
});
