---
title: 'Global South 10/10 — Production Readiness Plan'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Global South 10/10 — Production Readiness Plan

**Context:** GTCX operates in Zimbabwe, Kenya, Nigeria, South Africa, and expanding across the Big 8 African markets. The regulatory environment is central bank sandbox licensing, not FFIEC examination. The infrastructure reality is af-south-1 with intermittent connectivity. The capital constraint is seed-to-Series A, not Goldman Sachs IT budget.

**This plan replaces** the $750K-$1.3M, 12-month FFIEC/SOC 2/ISO 27001 remediation plan with what actually matters for getting — and keeping — a central bank sandbox license in the Global South.

---

## Scoring Framework

Not FFIEC. Not PCI-DSS. Scored against what an RBZ, CBK, or CBN examiner actually reviews before granting a fintech sandbox license:

| Domain                   | What the regulator asks                          | Weight   |
| ------------------------ | ------------------------------------------------ | -------- |
| **Data sovereignty**     | Where does data live? Can I subpoena it?         | Critical |
| **KYC/AML compliance**   | Are you retaining records per our circular?      | Critical |
| **Audit trail**          | Can you show me who did what and when?           | Critical |
| **Encryption**           | Is data encrypted at rest and in transit?        | High     |
| **Access control**       | Who can access what? How do you prove it?        | High     |
| **Incident response**    | What happens when something goes wrong?          | High     |
| **Business continuity**  | Will you stay up during a power cut / fiber cut? | High     |
| **Change management**    | How do you deploy changes? Can I trace them?     | Medium   |
| **Penetration test**     | Has anyone tried to break this?                  | Medium   |
| **Operational maturity** | Do you have runbooks? Who is on call?            | Medium   |

---

## Current Score

| Domain                 | Score      | Evidence                                                                               |
| ---------------------- | ---------- | -------------------------------------------------------------------------------------- |
| Data sovereignty       | 9/10       | af-south-1, compliance-db module with 8 jurisdictions, per-country retention           |
| KYC/AML compliance     | 9/10       | Jurisdiction-aware retention (RBZ: 5yr KYC, 7yr audit), KYC document storage with IRSA |
| Audit trail            | 8/10       | Append-only audit DB, structured logging, WORM module ready to deploy                  |
| Encryption             | 9/10       | KMS, TLS 1.3, RDS encryption, S3 SSE-KMS, encryption-enforcement Config rules          |
| Access control         | 8/10       | RBAC, IRSA, SoD matrix, MFA policy, JIT access policy                                  |
| Incident response      | 8/10       | IRP v1.0 with RBZ/CBK/CBN templates, severity classification, escalation matrix        |
| Business continuity    | 7/10       | RTO/RPO documented, backup module, DR runbook — but never tested                       |
| Change management      | 9/10       | Git, CI gates, conventional commits, release evidence, Terraform state                 |
| Penetration test       | 3/10       | No pen-test has been conducted                                                         |
| Operational maturity   | 7/10       | 25 runbooks, monitoring dashboards, alerts — but no traffic, no incidents              |
| **Weighted composite** | **7.7/10** |                                                                                        |

---

## Current Status — 2026-06-05

The plan below was written 2026-05-08 when "everything is committed but nothing is running." Since then, significant progress:

| #   | Task                                           | Original Status | Current Status                                                                                     | Evidence                                                                                     |
| --- | ---------------------------------------------- | --------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1.1 | `terraform apply` — VPC, EKS, RDS, ECR, KMS    | Not started     | **Done** — staging live since May 2026                                                             | `04-ship/terraform/environments/staging/`                                                    |
| 1.2 | Deploy replay-guard, protocols, NATS to EKS    | Not started     | **Done** — `compliance-gateway-staging`, `gtcx-protocols-staging`, `redis-staging` all Running     | `04-ship/kubernetes/overlays/staging/`                                                       |
| 1.3 | Deploy monitoring stack                        | Not started     | **Partial** — Prometheus/Grafana manifests committed; Alertmanager configured; no live traffic yet | `04-ship/monitoring/`                                                                        |
| 1.4 | Wire KMS signing key                           | Not started     | **Done** — `alias/gtcx-production-sovereign-gh-bog` live; staging IRSA trusted; INF-86 unblocked   | `01-docs/09-security/key-ceremony-runbook.md`                                                |
| 1.5 | Deploy WORM audit storage                      | Not started     | **Structural done** — WORM module + CI job (`IR-3.1`) committed; live S3 upload = operator step    | `.github/workflows/ci.yml`                                                                   |
| 1.6 | DR test: snapshot restore, verify RTO < 30 min | Not started     | **Done** — Live PITR restore 2026-06-04; RTO ~20m; RPO 0                                           | `01-docs/05-audit/evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json` |
| 1.7 | Chaos test: kill pod, verify HPA recovers      | Not started     | **Partial** — Litmus operator installed (`litmus` namespace); chaos experiments not yet run        | Commit `1b9333d`                                                                             |
| 1.8 | Generate release evidence bundle               | Not started     | **Done** — `runtime-evidence-check` dry-run gate passes; signed bundle generation verified         | `03-platform/tools/scripts/runtime-evidence-check.mjs`                                       |
| 2.1 | Engage pen-test firm                           | Not started     | **Partial** — Vendor selected (SensePost); SOW signature pending (EXT-INF-002)                     | `01-docs/08-gtm/regulatory/pentest-scope-rfp.md`                                             |
| 3.1 | Board signs IRP v1.0                           | Not started     | **Pending** — Document ready; board meeting not scheduled                                          | `01-docs/08-gtm/regulatory/incident-response-plan-v1.md`                                     |
| 3.2 | Board signs RTO/RPO resolution                 | Not started     | **Pending** — Document ready; board meeting not scheduled                                          | `01-docs/08-gtm/regulatory/rto-rpo-resolution.md`                                            |

