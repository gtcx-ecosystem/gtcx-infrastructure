# AGX Error Budget Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Alert

- `AGXErrorBudgetFastBurn` — 14.4x burn rate (page immediately)
- `AGXErrorBudgetSlowBurn` — 6x burn rate (create ticket)

## Impact

AGX (Authenticated Global Exchange) platform API is failing requests at an unsustainable rate. If uncorrected, the 30-day error budget will be exhausted.

## Initial Response (5 minutes)

1. Check AGX health endpoint: `GET https://api.gtcx.io/api/health`
2. Review recent deployments:
   ```bash
   kubectl rollout history deployment/gtcx-agx-prod -n gtcx-production
   ```
3. Check pod status:
   ```bash
   kubectl get pods -n gtcx-production -l app=gtcx-agx-prod
   ```
4. Review logs:
   ```bash
   kubectl logs -n gtcx-production -l app=gtcx-agx-prod --tail=500 | jq 'select(.level=="error")'
   ```

## Common Causes

| Cause                       | Indicator               | Fix                                                           |
| --------------------------- | ----------------------- | ------------------------------------------------------------- |
| Bad deployment              | Rollout in last 30 min  | Rollback: `gtcx-ctl deploy rollback --environment=production` |
| Database slowness           | RDS latency spike       | Check RDS Performance Insights                                |
| Downstream protocol failure | Protocols error rate up | Check protocol pods                                           |
| Traffic spike               | Request rate 2x normal  | HPA should scale; verify limits                               |

## Escalation

- If rollback does not resolve within 10 minutes: escalate to `@gtcx/platform-team`
- If database issue suspected: page `@gtcx/platform-team` + DBA
