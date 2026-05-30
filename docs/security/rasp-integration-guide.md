---
title: 'RASP Integration Guide — replay-guard'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'architecture', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# RASP Integration Guide — replay-guard

**Version:** 1.0
**Classification:** Internal
**Date:** 2026-05-08
**Service:** replay-guard (Node.js)

---

## Architecture

RASP (Runtime Application Self-Protection) runs as embedded middleware inside the replay-guard Node.js process. Unlike perimeter defenses (WAF, IDS), RASP instruments the application runtime itself, giving it full visibility into request context, call stacks, and data flow.

```
                        ┌─────────────────────────────────────────┐
                        │           replay-guard process          │
                        │                                         │
  Inbound request ────► │  middleware.mjs                          │
                        │       │                                 │
                        │       ▼                                 │
                        │  ┌──────────┐    ┌──────────────────┐   │
                        │  │ RASP     │───►│ Policy Engine    │   │
                        │  │ Agent    │    │ (allow/block/log)│   │
                        │  └──────────┘    └──────────────────┘   │
                        │       │                                 │
                        │       ▼                                 │
                        │  verifier.mjs ► crypto/ ► store/ ► redis│
                        └─────────────────────────────────────────┘
                                │
                                ▼
                        Prometheus /metrics
                        (rasp_blocked_total, rasp_detected_total)
```

The RASP agent intercepts every inbound request before it reaches the verifier pipeline. It inspects request bodies, headers, query parameters, and — critically — the runtime call stack to detect exploitation in real time.

---

## Detection Capabilities

| Attack Class        | Detection Method                                                                               | Severity |
| ------------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Command injection   | Intercept `child_process.*` calls; match request-tainted arguments                             | Critical |
| Prototype pollution | Monitor `Object.prototype` mutations; block `__proto__`/`constructor.prototype` in parsed JSON | Critical |
| SSRF                | Intercept outbound `http.request`/`https.request`; validate target against allowlist           | High     |
| Path traversal      | Intercept `fs.*` calls; reject paths containing `../` or absolute paths outside allowed roots  | High     |
| Deserialization     | Intercept `JSON.parse` for oversized/deeply nested payloads; block known gadget chains         | High     |
| ReDoS               | Monitor regex execution time; kill patterns exceeding threshold                                | Medium   |

---

## Implementation Approach

### Option A: OpenRASP (recommended for evaluation)

OpenRASP is Baidu's open-source RASP agent with a Node.js plugin. It hooks into V8 and Node.js internals.

```bash
# Install
pnpm add openrasp --filter replay-protection

# In server.mjs, before any route registration:
import '@openrasp/node-agent';
```

Configuration lives in `rasp/openrasp.yml` within the service root.

### Option B: Custom middleware (recommended for production)

A lightweight custom implementation gives full control and avoids a third-party runtime dependency in a security-critical path.

```javascript
// src/middleware/rasp.mjs
import { createRaspMiddleware } from './rasp/engine.mjs';

const rasp = createRaspMiddleware({
  mode: process.env.RASP_MODE || 'monitor', // 'monitor' | 'block'
  allowlist: {
    outboundHosts: ['redis-host', 'prometheus-host'],
    fsRoots: ['/app/data', '/tmp/replay-guard'],
  },
  blocklist: {
    jsonKeys: ['__proto__', 'constructor', 'prototype'],
    pathPatterns: [/\.\.\//],
    commandPrefixes: ['rm', 'curl', 'wget', 'nc', 'bash', 'sh'],
  },
  maxJsonDepth: 10,
  maxJsonSize: 1_048_576, // 1 MB
});

// Register before all routes
app.use(rasp);
```

Implementation modules:

| Module                                 | Responsibility                                              |
| -------------------------------------- | ----------------------------------------------------------- |
| `rasp/engine.mjs`                      | Middleware entry point; orchestrates detectors              |
| `rasp/detectors/proto-pollution.mjs`   | Deep-scans parsed JSON for prototype pollution keys         |
| `rasp/detectors/ssrf.mjs`              | Monkey-patches `http.request` to enforce outbound allowlist |
| `rasp/detectors/path-traversal.mjs`    | Monkey-patches `fs.*` to reject traversal attempts          |
| `rasp/detectors/command-injection.mjs` | Monkey-patches `child_process.*` to block tainted args      |
| `rasp/detectors/deserialization.mjs`   | Wraps `JSON.parse` with depth/size limits                   |
| `rasp/policy.mjs`                      | Decides monitor vs block based on mode and allowlist        |

