# Protocols Error Budget Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Alert

- `ProtocolsErrorBudgetFastBurn` — 14.4x burn rate (page immediately)
- `ProtocolsErrorBudgetSlowBurn` — 6x burn rate (create ticket)

## Impact

One or more of the 6 GTCX protocols (TradePass, GeoTag, GCI, CRX, SGX, Pathways) is experiencing elevated error rates.

## Initial Response (5 minutes)

1. Check protocol health: `GET https://api.gtcx.io/health`
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