**Net progress:** Gap 1 (deploy and prove) is ~80% complete. Gap 2 (pen-test) is ~30% complete (vendor selected, SOW pending). Gap 3 (board + submission) is ~10% complete (docs ready, signatures pending).

---

## The Gap to 10/10

Three things. That's it.

### Gap 1: Deploy and prove it works (7.7 → 9.0)

Everything is committed but nothing is running. A regulator doesn't grade Terraform files — they grade a live system.

| #   | Task                                                                                | Effort   | Cost         |
| --- | ----------------------------------------------------------------------------------- | -------- | ------------ |
| 1.1 | `terraform apply` — VPC, EKS, RDS, ECR, KMS in af-south-1                           | 1 day    | ~$800/mo AWS |
| 1.2 | Deploy replay-guard, protocols, NATS to EKS                                         | 1 day    | $0           |
| 1.3 | Deploy monitoring stack (Prometheus, Grafana, alerts)                               | 1 day    | $0           |
| 1.4 | Wire KMS signing key (run key generation, not a ceremony — two engineers on a call) | 2 hours  | $0           |
| 1.5 | Deploy WORM audit storage, verify events land in S3                                 | 2 hours  | ~$5/mo S3    |
| 1.6 | Run DR test: snapshot restore, verify RTO < 30 min, record results                  | Half day | $0           |
| 1.7 | Run one chaos test: kill a pod, verify HPA recovers, record results                 | 1 hour   | $0           |
| 1.8 | Generate release evidence bundle for testnet deployment                             | 1 hour   | $0           |

**Timeline:** 1 week
**Cost:** ~$800/mo infrastructure
**Outcome:** Live testnet with provable DR test, chaos test, audit trail, and monitoring

### Gap 2: Penetration test (3/10 → 9/10)

No examiner will grant a license without one. But this is not a $100K NCC Group engagement.

| #   | Task                                                                                             | Effort          | Cost     |
| --- | ------------------------------------------------------------------------------------------------ | --------------- | -------- |
| 2.1 | Engage a regional firm: Serianu (Nairobi), Liquid Cyber (Johannesburg), or CyberTech ZW (Harare) | 1 week to scope | $8K-$15K |
| 2.2 | Scope: replay-guard API, AGX endpoints, mobile app, infrastructure                               | —               | —        |
| 2.3 | Test window: 2 weeks                                                                             | —               | —        |
| 2.4 | Remediate critical/high findings                                                                 | 1-2 weeks       | $0       |
| 2.5 | Retest                                                                                           | 3 days          | Included |
| 2.6 | File pen-test report with sandbox application                                                    | —               | —        |

**Timeline:** 4-6 weeks
**Cost:** $8K-$15K
**Outcome:** Clean pen-test report from a recognized regional firm

### Gap 3: Board sign-off + first regulatory submission (9.0 → 10/10)

The IRP, RTO/RPO resolution, and compliance framework exist. They need signatures and one real interaction with the regulator.

| #   | Task                                                                                                                              | Effort             | Cost                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------------------------------- |
| 3.1 | Board signs IRP v1.0                                                                                                              | 1 meeting          | $0                              |
| 3.2 | Board signs RTO/RPO resolution                                                                                                    | Same meeting       | $0                              |
| 3.3 | Submit sandbox application to RBZ/CBK with: pen-test report, architecture overview, IRP, data residency evidence, DR test results | 1 week to assemble | $0-$5K (application fee varies) |
| 3.4 | Respond to regulator questions (they always ask questions)                                                                        | 2-4 weeks          | $0                              |
| 3.5 | Run tabletop exercise (IRP walkthrough with team, 2 hours)                                                                        | 2 hours            | $0                              |
| 3.6 | Conduct first quarterly security review (document in risk register)                                                               | Half day           | $0                              |

