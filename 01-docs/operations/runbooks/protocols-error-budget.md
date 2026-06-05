---
title: 'Protocols Error Budget Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['infrastructure', 'api', 'backend', 'database', 'devops']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Protocols Error Budget Runbook

## Alert

- `ProtocolsErrorBudgetFastBurn` — 14.4x burn rate (page immediately)
- `ProtocolsErrorBudgetSlowBurn` — 6x burn rate (create ticket)

## Impact

One or more of the 6 GTCX protocols (TradePass, GeoTag, GCI, CRX, SGX, Pathways) is experiencing elevated error rates.

## Initial Response (5 minutes)

1. Check protocol health: `GET https://api.gtcx.trade/health`
2. Check individual protocol endpoints:
   - `/tradepass/health`
   - `/geotag/health`
   - `/gci/health`
3. Review logs:
   ```bash
   kubectl logs -n gtcx-production -l tier=protocol --tail=500
   ```

## Common Causes

| Cause                              | Indicator            | Fix                                   |
| ---------------------------------- | -------------------- | ------------------------------------- |
| Protocol handler crash             | Stack traces in logs | Restart pods or rollback              |
| Database connection pool exhausted | `pool_full` errors   | Scale DB connections or RDS instance  |
| External API timeout               | `ETIMEDOUT` in logs  | Check external dependency status page |

## Escalation

- Escalate to `@gtcx/platform-team` if not resolved in 15 minutes.
