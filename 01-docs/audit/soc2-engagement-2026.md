---
title: 'SOC 2 Type 1 Engagement Plan'
status: 'final'
date: '2026-05-27'
owner: 'security-lead'
target_send_date: '2026-05-29'
review_cycle: 'one-shot'
tags: ['compliance', 'soc2', 'audit']
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
---

# SOC 2 Type 1 — Engagement Plan

## Why now

Stage gate S2→S3 requires SOC 2 Type 1 (per `01-docs/05-audit/master-audit-2026-05-17.md:135`). No regulated commercial bank in OECD geography will sign without it. Type 1 is point-in-time; Type 2 (12-month observation window) follows once we have ≥6 months of WORM-audited operational evidence.

## Trust Service Criteria targeted

| Criterion                          | Status  | Evidence                                                                                                                                     |
| ---------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **CC6.1 Logical access**           | Strong  | `03-platform/tools/compliance-gateway/03-platform/src/auth.mjs`, IRSA everywhere, no static creds, MFA documented in `01-docs/09-security/`. |
| **CC6.2 Onboarding/offboarding**   | Strong  | `01-docs/09-security/break-glass-procedure.md`, two-person rule, 15-minute sessions.                                                         |
| **CC6.3 Authentication**           | Strong  | Constant-time token compare, per-principal token budget, rate limiting.                                                                      |
| **CC6.4 Encryption**               | Strong  | KMS at rest (RDS/S3/EBS/ECR), TLS 1.3 on ALB, Vault TLS enabled.                                                                             |
| **CC6.6 Network controls**         | Strong  | Deny-by-default NetworkPolicies, Kyverno admission, Linkerd mesh policies ready (Q3 runtime).                                                |
| **CC6.7 Data transmission**        | Strong  | TLS on every hop, SSL-enforced RDS, NATS TLS.                                                                                                |
| **CC6.8 Vulnerability management** | Strong  | Trivy FS+image, SBOM, SLSA L3, weekly DAST.                                                                                                  |
| **CC7.1 Detection**                | Strong  | CloudTrail, GuardDuty, anomaly-detector cron with 5 rules, SLO burn-rate alerts.                                                             |
| **CC7.2 Monitoring**               | Strong  | Prometheus + Grafana + Loki + Jaeger + Tempo.                                                                                                |
| **CC7.3 Incident response**        | Strong  | 24+ runbooks in `01-docs/04-ops/runbooks/`, drill #002 executed.                                                                             |
| **CC7.4 Recovery**                 | Partial | Quarterly DR test workflow exists; restoration evidence not yet in ledger. Address in Sprint 5.                                              |
| **CC7.5 Resilience**               | Strong  | Multi-provider LLM fallback, per-principal QPS, audit chain durable via NATS+WORM.                                                           |
| **CC8.1 Change management**        | Strong  | Conventional commits, husky hooks, lint-staged, PR review, SLSA L3 attestation.                                                              |
| **CC9.1 Risk identification**      | Strong  | Master audit cadence (quarterly), forensic recalc when scores drift.                                                                         |
| **CC9.2 Risk mitigation**          | Strong  | Per-finding remediation ledger at `01-docs/05-audit/score-evidence-ledger.json`.                                                             |

**Gap analysis verdict:** ~92% Type 1 ready. The remaining 8% is: (a) pen-test report (Sprint 4 parallel track), (b) DR restoration evidence captured in the ledger (Sprint 5), (c) live on-call rotation evidence (paper drill exists; first live page deferred until Sprint 5 capacity work lands).

## Shortlisted auditors

| Firm             | Cost band | Geography | African DFI experience | Notes                                           |
| ---------------- | --------- | --------- | ---------------------- | ----------------------------------------------- |
| Schellman        | $$$$      | US        | Limited                | Highest brand value to OECD buyers.             |
| A-LIGN           | $$$       | US/Global | Some                   | Faster turnaround; well-known for SaaS.         |
| BDO South Africa | $$        | SA        | Strong                 | Local presence; familiar with SARB/RBZ context. |
| Mazars           | $$$       | Global    | Strong                 | Pan-African footprint.                          |

**Recommendation:** Send to all four. Pick the firm whose initial scoping conversation demonstrates the strongest grasp of the WORM/JetStream/Ed25519 substrate. Vendor selection follows pen-test vendor selection by one week so we can negotiate a coordinated artifact set.

## Outreach Template

> Subject: SOC 2 Type 1 Engagement — GTCX (AI-Native Compliance Platform, af-south-1)
>
> Hello [Firm],
>
> GTCX operates an AI-native compliance platform serving African commodity trade. Our infrastructure is documented as a 250+ document corpus including the master audit (`01-docs/05-audit/master-audit-2026-05-17.md`, core 8.48/10), a SIGNAL agentic-maturity scorecard (9.29/10), and 24+ operational runbooks.
>
> We are seeking SOC 2 Type 1 attestation against the Trust Service Criteria scope outlined in [`soc2-engagement-2026.md`](./soc2-engagement-2026.md). A penetration test is running in parallel (RFP in [`pen-test-rfp-2026.md`](./pen-test-rfp-2026.md), engagement window 2026-06-30 to 2026-07-11). Our latest master audit (2026-05-25) scores Partnership-Grade at 8.8/10 (certifiable) and Enterprise-Grade at 7.6/10 (pending external pen-test and SOC 2 attestation).
>
> Please confirm:
>
> 1. Availability for a kickoff scoping meeting in the week of 2026-06-23.
> 2. Estimated effort + cost for Type 1 against the scope above.
> 3. Lead auditor's relevant experience with AI/LLM systems and African fintech.
>
> Best,
> Security Lead, GTCX

## Engagement Timeline

| Milestone                       | Target                                 |
| ------------------------------- | -------------------------------------- |
| Outreach sent                   | 2026-05-29                             |
| Bids received                   | 2026-06-19                             |
| Auditor selected                | 2026-06-23                             |
| Kickoff + scoping               | 2026-07-01                             |
| Evidence collection             | 2026-07-01 — 2026-08-15                |
| Type 1 audit window             | 2026-08-15 (point-in-time observation) |
| Draft report                    | 2026-09-01                             |
| Final report                    | 2026-09-15                             |
| Type 2 observation window opens | 2026-09-16 (12 months)                 |

---

**Status:** Awaiting leadership send (in parallel with pen-test RFP). Both engagements are required to clear S2→S3 stage gate.
