---
title: 'GTCX Infrastructure — 10/10 Remediation Plan'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — 10/10 Remediation Plan

**Status:** In progress (Phase 1 complete)  
**Owner:** Platform Engineering  
**Date:** 2026-05-11
**Baseline score:** 5.9/10 (2026-05-10)
**Current score:** 7.2/10 (after Phase 1)
**Target score:** 10/10

---

## Philosophy

- **Evidence first:** Every remediation produces a reproducible artifact (test, CI run, signed report, or deployed config).
- **Sprint serialization:** Sprint N+1 cannot start until Sprint N exit criteria are evidenced.
- **Bank-grade means:** FFIEC + SOC 2 Type II + ISO 27001 + PCI-DSS alignment evidenced by third-party attestation.

---

## Phase 1: Close Regression Gaps (COMPLETE) — Target: 7.2/10

| #   | Task                                          | Evidence                                                        | Status             |
| --- | --------------------------------------------- | --------------------------------------------------------------- | ------------------ |
| 1.1 | Compliance gateway HTTP integration tests     | `tools/compliance-gateway/tests/server.integration.test.mjs`    | ✅ Complete        |
| 1.2 | Replay-protection production-mode HTTP test   | `tools/replay-protection/tests/production-fail-closed.test.mjs` | ✅ Complete        |
| 1.3 | Add `check:security-control-boundaries` to CI | Required step in `.github/workflows/ci.yml`                     | ✅ Complete        |
| 1.4 | Add `validate.sh` quick mode to CI            | `pnpm test` runs `validate.sh quick`                            | ✅ Complete        |
| 1.5 | Fix `ai` package startup timeout              | `tools/load-tests/run-load-tests.sh` wait loop 120 iterations   | ✅ Complete        |
| 1.6 | Add Kyverno policy validation to CI           | `tools/scripts/kyverno-policy-validator.mjs`                    | ✅ Complete        |
| 1.7 | Add container image signing to build workflow | Cosign in `.github/workflows/build-push-ecr.yml`                | ✅ Already existed |

---

## Phase 2: External Validation + Staging (4–6 weeks) — Target: 7.8/10

| #   | Task                               | Owner               | Evidence                                                                                             | Effort               |
| --- | ---------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------- | -------------------- |
| 2.1 | Commission accredited pen-test     | Security/Leadership | Signed engagement letter; scope covers gateway, replay guard, release/audit paths                    | 1 week (procurement) |
| 2.2 | Pen-test remediation               | Security Engineer   | All critical/high findings triaged; tickets in tracker; no open criticals                            | 2–4 weeks            |
| 2.3 | Establish stable staging/testnet   | SRE                 | `staging.gtcx.trade` with real RDS/Redis; runtime smoke tests in CI                                  | 2 weeks              |
| 2.4 | Runtime smoke evidence in CI       | DevOps              | `generate-release-evidence.mjs` runs against staging; artifact uploaded                              | 3 days               |
| 2.5 | Chaos test PR gate                 | SRE                 | `.github/workflows/chaos-test.yml` triggered monthly; evidence artifacts retained                    | 2 days               |
| 2.6 | DR restore drill in non-production | SRE                 | Quarterly `dr-test.yml` against testnet with real RDS; evidence uploaded                             | 1 week               |
| 2.7 | Incident drill with PagerDuty      | SRE                 | One drill proves routing → acknowledgement → escalation; PagerDuty event log + Slack thread archived | 3 days               |

---

## Phase 3: Institutional Controls (3 months) — Target: 8.5/10

| #    | Task                                | Owner              | Evidence                                                                                                       | Effort  |
| ---- | ----------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------- | ------- |
| 3.1  | SIGNAL scorecard + CI gates         | Platform AI Safety | `docs/audit/signal-scorecard.json` + `tools/scripts/validate-signal.mjs`; 5 pillars instrumented               | 3 weeks |
| 3.2  | Contract tests for protocol APIs    | Platform/Ecosystem | `tools/contract-tests/` with schema tests for tool APIs, replay headers, telemetry                             | 2 weeks |
| 3.3  | Cross-repo CI matrix                | TPM                | GitHub Actions workflow tests `gtcx-protocols` + `gtcx-core` + `gtcx-infrastructure` on every interface change | 2 weeks |
| 3.4  | mTLS service mesh (Linkerd)         | Platform Engineer  | `linkerd check` passes; 100% pods TLS=ok; p99 latency delta <5ms                                               | 3 weeks |
| 3.5  | WAF + VPC Flow Logs                 | Security Engineer  | AWS WAF v2 with OWASP CRS; GuardDuty anomaly detection                                                         | 1 week  |
| 3.6  | Just-in-Time (JIT) access           | Security Engineer  | AWS IAM Identity Center + `kubectl-access` tool; 4-hour session expiry                                         | 2 weeks |
| 3.7  | SoD matrix v1                       | CISO               | Documented separation of duties; board-approved; quarterly review calendar                                     | 1 week  |
| 3.8  | Break-glass procedure               | Security Engineer  | 15-minute max session; PagerDuty alert; post-incident review mandatory                                         | 3 days  |
| 3.9  | Signed container images enforcement | Platform Engineer  | Kyverno `require-signed-images` active; unsigned images rejected at admission                                  | 1 week  |
| 3.10 | Custom CodeQL queries               | Security Engineer  | Crypto-misuse queries detect hardcoded keys, weak randomness, unverified JWTs                                  | 1 week  |
| 3.11 | OWASP ZAP DAST                      | Security Engineer  | Weekly ZAP scan against staging; new findings auto-ticketed                                                    | 1 week  |