---

## Configuration

### Environment variables

| Variable               | Values                  | Default   | Description                               |
| ---------------------- | ----------------------- | --------- | ----------------------------------------- |
| `RASP_MODE`            | `monitor`, `block`      | `monitor` | Monitor logs only; block rejects requests |
| `RASP_LOG_LEVEL`       | `debug`, `info`, `warn` | `info`    | Verbosity of RASP event logs              |
| `RASP_ALLOWLIST_HOSTS` | comma-separated         | `""`      | Additional allowed outbound hosts         |
| `RASP_MAX_JSON_DEPTH`  | integer                 | `10`      | Maximum nesting depth for JSON payloads   |
| `RASP_MAX_JSON_SIZE`   | bytes                   | `1048576` | Maximum JSON body size                    |

### Mode transition

```
Day 0-30:   RASP_MODE=monitor   (observe, tune, zero false positives)
Day 31+:    RASP_MODE=block     (active protection, after sign-off)
```

The 30-day observation period is mandatory. Switching to block mode requires:

1. Zero false positives in the last 7 consecutive days
2. Security lead sign-off documented in the RASP deployment ticket
3. Rollback runbook tested (set `RASP_MODE=monitor` and restart)

---

## Metrics

All metrics are exported on the existing Prometheus `/metrics` endpoint.

```
# Counter: total blocked requests by attack type
rasp_blocked_total{attack_type="command_injection"} 0
rasp_blocked_total{attack_type="prototype_pollution"} 0
rasp_blocked_total{attack_type="ssrf"} 0
rasp_blocked_total{attack_type="path_traversal"} 0
rasp_blocked_total{attack_type="deserialization"} 0

# Counter: total detected (monitor mode) by attack type
rasp_detected_total{attack_type="command_injection"} 0
rasp_detected_total{attack_type="prototype_pollution"} 0
rasp_detected_total{attack_type="ssrf"} 0
rasp_detected_total{attack_type="path_traversal"} 0
rasp_detected_total{attack_type="deserialization"} 0

# Histogram: RASP inspection latency
rasp_inspection_duration_seconds_bucket{le="0.001"} ...
rasp_inspection_duration_seconds_bucket{le="0.005"} ...
rasp_inspection_duration_seconds_bucket{le="0.01"} ...
```

### Alerting rules

```yaml
# Prometheus alerting rules
groups:
  - name: rasp
    rules:
      - alert: RaspHighBlockRate
        expr: rate(rasp_blocked_total[5m]) > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: 'RASP blocking >10 requests/s — possible active attack'

      - alert: RaspHighLatency
        expr: histogram_quantile(0.99, rate(rasp_inspection_duration_seconds_bucket[5m])) > 0.01
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'RASP p99 latency exceeds 10ms — investigate performance impact'
```

---

## False Positive Handling

### Triage procedure

1. RASP detection fires in monitor mode
2. On-call engineer receives alert or reviews daily RASP digest
3. Engineer classifies the event:
   - **True positive** — document and confirm detection rule is correct
   - **False positive** — create a ticket with: request hash, matched rule, why it is benign
4. For false positives:
   - Add specific exclusion to the allowlist (not a blanket rule disable)
   - Exclusion must be scoped to the narrowest possible match (specific path + parameter)
   - Exclusion requires peer review before merge
5. Update the RASP test suite with the false positive as a regression test

### Allowlist format

```yaml
# rasp/allowlist.yml
exclusions:
  - id: 'FP-2026-001'
    rule: 'path_traversal'
    condition:
      path: '/api/v1/healthcheck'
      parameter: 'probe_path'
    reason: 'Kubernetes liveness probe sends absolute path'
    approved_by: 'security-lead'
    expires: '2027-05-08'
```

All exclusions have an expiry date. Expired exclusions are automatically removed during the annual RASP configuration review.

---

## Rollback

If RASP causes service degradation:

```bash
# Immediate: switch to monitor mode (no restart required if using env-based config)
kubectl set env deployment/replay-guard RASP_MODE=monitor

# Nuclear: disable RASP entirely
kubectl set env deployment/replay-guard RASP_ENABLED=false
# Then restart pods
kubectl rollout restart deployment/replay-guard
```

---

## References

- OWASP RASP Guide: https://owasp.org/www-project-rasp/
- OpenRASP: https://rasp.baidu.com
- NIST SP 800-53 SI-3 (Malicious Code Protection)
- GTCX security architecture: `docs/security/security-architecture.md`
