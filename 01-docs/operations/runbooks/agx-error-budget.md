---
title: 'AGX Error Budget Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['infrastructure', 'api', 'backend', 'database', 'network']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# AGX Error Budget Runbook

## Alert

- `AGXErrorBudgetFastBurn` — 14.4x burn rate (page immediately)
- `AGXErrorBudgetSlowBurn` — 6x burn rate (create ticket)

## Impact

AGX (Authenticated Global Exchange) platform API is failing requests at an unsustainable rate. If uncorrected, the 30-day error budget will be exhausted.

## Initial Response (5 minutes)

1. Check AGX health endpoint: `GET https://api.gtcx.trade/api/health`
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
| Bad deployment              | Rollout in last 30 min  | Rollback: `pnpm ctl deploy rollback --environment=production` |
| Database slowness           | RDS latency spike       | Check RDS Performance Insights                                |
| Downstream protocol failure | Protocols error rate up | Check protocol pods                                           |
| Traffic spike               | Request rate 2x normal  | HPA should scale; verify limits                               |

## Escalation

- If rollback does not resolve within 10 minutes: escalate to `@gtcx/platform-team`
- If database issue suspected: page `@gtcx/platform-team` + DBA