**Timeline:** 4-6 weeks (parallel with pen-test)
**Cost:** $0-$5K
**Outcome:** Sandbox application submitted with complete evidence package

---

## Timeline

```
Week 1-2:     Deploy testnet (Gap 1: tasks 1.1-1.8)
              Engage pen-test firm (Gap 2: task 2.1)
              Board meeting scheduled (Gap 3: tasks 3.1-3.2)

Week 3-4:     Pen-test in progress (Gap 2: tasks 2.2-2.3)
              Board signs IRP + RTO/RPO (Gap 3)
              Tabletop exercise (Gap 3: task 3.5)

Week 5-6:     Pen-test report received
              Remediate findings (Gap 2: task 2.4)

Week 7-8:     Retest clean (Gap 2: task 2.5)
              Assemble sandbox application (Gap 3: task 3.3)
              Submit to regulator

Week 9-12:    Respond to regulator questions (Gap 3: task 3.4)
              Continue operating testnet, accumulating evidence
```

**Total timeline: 8 weeks to submission, 12 weeks to 10/10**
**Total cost: $8K-$20K + ~$800/mo infrastructure**

---

## What We Are NOT Doing

| FFIEC plan item                   | Why we skip it                                                        | When it matters                                        |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ |
| FIPS 140-2 HSM                    | No African regulator requires it. AWS KMS is sufficient.              | If we pursue US banking partnerships                   |
| SOC 2 Type II ($40-80K, 6 months) | Not required for sandbox. Not required for Series A in Africa.        | When onboarding a Tier 1 bank as a client              |
| ISO 27001 ($30-60K, 4 months)     | Nice to have. No sandbox requires it.                                 | When bidding for government contracts                  |
| Dedicated CISO ($250-400K/yr)     | A fractional security lead or the CTO can own security at this stage. | When the team exceeds 30 engineers                     |
| 24/7 managed SOC ($50-100K/yr)    | CloudWatch + PagerDuty + on-call rotation covers this.                | Post-revenue, when SLA guarantees are contractual      |
| Bug bounty ($50-100K/yr)          | Zero users in production. No attack surface to crowdsource.           | When there's a public-facing product with real traffic |
| Red team exercise ($30-50K)       | A pen-test covers the same ground at this stage.                      | Annual, post-Series B                                  |
| SLSA L3 supply chain attestation  | Regulator doesn't know what this is. Cosign image signing is enough.  | When selling to enterprises with supply chain policies |

**Total savings vs FFIEC plan: $700K-$1.2M in Year 1.**

---

## Evidence Package for Sandbox Application

What the regulator actually receives:

1. **Architecture overview** — 2 pages, diagram, tech stack, data flow
2. **Data residency proof** — Terraform config showing af-south-1, `compliance-db` jurisdiction config
3. **Encryption statement** — KMS key ARNs, TLS configuration, RDS encryption status
4. **KYC retention schedule** — Per-jurisdiction table from `compliance-db` module
5. **Audit trail sample** — 1 week of audit events from testnet (JSON export)
6. **Access control matrix** — SoD matrix + RBAC role definitions
7. **Incident response plan** — IRP v1.0 (board-signed)
8. **Business continuity** — RTO/RPO resolution (board-signed) + DR test results
9. **Penetration test report** — From regional firm, CVSS-scored, remediated
10. **Change management evidence** — Git log, CI pipeline, release evidence bundle

That's it. No 200-page SOC 2 report. No ISO certificate. No FIPS attestation. Ten documents, assembled from what already exists in this repo.

---

## Score After Execution

| Domain                 | Before  | After   | What changed                                       |
| ---------------------- | ------- | ------- | -------------------------------------------------- |
| Data sovereignty       | 9       | 10      | Running in af-south-1, provable via console        |
| KYC/AML compliance     | 9       | 10      | Live audit events, retention proven                |
| Audit trail            | 8       | 10      | WORM storage deployed, events flowing              |
| Encryption             | 9       | 10      | KMS key live, TLS proven in traffic                |
| Access control         | 8       | 9       | RBAC active on live cluster                        |
| Incident response      | 8       | 10      | Board-signed IRP, tabletop completed               |
| Business continuity    | 7       | 10      | DR test recorded, chaos test recorded              |
| Change management      | 9       | 10      | Release evidence from live deployment              |
| Penetration test       | 3       | 9       | Clean report from regional firm                    |
| Operational maturity   | 7       | 9       | Traffic flowing, alerts firing, runbooks exercised |
| **Weighted composite** | **7.7** | **9.7** |                                                    |

The 0.3 to true 10/10 comes from 3-6 months of operational history — regulators want to see sustained compliance, not a point-in-time snapshot. That happens naturally as the testnet runs.

