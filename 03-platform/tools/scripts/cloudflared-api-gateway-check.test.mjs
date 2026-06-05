import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateCloudflaredApiRouting,
  validateIngressDeprecation,
} from './cloudflared-api-gateway-check.mjs';

describe('cloudflared-api-gateway-check', () => {
  it('accepts expected public API routing', () => {
    const text = [
      'ingress:',
      '  - hostname: api.gtcx.africa',
      '    service: http://baselineos.baselineos.svc.cluster.local:3141',
      '  - hostname: api.gtcx.trade',
      '    service: http://compliance-gateway.gtcx.svc.cluster.local:8500',
      '  - service: http_status:404',
    ].join('\n');
    assert.deepEqual(validateCloudflaredApiRouting(text), []);
  });

  it('rejects query.gtcx.trade and legacy protocols routing', () => {
    const query = '  - hostname: query.gtcx.trade\n    service: http://x:8500';
    assert.ok(validateCloudflaredApiRouting(query).some((f) => f.includes('query.gtcx.trade')));

    const legacy = [
      '  - hostname: api.gtcx.trade',
      '    service: http://gtcx-protocols.gtcx.svc.cluster.local:8300',
    ].join('\n');
    assert.ok(validateCloudflaredApiRouting(legacy).some((f) => f.includes('compliance-gateway')));
  });

  it('rejects missing or incorrect api.gtcx.africa routing', () => {
    const missing = [
      'ingress:',
      '  - hostname: api.gtcx.trade',
      '    service: http://compliance-gateway.gtcx.svc.cluster.local:8500',
    ].join('\n');
    assert.ok(validateCloudflaredApiRouting(missing).some((f) => f.includes('api.gtcx.africa')));

    const wrongService = [
      'ingress:',
      '  - hostname: api.gtcx.africa',
      '    service: http://compliance-gateway.gtcx.svc.cluster.local:8500',
      '  - hostname: api.gtcx.trade',
      '    service: http://compliance-gateway.gtcx.svc.cluster.local:8500',
    ].join('\n');
    assert.ok(validateCloudflaredApiRouting(wrongService).some((f) => f.includes('baselineos:3141')));
  });

  it('accepts deprecated ingress annotation', () => {
    const text = '# DEPRECATED: api.gtcx.trade is migrating to Cloudflare Tunnel';
    assert.deepEqual(validateIngressDeprecation(text), []);
  });

  it('rejects ingress missing deprecation annotation', () => {
    const text = 'apiVersion: networking.k8s.io/v1\nkind: Ingress';
    assert.ok(validateIngressDeprecation(text).some((f) => f.includes('deprecation')));
  });
});
