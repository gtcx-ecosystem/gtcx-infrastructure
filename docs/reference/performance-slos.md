---
title: 'Metrics — gtcx-protocols'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'infrastructure', 'api', 'network']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Metrics — gtcx-protocols

Protocol performance targets and KPI reference for the GTCX Protocol layer.

## Protocol Performance Targets

| Domain    | Metric              | Target                     |
| --------- | ------------------- | -------------------------- |
| Platform  | Regional throughput | 15,000 TPS                 |
| Platform  | API latency p50     | < 150ms                    |
| Platform  | API latency p99     | < 400ms                    |
| Platform  | Availability        | 99.9%                      |
| Sync      | Offline sync        | < 4 hours for 30-day queue |
| TradePass | Verification speed  | < 2s                       |
| TradePass | Offline operation   | 45 days                    |
| TradePass | Biometric accuracy  | FAR < 0.001%               |
| GeoTag    | Capture time        | < 200ms                    |
| GeoTag    | Location accuracy   | ± 3m                       |
| VaultMark | Custody transfer    | < 2s                       |
| VaultMark | Offline queue       | 30 days                    |
| GCI       | Calculation latency | < 500ms                    |
| GCI       | Update frequency    | Real-time                  |
| GCI       | Appeals resolution  | < 72 hours                 |
| PvP       | Escrow creation     | < 2s                       |
| PvP       | Settlement time     | < 24 hours                 |
| PvP       | Dispute rate        | < 1%                       |
| Network   | Consensus finality  | < 5 seconds global         |
| Security  | Spoofing prevention | > 99.9%                    |

## CI Performance Gates

Performance budgets are enforced in CI via `scripts/check-performance-baseline.mjs`.

```bash
pnpm perf:check
```

Baseline is stored in `benchmarks/` and refreshed with `pnpm perf:refresh`.

## Quality KPIs

Test coverage thresholds enforced in CI:

| Metric     | Minimum |
| ---------- | ------- |
| Statements | ≥ 85%   |
| Lines      | ≥ 85%   |
| Branches   | ≥ 80%   |
| Functions  | ≥ 75%   |

## References

- `docs/compliance/controls-matrix.md` — compliance control evidence
- `docs/agile/phased-roadmap.md` — milestone targets
- `docs/engineering/test-strategy.md` — coverage gate configuration
