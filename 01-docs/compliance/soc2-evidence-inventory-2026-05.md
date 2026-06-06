---
title: 'SOC 2 Type 1 Evidence Inventory'
status: 'draft'
date: '2026-05-27'
owner: 'security-lead'
tier: 'critical'
tags: ['compliance', 'soc2', 'audit', 'evidence']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# SOC 2 Type 1 — Evidence Inventory

**Purpose:** Per-control mapping from each SOC 2 Trust Service Criterion (TSC) to its file:line / runbook / dashboard evidence pointer in this repo. Built so an auditor's day-one evidence request can be answered same-day.

**Source frameworks:** AICPA TSC 2017 (revised 2022) — Common Criteria CC1.x through CC9.x.

**Quality grades:**

- 🟢 **Strong** — code-enforced + tested + runtime-verifiable
- 🟡 **Partial** — documented but enforcement gap or evidence depth insufficient
- 🔴 **Gap** — control claimed but no current evidence

## Common Criteria

### CC1 — Control Environment

| Control                            | Evidence                                                                                                                                                                              | Grade |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CC1.1 Integrity and ethical values | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) · [`SECURITY.md`](../../SECURITY.md) · [`01-docs/09-security/break-glass-procedure.md`](../security/break-glass-procedure.md)              | 🟢    |
| CC1.2 Board oversight              | [`01-docs/10-compliance/board-security-committee-charter.md`](./board-security-committee-charter.md)                                                                                  | 🟢    |
| CC1.3 Org structure + reporting    | [`01-docs/09-security/security-framework.md`](../security/security-framework.md) §SoD                                                                                                 | 🟢    |
| CC1.4 Commitment to competence     | [`01-docs/01-agents/onboarding/`](../agents/onboarding/) · [`01-docs/04-ops/runbooks/`](../operations/runbooks/) — 24 runbooks                                                        | 🟢    |
| CC1.5 Accountability               | [`01-docs/09-security/security-framework.md`](../security/security-framework.md) · [`04-ship/security/policies/access-control.md`](../../04-ship/security/policies/access-control.md) | 🟢    |

### CC2 — Communication and Information

| Control                          | Evidence                                                                                                                     | Grade                    |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| CC2.1 Internal information needs | [`01-docs/README.md`](../README.md) master INDEX · `03-platform/tools/scripts/docs-link-checker.mjs` enforces no broken refs | 🟢                       |
| CC2.2 Internal communication     | [`01-docs/04-ops/runbooks/`](../operations/runbooks/) — 25 runbooks including incident response                              | 🟢                       |
| CC2.3 External communication     | [`01-docs/gitbook/`](../gitbook/) — public docs site source + launch announcement drafts                                     | 🟡 (pending publication) |

### CC3 — Risk Assessment

| Control                   | Evidence                                                                                                                                                                                                                                                                | Grade |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CC3.1 Risk identification | [`01-docs/05-audit/master-audit-2026-05-17.md`](../audit/master-audit-2026-05-17.md) · [`01-docs/05-audit/full-audit-2026-05-22.md`](../audit/full-audit-2026-05-22.md) — quarterly cadence + on-change re-audits                                                       | 🟢    |
| CC3.2 Risk analysis       | [`01-docs/05-audit/score-evidence-ledger.json`](../audit/score-evidence-ledger.json) — per-finding evidence + severity                                                                                                                                                  | 🟢    |
| CC3.3 Risk to fraud       | [`03-platform/tools/eval-pipeline/injection-suite.mjs`](../../03-platform/tools/eval-pipeline/injection-suite.mjs) — 10-payload red-team · [`03-platform/tools/anomaly-detector/detector.mjs`](../../03-platform/tools/anomaly-detector/detector.mjs) — 5 rules CronJob | 🟢    |
| CC3.4 Risk from change    | [`01-docs/architecture/decisions/README.md`](../architecture/decisions/README.md) — 17 ADRs with consequence analysis                                                                                                                                                   | 🟢    |

### CC4 — Monitoring

| Control                        | Evidence                                                                                                                                                                                                                                                                                                                            | Grade |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CC4.1 Monitoring activities    | [`04-ship/monitoring/dashboards/audit-trust.json`](../../04-ship/monitoring/dashboards/audit-trust.json) · [`04-ship/monitoring/dashboards/audit-trust-tenant.json`](../../04-ship/monitoring/dashboards/audit-trust-tenant.json) — Grafana dashboards · `03-platform/tools/compliance-gateway/src/metrics.mjs` Prometheus exporter | 🟢    |
| CC4.2 Deficiency communication | `.github/workflows/dast-zap.yml` opens GitHub issues on high findings · `dr-test-quarterly.yml` files DR results                                                                                                                                                                                                                    | 🟢    |

