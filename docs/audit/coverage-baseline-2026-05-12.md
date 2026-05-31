---
title: 'Test Coverage Baseline'
status: 'superseded'
superseded_by: 'docs/audit/execution-roadmap.md'
superseded_on: '2026-05-31'
superseded_reason: 'Older coverage baseline; current state tracked in latest.json + S2-14 story.'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['compliance', 'infrastructure', 'frontend', 'backend', 'governance']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Test Coverage Baseline

---

## Current Coverage — `@gtcx/replay-protection`

| Metric     | Current | Target | Gap    |
| ---------- | ------- | ------ | ------ |
| Statements | 84.97%  | ≥90%   | 5.03%  |
| Branch     | 68.99%  | ≥90%   | 21.01% |
| Functions  | 83.82%  | ≥90%   | 6.18%  |
| Lines      | 84.97%  | ≥90%   | 5.03%  |

### By File

| File                                  | Branch | Blockers to 90%                                     |
| ------------------------------------- | ------ | --------------------------------------------------- |
| `src/verifier.mjs`                    | 94.59% | Edge case: invalid envelope structure (lines 57–58) |
| `src/runtime-policy.mjs`              | 87.50% | Missing `isProductionMode=false` path               |
| `src/server.mjs`                      | 58.06% | Error handlers, graceful shutdown, DB failure paths |
| `src/protocols-crypto/did-verify.mjs` | 35.71% | DID resolution failure, cache miss, format errors   |
| `src/protocols-crypto/jwt-verify.mjs` | 40.00% | Token format edge cases, key fetch failure          |
| `src/store/redis-nonce-store.mjs`     | 100%   | Only 21.91% line coverage — requires Redis          |
| `src/audit/audit-capture.mjs`         | 71.42% | Audit DB write failure paths                        |
| `src/metrics/replay-metrics.mjs`      | 58.33% | Prometheus push failure paths                       |

### Coverage Gaps by Risk

| Risk                                   | Files                                            | Priority |
| -------------------------------------- | ------------------------------------------------ | -------- |
| **High** — Error handling untested     | `server.mjs`, `did-verify.mjs`, `jwt-verify.mjs` | P1       |
| **Medium** — Production paths untested | `runtime-policy.mjs`, `audit-capture.mjs`        | P2       |
| **Low** — Requires external service    | `redis-nonce-store.mjs`                          | P3       |

---

## CI Integration

Coverage is reported on every PR via the `Replay protection coverage` step in `ci.yml`.

```bash
# Local coverage report
pnpm test:coverage
```

---

## Action Plan

1. **P1:** Add `server.mjs` error handling tests (invalid JSON, DB failure, shutdown)
2. **P1:** Add `did-verify.mjs` fallback and resolution failure tests
3. **P2:** Add `jwt-verify.mjs` edge case tests
4. **P2:** Add `audit-capture.mjs` write failure tests
5. **P3:** Mock Redis for `redis-nonce-store.mjs` tests

Target completion: M3 (Certification milestone)