---

## Phase 4: Audit Trail + Resilience Hardening (3 months) — Target: 9.2/10

| #    | Task                              | Owner                 | Evidence                                                                              | Effort  |
| ---- | --------------------------------- | --------------------- | ------------------------------------------------------------------------------------- | ------- |
| 4.1  | Tamper-evident audit anchoring    | Security Architecture | ADR accepted; prototype proves Merkle-root generation + verification                  | 4 weeks |
| 4.2  | WORM audit storage (immudb/QLDB)  | Data Platform         | All audit events written with cryptographic proof; tamper detection alert             | 3 weeks |
| 4.3  | 7-year retention enforcement      | Platform Engineer     | S3 Glacier Deep Archive; legal hold; deletion only after legal review                 | 1 week  |
| 4.4  | Multi-region active-active        | Platform Engineer     | Route53 latency routing; DB replication lag <1s; auto-failover <30s                   | 4 weeks |
| 4.5  | Board-approved RTO/RPO            | CISO                  | RTO: 5 min; RPO: 0; board resolution signed; quarterly DR with regulator witness      | 1 week  |
| 4.6  | Backup immutability (Object Lock) | Platform Engineer     | Daily snapshots; compliance mode; cross-region; annual restore-from-scratch           | 1 week  |
| 4.7  | Production chaos engineering      | SRE                   | Monthly Litmus/Gremlin: pod kill, network partition, AZ failure; SLO-based abort      | 2 weeks |
| 4.8  | Real-time audit anomaly detection | Security Engineer     | ML-based detection on audit stream; SIEM integration                                  | 2 weeks |
| 4.9  | HSM-backed key ceremony           | CISO                  | Dual-control 2-of-3 quorum; video recording; tamper-evident storage                   | 1 week  |
| 4.10 | AWS KMS integration               | Security Engineer     | `aws kms sign` replaces Web Crypto; 90-day auto-rotation; CloudTrail 7-year retention | 2 weeks |

---

## Phase 5: Certification + Bank-Grade Closure (3 months) — Target: 10/10

| #   | Task                             | Owner            | Evidence                                                                      | Effort   |
| --- | -------------------------------- | ---------------- | ----------------------------------------------------------------------------- | -------- |
| 5.1 | SOC 2 Type II observation period | CISO             | 6-month observation; trust services criteria mapping; evidence bundle         | 6 months |
| 5.2 | ISO 27001 certification          | CISO             | ISMS scope, risk register, SoA, internal audit, external audit, certificate   | 3 months |
| 5.3 | PCI-DSS SAQ-D / ROC              | Compliance       | QSA engagement; ASV scan; compensating controls documented                    | 2 months |
| 5.4 | FFIEC alignment review           | Compliance       | FFIEC IT Examination Handbook mapping; gap closure evidence                   | 1 month  |
| 5.5 | Final bank-grade audit           | External Auditor | Independent forensic audit; all dimensions 10/10; no open criticals; sign-off | 2 weeks  |
| 5.6 | Pilot packet update              | GTM/Compliance   | Agreement, success criteria, DPA, data-flow evidence internally consistent    | 2 weeks  |
| 5.7 | Update score-evidence ledger     | Repo Lead        | Final 10/10 entries for all dimensions with certification artifacts cited     | 1 day    |

---

## Score Trajectory

```
5.9 ──► 6.8 ──► 7.2 ──► 7.8 ──► 8.5 ──► 9.2 ──► 10.0
  │      │       │       │       │       │       │
  │      │       │       │       │       │       └── Phase 5: Certification
  │      │       │       │       │       └── Phase 4: Audit + Resilience
  │      │       │       │       └── Phase 3: Institutional Controls
  │      │       │       └── Phase 2: External Validation + Staging
  │      │       └── Phase 1: Regression Gaps (COMPLETE)
  │      └── Sprint 4: DR + Load Tests + Incident Drills
  └── Baseline: 2026-05-10 Master Audit
```

---

## Files Referenced

- `docs/audit/archive/master-audit-2026-05-11.md` — This audit document
- `docs/audit/score-evidence-ledger.json` — Score history with artifacts
- `tools/compliance-gateway/tests/server.integration.test.mjs` — HTTP integration tests
- `tools/replay-protection/tests/production-fail-closed.test.mjs` — Production 503 test
- `tools/scripts/kyverno-policy-validator.mjs` — Policy structural validator
- `.github/workflows/ci.yml` — Hardened CI with required evidence gates
- `infra/scripts/validate.sh` — Local validation entrypoint
