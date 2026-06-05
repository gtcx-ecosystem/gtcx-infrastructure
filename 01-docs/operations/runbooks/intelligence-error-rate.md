---
title: 'Intelligence Error Rate Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'infrastructure', 'api', 'frontend', 'devops']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Intelligence Error Rate Runbook

## Alert

- `IntelligenceHighErrorRate` — error rate > 5%
- `IntelligenceCircuitBreakerTripped` — circuit breaker opened
- `IntelligenceServiceDown` — health check failing

## Impact

AI-driven features (ANISA, Cortex, Veritas) are degraded or unavailable.

## Initial Response (5 minutes)

1. Check intelligence service health
2. Review circuit breaker metrics
3. Check external provider status pages
4. Review recent deployments to intelligence namespace

## Common Causes

| Cause                   | Indicator                  | Fix                               |
| ----------------------- | -------------------------- | --------------------------------- |
| LLM API key expired     | 401 errors                 | Rotate key in AWS Secrets Manager |
| Context window exceeded | Token limit errors         | Truncate context or split request |
| Model version mismatch  | Unexpected response format | Rollback to known-good model tag  |

## Escalation

- Escalate to intelligence team lead if not resolved in 15 minutes.
