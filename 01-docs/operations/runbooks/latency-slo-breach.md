---
title: 'Latency SLO Breach Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['infrastructure', 'backend', 'database', 'network', 'devops']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Latency SLO Breach Runbook

## Alert

- `AGXLatencySLOBreach` — p95 > 500ms
- `ProtocolsLatencySLOBreach` — p95 > 500ms
- `ANISALatencySLOBreach` — p95 > 2000ms

## Impact

User-facing requests are taking longer than the SLO target. Degraded user experience, potential timeouts.

## Initial Response (5 minutes)

1. Check current p95 latency in Grafana dashboard
2. Identify slow endpoints:
   ```bash
   kubectl logs -n gtcx-production -l app=gtcx-agx-prod --tail=1000 | jq -r 'select(.responseTimeMs > 500) | .path' | sort | uniq -c | sort -rn | head
   ```
3. Check database slow query log
4. Check for resource throttling:
   ```bash
   kubectl top pods -n gtcx-production
   ```

## Common Causes

| Cause                  | Indicator                                      | Fix                                |
| ---------------------- | ---------------------------------------------- | ---------------------------------- |
| Missing database index | Slow query log                                 | Add index, run `EXPLAIN ANALYZE`   |
| CPU throttling         | `container_cpu_cfs_throttled_seconds_total` up | Increase CPU limits                |
| Network latency        | Cross-AZ traffic spike                         | Verify topology spread constraints |
| Large payload          | `proxy-body-size` exceeded                     | Review client request sizes        |

## Escalation

- Escalate to `@gtcx/platform-team` if not resolved in 20 minutes.