---

## Decision: Which Plan?

| If you are...                                       | Use this plan                                    | Timeline   | Cost             |
| --------------------------------------------------- | ------------------------------------------------ | ---------- | ---------------- |
| Launching in African sandbox markets                | **This plan (Global South 10/10)**               | 8-12 weeks | $8-20K + $800/mo |
| Seeking US/EU bank subsidiary license               | FFIEC 10/10 plan                                 | 12 months  | $750K-$1.3M      |
| Pursuing Tier 1 bank partnership (Stanbic, Ecobank) | Start with this plan, add pen-test + SOC 2 later | 6 months   | $60-100K         |
| Going for government procurement (AfCFTA, AU)       | Start with this plan, add ISO 27001              | 8 months   | $40-80K          |

---

---

## Appendix: The $0 Path

If even $8-15K for a pen-test is a constraint, here is the zero-cash path to a credible 10/10:

### Self-Assessment Pen-Test ($0)

African regulators do not mandate a specific pen-test vendor. They mandate that a test was conducted. For a sandbox application (not a full banking license), a documented self-assessment is often accepted if it demonstrates rigor.

1. **Run OWASP ZAP** against the staging API (DAST pipeline already committed in `.github/workflows/dast-zap.yml`). Export the HTML report.
2. **Run Trivy** against all container images (already in CI). Export SARIF + SBOM.
3. **Run CodeQL** with the custom crypto queries (already in CI). Export SARIF.
4. **Run `npm audit`** on all workspaces. Export JSON.
5. **Manual testing**: use the OWASP Testing Guide v4.2 checklist. Two engineers spend 2 days testing each other's work. Document findings in a spreadsheet.
6. **Write a pen-test summary report**: executive summary, methodology (OWASP TG v4.2 + automated scanning), findings (CVSS-scored), remediation status. Sign it as "Internal Security Assessment."

Submit this with the sandbox application. If the regulator pushes back, you upgrade to a formal pen-test later — but many sandbox applications in East Africa have been approved with internal assessments.

### Free Infrastructure ($0/mo)

For testnet/sandbox (not production):

- **AWS Activate for Startups**: $5K-$100K in credits. Apply through an accelerator (MEST, Founders Factory Africa, Norrsken) or directly.
- **Google for Startups Cloud Program**: $100K in GCP credits (if willing to port to GKE).
- **Azure for Startups**: $25K-$150K in credits via Microsoft for Startups Founders Hub.
- **Railway / Render free tier**: For the replay-guard service only (if decoupled from EKS).

### Community Pen-Test ($0)

- **OWASP Chapter**: Most African capitals have an OWASP chapter (Nairobi, Lagos, Johannesburg, Accra). Offer a security review session to the local chapter — they get practice, you get findings.
- **University partnerships**: Computer science security courses at University of Nairobi, University of Cape Town, or Ashesi University often need real-world projects. Offer your API as a lab exercise.
- **Bug bounty preview**: Invite 3-5 known security researchers from the African infosec community for a private preview. Recognition + small gift cards ($50-100 each) instead of formal bounty payouts.

### Regulator Relationship ($0)

This is the most underused lever. Every sandbox program in Africa has an innovation office. They want you to succeed because your success validates their program.

- **Pre-submission meeting**: Request a 30-minute informal meeting with the sandbox team before submitting. Ask: "What do you need to see from us?" They will tell you exactly what they're looking for. No guessing.
- **Reference check**: Ask if they can point you to a successful sandbox applicant's public submission (some regulators publish redacted versions).
- **Iterative submission**: Most sandbox programs allow you to submit incomplete and iterate. Don't wait for perfection — submit early, respond to feedback.

### Total: $0 + time

| Item            | Cost       | Alternative                                             |
| --------------- | ---------- | ------------------------------------------------------- |
| Infrastructure  | $0         | AWS Activate credits                                    |
| Pen-test        | $0         | Internal assessment + OWASP ZAP + community review      |
| Application fee | $0-$5K     | Varies by jurisdiction (Kenya: free, Zimbabwe: nominal) |
| Board sign-off  | $0         | Same people, same meeting                               |
| **Total**       | **$0-$5K** |                                                         |

This path takes 6-8 weeks and gets you into a sandbox. Once in the sandbox, revenue validates the spend on a formal pen-test and production infrastructure.

_Plan authored: 2026-05-08_
_Applicable jurisdictions: Zimbabwe (RBZ), Kenya (CBK), Nigeria (CBN), South Africa (SARB/FSCA), Ghana (BoG), Egypt (CBE), Tanzania (BoT), Rwanda (BNR)_
_Reviewed against: RBZ Fintech Regulatory Sandbox Guidelines (2023), CBK Regulatory Sandbox Guidelines (2020), CBN Regulatory Sandbox Framework (2021)_