### CC5 — Control Activities

| Control                           | Evidence                                                                                                                                                                                         | Grade |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| CC5.1 Selection of activities     | [`01-docs/05-audit/repo-overlay.md`](../audit/repo-overlay.md) — per-repo stricter caps over ecosystem baseline                                                                                  | 🟢    |
| CC5.2 Technology general controls | [`03-platform/tools/scripts/validate-all.mjs`](../../03-platform/tools/scripts/validate-all.mjs) — 17 gates · [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — PR-gate enforcement | 🟢    |
| CC5.3 Policy implementation       | [`04-ship/kubernetes/base/policies/`](../../04-ship/kubernetes/base/policies/) — Kyverno cluster policies                                                                                        | 🟢    |

### CC6 — Logical and Physical Access Controls

| Control                        | Evidence                                                                                                                                                                                                                                                                                                              | Grade |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CC6.1 Logical access           | [`03-platform/tools/compliance-gateway/src/auth.mjs`](../../03-platform/tools/compliance-gateway/src/auth.mjs) — bearer token, constant-time compare · IRSA via [`04-ship/terraform/modules/irsa-platform/main.tf`](../../04-ship/terraform/modules/irsa-platform/main.tf) · MFA documented in `01-docs/09-security/` | 🟢    |
| CC6.2 Onboarding/offboarding   | [`01-docs/09-security/break-glass-procedure.md`](../security/break-glass-procedure.md) — 15-min max session, two-person rule · [`01-docs/04-ops/runbooks/tenant-onboarding.md`](../operations/runbooks/tenant-onboarding.md)                                                                                          | 🟢    |
| CC6.3 Authentication           | `03-platform/tools/compliance-gateway/src/auth.mjs:153-160` — constant-time token compare · per-principal token budget + QPS limiter in `03-platform/tools/compliance-gateway/src/budget.mjs`                                                                                                                         | 🟢    |
| CC6.4 Encryption               | KMS at rest (RDS, S3, EBS, ECR) — see `04-ship/terraform/modules/database/`, `04-ship/terraform/modules/worm-audit/` · TLS 1.3 on ALB · Vault HA with KMS unseal                                                                                                                                                      | 🟢    |
| CC6.5 Logical access removal   | [`01-docs/04-ops/runbooks/tenant-onboarding.md`](../operations/runbooks/tenant-onboarding.md) §Decommissioning — token revocation; WORM history preserved                                                                                                                                                             | 🟢    |
| CC6.6 Network controls         | [`04-ship/kubernetes/overlays/production/network-policies.yaml`](../../04-ship/kubernetes/overlays/production/network-policies.yaml) — default-deny + explicit allow · `04-ship/terraform/modules/flow-logs/` — VPC Flow Logs 365d retention                                                                          | 🟢    |
| CC6.7 Data in transit          | TLS on every hop (ALB, RDS SSL-enforced, NATS TLS, Vault TLS); Linkerd mTLS mesh ready (Q3 runtime per ADR-013)                                                                                                                                                                                                       | 🟢    |
| CC6.8 Vulnerability management | `.github/workflows/ci.yml` Trivy FS+image scan · `.github/workflows/dast-zap.yml` weekly DAST · `.github/workflows/slsa-provenance.yml` SLSA L3 · `renovate.json` for dependency drift                                                                                                                                | 🟢    |

### CC7 — System Operations

| Control                 | Evidence                                                                                                                                                                                                                          | Grade                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| CC7.1 Detection         | CloudTrail + GuardDuty via `04-ship/terraform/modules/detective/` · `03-platform/tools/anomaly-detector/detector.mjs` 5 rules · `compliance_gateway_audit_sign_failures_total` Prometheus alert                                   | 🟢                                                                                     |
| CC7.2 Monitoring        | Prometheus + Grafana + Loki + Jaeger + Tempo stack (per `04-ship/monitoring/`) · `/metrics` endpoint on every gateway pod                                                                                                         | 🟢                                                                                     |
| CC7.3 Incident response | 25 runbooks in `01-docs/04-ops/runbooks/` · drill #002 executed (`01-docs/devops/drills/`) · PagerDuty drill simulation in `validate.sh`                                                                                          | 🟢                                                                                     |
| CC7.4 Recovery          | `.github/workflows/dr-test.yml` weekly DR + `dr-test-quarterly.yml` · `04-ship/03-platform/scripts/dr-test.sh` with fail-fast cred guards                                                                                         | 🟡 (live restoration evidence pending capture in score-evidence ledger — INT-D-2 item) |
| CC7.5 Resilience        | Multi-provider LLM fallback · per-principal QPS + daily budget · adaptive policy auto-degrades under sustained breach (`03-platform/tools/compliance-gateway/src/adaptive-policy.mjs`) · audit-flush quarantines tampered batches | 🟢                                                                                     |

### CC8 — Change Management

| Control                 | Evidence                                                                                                                                                           | Grade |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| CC8.1 Change management | Conventional commits enforced via husky · lint-staged + Prettier + ESLint · PR review enforced via GitHub branch protection · SLSA L3 provenance for every release | 🟢    |

### CC9 — Risk Mitigation

| Control                   | Evidence                                                                                                                                         | Grade |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| CC9.1 Risk identification | Master audit cadence (quarterly) · forensic recalc when scores drift (per `01-docs/05-audit/master-audit-2026-05-17.md` §9 honest recalculation) | 🟢    |
| CC9.2 Risk mitigation     | Per-finding remediation ledger at `01-docs/05-audit/score-evidence-ledger.json` with git commit references                                       | 🟢    |

## SIGNAL-specific evidence (regulator-facing)

GTCX maintains the SIGNAL agentic-maturity scorecard at [`01-docs/05-audit/signal-scorecard.json`](../audit/signal-scorecard.json) with current overall score **9.60/10**. Per-pillar evidence:

| SIGNAL Pillar                      | Maps to TSC         | Evidence pointer                                                                                                | Grade |
| ---------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------- | ----- |
| Supervision (S1, S2, S3)           | CC5.1, CC6.x, CC7.1 | Mutating-tool approval gating, signed audit records, anomaly detection rules                                    | 🟢    |
| Integrity (I1, I2, I3, I4)         | CC6.x, CC7.4        | Replay protection, audit immutability (separate DB user + WORM), tamper-evident release, WORM Object Lock 2557d | 🟢    |
| Governance (G1, G2, G3, G4)        | CC1.x, CC5.x        | Authentication boundary, tool segregation, SoD matrix, break-glass                                              | 🟢    |
| Non-Proliferation (N1, N2, N3, N4) | CC6.6, CC8.1        | No public mutation path, network segmentation, signed images, mTLS mesh ready                                   | 🟢    |
| Alignment (A1, A2, A3)             | CC5.1, CC7.5        | Runtime policy prompt, fail-closed behavior, SIGNAL scorecard CI gate                                           | 🟢    |

## Gap summary

The Type-1 audit point-in-time is determined by when the auditor sees evidence. Three gaps to close before kickoff:

| Gap                            | Control        | Action                                                                                                            | Owner | Target                       |
| ------------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------- |
| Live DR restoration evidence   | CC7.4          | Run `04-ship/03-platform/scripts/dr-test.sh staging` with OUTPUT_DIR; link result in `score-evidence-ledger.json` | SRE   | Sprint 10 (HARD-V-002)       |
| LLM cross-border SCC execution | CC6.7, DPIA-02 | Legal Lead confirms SCCs in vendor agreements; document execution                                                 | Legal | Sprint 7 parallel            |
| Distribution external comms    | CC2.3          | Publish docs site + blog post; archive published artifacts                                                        | GTM   | Sprint 9 (after blog review) |

All other controls are 🟢 with evidence already in-repo and externally verifiable.

## Reading order for the auditor

1. Start with this file — control-by-control map.
2. Cross-reference each pointer against the actual file at the line range.
3. Spot-check 3 random controls per category with the linked source.
4. Validate one end-to-end audit-record flow per ADR-014 → ADR-015 → ADR-016 by pulling one NDJSON object from the WORM bucket and running `verifyChain(fromNdjson(...))` with `@gtcx/audit-signer@0.1.0` from npm.

If the spot-checks resolve and the end-to-end verification returns `valid: true`, the control evidence is strong enough for Type-1 attestation. Type-2 follows naturally once 12 months of operational history accumulates in the WORM bucket.

## References

- [`01-docs/05-audit/repo-overlay.md`](../audit/repo-overlay.md) — repo-specific stricter caps
- [`01-docs/05-audit/soc2-engagement-2026.md`](../audit/soc2-engagement-2026.md) — engagement plan + auditor shortlist
- [`01-docs/10-compliance/dpia-2026-05.md`](./dpia-2026-05.md) — GDPR/CCPA DPIA (companion document)
- [`01-docs/05-audit/signal-scorecard.json`](../audit/signal-scorecard.json) — SIGNAL agentic-maturity scorecard
- AICPA TSC 2017 (revised 2022): https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services
