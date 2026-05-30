---
title: 'ADR-018: Pen-Test Contained-Blast-Radius Kubernetes Overlay'
status: 'accepted'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-architect'
tier: 'standard'
tags: ['architecture', 'security', 'pen-test', 'isolation']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-018: Pen-Test Contained-Blast-Radius Kubernetes Overlay

## Status

Accepted

## Date

2026-05-22

## Context

The Sprint 4 pen-test RFP (`docs/audit/pen-test-rfp-2026.md`) commits to ten test classes including audit-chain tampering, container escape, and mesh policy bypass. The pen-test vendor needs a target environment that is realistic enough to find real findings, but contained enough that an exploit cannot affect production traffic, the production WORM bucket, or other tenants.

Three constraints shaped the decision:

1. **Realistic enough to find findings.** Running against a mocked environment risks the vendor saying "we found vulnerabilities, but the production posture is unknown."
2. **Contained enough to avoid escape.** A discovered RCE must not be able to pivot to production. A successful audit-chain tamper attempt must not pollute the production WORM bucket.
3. **Reset-able.** The vendor will test repeatedly. Each test cycle must reset cleanly without manual remediation.

## Decision

We add a dedicated Kustomize overlay at `infra/kubernetes/overlays/pen-test/` with:

- **Dedicated namespace** `gtcx-pen-test` with `pod-security.kubernetes.io/enforce: restricted` (PodSecurity Standards baseline).
- **Isolated JetStream subject** `gtcx.audit.pen-test.>` — separate from production subjects.
- **Separate WORM bucket** `gtcx-pen-test-audit-af-south-1` — different from production `gtcx-worm-audit-production-af-south-1`. The pen-test cannot pollute production audit evidence.
- **Tight resource limits per principal** — 5 QPS and $1/day token budget. An exploited token cannot run up a real bill.
- **Anonymized seed data only** — `infra/migrations/seed-pentest.sql` (planned) loads test data; no production PII.
- **Auto-teardown date annotation** `gtcx.io/teardown-after: 2026-08-31` so the namespace gets cleaned up after the engagement.

## Alternatives Considered

| Option                                | Pros                                                            | Cons                                                                                |
| ------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Test against staging directly         | Realistic posture                                               | Pollutes staging audit chain; collides with feature work; not "after end" cleanable |
| Test against production               | Maximum realism                                                 | Unacceptable — actual data risk; vendor LOA wouldn't approve                        |
| Spin up a new EKS cluster             | Maximum isolation                                               | $$, time, doesn't model the real network/IRSA posture                               |
| Mock environment                      | Cheap                                                           | Findings are theoretical; doesn't satisfy realism constraint                        |
| **Dedicated overlay in same cluster** | Realistic mesh + IRSA + admission policies; cheap; teardownable | One more overlay to maintain                                                        |

## Consequences

**Positive:**

- The vendor finds real findings against real Kyverno policies, real NATS, real IRSA — not a contrived target
- Production WORM bucket is structurally untouchable from the pen-test namespace (separate bucket + separate IAM role)
- Cross-namespace traffic blocked by default-deny NetworkPolicies inherited from base
- Vendor's per-tenant 5 QPS limit bounds the LLM cost of even a fully-automated scanner
- Same overlay used for any future security engagement (red-team exercises, internal security drills)

**Negative:**

- One more overlay to keep in sync when base manifests change. Mitigated by Kustomize's `../../base` import pattern and `validate.sh --full` `run_kustomize_validation` gate.
- Cluster-shared resources (broker, ingress controller, cert-manager) still serve both production and pen-test pods. A successful broker exploit could affect both — but that's the kind of finding the engagement is supposed to surface.

**Neutral:**

- The overlay's PodSecurity Standards `restricted` level matches production overlay's posture, so the pen-test is testing the same securityContext rules production runs under.

## References

- ADR-014 — NATS JetStream audit transport (separate subject hierarchy enables contained routing)
- ADR-015 — Per-tenant JetStream subject routing (pen-test subjects are a special case)
- `infra/kubernetes/overlays/pen-test/kustomization.yaml`
- `docs/audit/pen-test-rfp-2026.md`
