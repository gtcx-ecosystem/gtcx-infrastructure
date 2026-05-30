---
title: 'ADR-017: Adaptive Policy Tuning with Signed Transition Events'
status: 'accepted'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['architecture', 'resilience', 'audit', 'observability']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-017: Adaptive Policy Tuning with Signed Transition Events

## Status

Accepted

## Date

2026-05-22

## Context

The compliance-gateway routes queries across multiple LLM providers and supports a runtime degradation mode (`auto` / `normal` / `reduced` / `minimal` / `offline`) to strip non-essential fields and shed load under stress. Originally the mode was static — set by operators via the runtime-policies ConfigMap.

Static configuration suffers from two failure modes: (1) operators are slow to react during real incidents, and (2) the mode set at deploy time is wrong by the time it matters. We needed feedback-driven mode selection that responds to the gateway's own observed latency and error rate, without requiring operator intervention for routine degradation.

Two non-obvious constraints shaped the decision:

1. **Transitions must be auditable.** Switching from `auto` to `minimal` is a consequential action — it changes user-visible behavior. Per the SIGNAL Supervision pillar, any AI-system mode change must produce an audit-trail entry.
2. **Per-pod independence is acceptable at pilot scale.** Adding Redis as a hard dependency for shared adaptive state would expand the failure domain. ADR-014's transport choice (JetStream) already covers durability of audit records; adding Redis for adaptive coordination is opt-in (ADR-016/INT-B-1).

## Decision

We implement adaptive policy tuning as a pure function (`evaluatePolicy`) plus a scheduler (`startAdaptiveScheduler`). The policy:

1. Compares observed p95 latency against `GTCX_ADAPTIVE_LATENCY_THRESHOLD_MS` (default 5000) and error rate against `GTCX_ADAPTIVE_ERROR_THRESHOLD` (default 0.10) at each observation window
2. After 3 consecutive latency breaches, transitions `auto → reduced`
3. After 2 consecutive error breaches, transitions `auto → minimal` (error breach takes precedence over latency)
4. After 5 consecutive healthy windows from any degraded mode, transitions back to `auto`
5. Every transition emits a signed audit event with `action: 'resilience.policy.adaptation'`, including `previous`, `next`, and `reason` fields

Adaptive policy is disabled by default (`GTCX_ADAPTIVE_POLICY_ENABLED=false`). Operators opt in per environment. The store backend (memory vs Redis) is selected separately via `GTCX_ADAPTIVE_STORE_BACKEND` (see INT-B-1 / adaptive-policy-store.mjs).

## Alternatives Considered

| Option                               | Pros                                          | Cons                                                                       |
| ------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------- |
| Static config only                   | Simple; deterministic; operator-controlled    | Slow reaction to incidents; doesn't degrade gracefully                     |
| Per-request mode selection           | Maximum responsiveness                        | High overhead; no hysteresis; thrashing under noisy metrics                |
| Operator-only manual override        | Familiar                                      | Loses the "minutes to detect, minutes to act" window during real incidents |
| Adaptive + manual override           | Opt-in adaptation; operator retains authority | Slightly more state to manage                                              |
| **Adaptive with signed transitions** | Feedback-driven + auditable + opt-in          | Adds a scheduler; transitions must be tamper-evident                       |

## Consequences

**Positive:**

- Gateway shifts to `reduced` mode automatically under sustained latency, before operators notice
- Every transition is a signed audit event — auditors can reconstruct exactly when and why the system degraded
- Opt-in via env var; conservative default preserves existing operator-driven behavior
- Pure-function policy is exhaustively unit-testable (8 cases in `adaptive-policy.unit.test.mjs`)
- Scheduler integration tests (`adaptive-policy-scheduler.integration.test.mjs`) verify the live wiring without flakiness

**Negative:**

- One more subsystem to understand for an on-call engineer reading the gateway code
- Per-pod state means brief divergence is possible when multiple pods detect a breach in slightly different windows; bounded by the recovery threshold. Redis backend (INT-B-1) is the future-proof remedy when scale warrants
- Sample callbacks (`sampleLatencyP95Ms`, `sampleErrorRate`) are currently stubs reading from `runtimePolicyConfig.observedLatencyP95Ms` — wiring to real Prometheus pull is a future refinement

**Neutral:**

- Default thresholds (5000ms latency, 10% error rate, 3/2/5 window counts) are starting points; tuning is an operator decision per environment
- The signed `resilience.policy.adaptation` event uses the same audit chain as `query:success`, `auth:failure`, etc. — uniform downstream consumption

## References

- ADR-014 — NATS JetStream audit transport
- ADR-016 — Fail-closed audit signing
- `tools/compliance-gateway/src/adaptive-policy.mjs` — pure-function policy + scheduler
- `tools/compliance-gateway/src/adaptive-policy-store.mjs` — pluggable store (memory / Redis)
- `tools/compliance-gateway/tests/adaptive-policy.unit.test.mjs` — 8 state-machine cases
- `tools/compliance-gateway/tests/adaptive-policy-scheduler.integration.test.mjs` — 6 live-scheduler cases
- `tools/compliance-gateway/tests/adaptive-policy-store.unit.test.mjs` — 8 store-backend cases
- `docs/audit/master-audit-2026-05-17.md` Phase 5 — feedback-loop requirement
