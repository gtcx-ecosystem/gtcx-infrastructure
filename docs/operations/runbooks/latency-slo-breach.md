# Latency SLO Breach Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

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
