---
title: 'ADR-016: Fail-Closed Audit Signing in Production'
status: 'accepted'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'security-architect'
tier: 'critical'
tags: ['architecture', 'security', 'audit', 'compliance', 'governance']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-016: Fail-Closed Audit Signing in Production

## Status

Accepted

## Date

2026-05-22

## Context

The first version of the compliance-gateway's audit signer (Sprint 1) failed open in production when `AUDIT_SIGNING_KEY_B64` was missing: it logged a warning and continued, producing unsigned audit events. The forensic Round-1 audit identified this as the single largest credibility risk: any production deploy missing the env var would silently produce records that fail SIGNAL Supervision S2 (audit trail) verification — but neither the operator nor the auditor would see a clear signal.

A regulator's auditor would (correctly) treat this as a stop-the-line finding. We need behavior that makes the substrate's tamper-evident claim load-bearing in production, period.

## Decision

In production, the compliance-gateway refuses to serve traffic without a configured audit signing key. Concretely:

1. `initAuditSigner` returns `{ initialized: false }` when `AUDIT_SIGNING_KEY_B64` is missing or invalid AND `NODE_ENV === 'production'`.
2. `server.mjs` checks `auditInit.initialized` immediately after `loadAuthState` and calls `process.exit(78)` (sysexits `EX_CONFIG`) if false.
3. The `/health` endpoint reports 503 unhealthy when signing is disabled in production, ensuring K8s readiness probes refuse to send traffic to a pod that somehow bypassed the startup check.

In non-production, the signer generates an ephemeral keypair so local development works without secret management.

## Alternatives Considered

| Option                                        | Pros                                                                                       | Cons                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Warn-and-continue (the v0 behavior)           | No deploy friction                                                                         | Silent failure mode; regulator-fatal; violates SIGNAL S2              |
| Refuse all writes (return 503 on `/v1/query`) | Less invasive than exit                                                                    | Pod stays "Ready" while broken; readiness probe doesn't catch it      |
| Refuse based on a runtime config check        | Configurable                                                                               | Adds a control point that itself could be misconfigured               |
| **Refuse to start (exit 78)**                 | Unambiguous; K8s will CrashLoopBackoff a misconfigured deploy; on-call sees it immediately | Slightly more aggressive than the prior "graceful degradation" reflex |

## Consequences

**Positive:**

- A production deploy without a signing key fails fast. CrashLoopBackOff is visible in `kubectl get pods` within seconds.
- SIGNAL S2 (audit trail) is now contractually load-bearing: every served request is provably signed
- Regulator's auditor can verify the contract trivially by trying to start the gateway without the secret and observing the exit
- /health surfaces the signing state, so external probes (Prometheus, LB) see it too

**Negative:**

- A misconfigured CI pipeline can take down the deploy. Acceptable: that's exactly the situation we want loud
- Local dev requires `NODE_ENV=development` or unset; otherwise the same exit applies. Documented in `tools/compliance-gateway/README.md`
- The ephemeral key path is now the only allowed dev-mode behavior. Tests must explicitly set `NODE_ENV !== 'production'` (already enforced in test setup)

**Neutral:**

- Exit code 78 (EX_CONFIG) follows the BSD sysexits convention, recognizable to operators familiar with daemons
- The check happens AFTER `loadAuthState` so config errors in either subsystem produce a coherent error message

## References

- ADR-014 — NATS JetStream audit transport (parallel reasoning on durability)
- `tools/compliance-gateway/src/audit.mjs` — `initAuditSigner` implementation
- `tools/compliance-gateway/src/server.mjs:59-68` — startup check + exit
- `tools/compliance-gateway/tests/audit.unit.test.mjs` — fail-closed contract tests
- `docs/audit/master-audit-2026-05-17.md` §Phase 1 — original finding
- BSD sysexits.h convention: https://man.openbsd.org/sysexits
