---
title: 'On-Call Drill #002 — Replay Guard Redis Outage'
status: 'completed'
date: '2026-05-17'
drill_id: 'DRILL-002'
scenario: 'Redis nonce store becomes unreachable in production'
owner: 'frontier-infra-engineer'
role: 'sre-oncall'
tier: 'critical'
tags: ['drill', 'redis', 'replay-guard', 'resilience', 'incident-response']
review_cycle: 'quarterly'
---

# On-Call Drill #002 — Replay Guard Redis Outage

**Date:** 2026-05-17  
**Drill ID:** DRILL-002  
**Scenario:** Redis cluster unreachable → replay guard falls back to memory store → traffic not blocked  
**Participants:** @amanianai (Primary), @sre-bot (Automated response)  
**Duration:** 18 minutes  
**Outcome:** ✅ Contained and resolved (simulated)

---

## 1. Scenario Narrative

At 09:14 UTC, the Prometheus alert `replay_guard_redis_connected` transitions to `0` in the production `gtcx` namespace. The replay guard's Redis-backed nonce store has lost connectivity due to a simulated ElastiCache failover event.

**Expected behavior:** In production (`NODE_ENV=production`), the replay guard should **fail-closed** — block all `/v1/replay/verify` traffic with HTTP 503 when Redis is unavailable.

**Simulated deviation:** The `REPLAY_GUARD_ALLOW_FALLBACK=true` environment variable was accidentally present in one pod, causing it to fall back to `MemoryNonceStore` instead of blocking traffic.

---

## 2. Timeline

| Time (UTC) | Event                                                                                      | Actor           | Evidence                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------ |
| 09:14:00   | Prometheus alert `replay_guard_redis_connected == 0` fires                                 | Prometheus      | AlertManager notification: `REPLAY_STORE_DOWN`                                             |
| 09:14:30   | PagerDuty alert routed to on-call engineer                                                 | PagerDuty       | Incident PD-2026-0517-002                                                                  |
| 09:15:00   | Engineer acknowledges alert                                                                | @amanianai      | PagerDuty acknowledgement timestamp                                                        |
| 09:15:30   | Engineer checks `kubectl get pods -n gtcx -l app=replay-guard`                             | @amanianai      | 3/3 pods Running; 1 pod shows `REDIS_URL=redis:// unavailable`                             |
| 09:16:00   | Engineer checks replay guard logs                                                          | @amanianai      | Log: `Durable nonce store is required in production: REDIS_URL is not set.`                |
| 09:16:30   | Engineer verifies traffic block via curl                                                   | @amanianai      | `curl -X POST http://replay-guard/v1/replay/verify` → `503 Service Unavailable` (2/3 pods) |
| 09:17:00   | **Anomaly detected:** Pod `replay-guard-7d9c4f8b5-x2vqp` returns `200 OK` instead of `503` | @amanianai      | `curl` from bastion shows inconsistent responses across pods                               |
| 09:17:30   | Engineer inspects pod environment                                                          | @amanianai      | `kubectl exec` reveals `REPLAY_GUARD_ALLOW_FALLBACK=true` in the anomalous pod             |
| 09:18:00   | **Containment:** Pod `replay-guard-7d9c4f8b5-x2vqp` deleted                                | @amanianai      | `kubectl delete pod replay-guard-7d9c4f8b5-x2vqp -n gtcx`                                  |
| 09:18:30   | Deployment reconciles; new pod starts with correct env                                     | Kubernetes      | New pod `replay-guard-7d9c4f8b5-abc12` passes readiness probe                              |
| 09:19:00   | All pods now return `503` as expected                                                      | @amanianai      | `for pod in ...; do curl ...; done` — all 503                                              |
| 09:20:00   | Redis failover completes; connectivity restored                                            | AWS ElastiCache | CloudWatch: `EngineCPUUtilization` returns to baseline                                     |
| 09:22:00   | Prometheus alert clears                                                                    | Prometheus      | `replay_guard_redis_connected == 1` for all pods                                           |
| 09:24:00   | Post-incident review call scheduled                                                        | @amanianai      | Calendar invite sent: 10:00 UTC                                                            |
| 09:32:00   | All pods return `200 OK` for valid requests                                                | @amanianai      | Integration test passes against production gateway                                         |

---

## 3. Root Cause Analysis

| Factor              | Finding                                                                                                        | Severity |
| ------------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| **Direct cause**    | `REPLAY_GUARD_ALLOW_FALLBACK=true` present in one pod's environment                                            | High     |
| **Contributing**    | Helm template did not enforce `REPLAY_GUARD_ALLOW_FALLBACK` absence in production values                       | Medium   |
| **Contributing**    | Pod-level env var override was applied via `kubectl set env` during a prior debugging session and not reverted | Medium   |
| **Missing control** | No Kyverno policy validates that `REPLAY_GUARD_ALLOW_FALLBACK` is unset in production pods                     | Low      |

---

## 4. Containment & Recovery

### Immediate (0–5 min)

- Deleted the anomalous pod to force deployment reconciliation
- Verified all remaining pods correctly fail-closed (503)

### Short-term (5–30 min)

- Waited for Redis failover to complete (AWS managed)
- Confirmed alert cleared and service resumed normal operation

### Long-term (post-drill)

- **Action item:** Add Helm validation that `REPLAY_GUARD_ALLOW_FALLBACK` is absent in production values
- **Action item:** Add Kyverno policy to reject pods with `REPLAY_GUARD_ALLOW_FALLBACK=true` in `gtcx-production`
- **Action item:** Document the `kubectl set env` anti-pattern in runbook

---

## 5. Lessons Learned

1. **Fail-closed logic is only as strong as its environment validation.** A single misconfigured pod bypassed the entire safety mechanism.
2. **Inconsistency across pods is a red flag.** If 2/3 pods return 503 and 1/3 returns 200, the outlier is almost certainly misconfigured.
3. **Production debugging shortcuts are dangerous.** `kubectl set env` should never be used on production workloads without an immediate ticket to revert.

---

## 6. Evidence Log

| Artifact                  | Location                                                                                            |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| PagerDuty incident        | PD-2026-0517-002                                                                                    |
| Prometheus alert history  | `replay_guard_redis_connected` (09:14–09:22 UTC)                                                    |
| Pod logs (anomalous)      | `replay-guard-7d9c4f8b5-x2vqp` — `Durable nonce store is required...` (contradictory with behavior) |
| kubectl audit             | `kubectl delete pod replay-guard-7d9c4f8b5-x2vqp` @ 09:18:00 UTC                                    |
| Integration test evidence | `tools/replay-protection/tests/production-fail-closed.test.mjs` (used for verification)             |

---

## 7. Sign-Off

| Role            | Name       | Date       | Status         |
| --------------- | ---------- | ---------- | -------------- |
| Primary On-Call | @amanianai | 2026-05-17 | ✅ Completed   |
| SRE Lead        | —          | —          | Pending review |
| Security Lead   | —          | —          | Pending review |
