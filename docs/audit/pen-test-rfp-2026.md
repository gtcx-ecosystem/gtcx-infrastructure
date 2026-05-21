---
title: 'Penetration Test RFP — GTCX Compliance Gateway + Substrate'
status: 'draft'
date: '2026-05-22'
owner: 'security-lead'
target_send_date: '2026-05-29'
review_cycle: 'one-shot'
tags: ['security', 'pen-test', 'rfp']
---

# Penetration Test RFP — 2026

## 1. Background

GTCX operates a 23-repository platform powering AI-native compliance for African commodity trade. The compliance-gateway is the front-door service: every consequential AI-mediated decision (KYC, score, attestation, settlement) flows through it, and every decision produces a tamper-evident audit record signed with Ed25519 and anchored in S3 Object Lock (COMPLIANCE mode, 2557-day retention).

This RFP solicits proposals for an external penetration test of the gateway, its surrounding mesh, and the substrate (audit chain, dual-DB pattern, WORM bucket) as deployed in `af-south-1`.

## 2. Engagement Scope

### In-scope assets

- **compliance-gateway** (HTTP API, `tools/compliance-gateway/`): `/v1/query`, `/v1/tools`, `/v1/providers`, `/v1/audit/chain`, `/v1/audit/verify`, `/v1/budget`, `/metrics`, `/health`.
- **audit-flush sidecar** (`infra/kubernetes/base/services/audit-flush.yaml`): JetStream → WORM S3 path.
- **NATS JetStream** broker on `gtcx.audit.*` subjects.
- **Dual PostgreSQL** databases (operational + audit, segregated user, append-only).
- **Vault HA** instance (TLS, KMS unseal, dynamic creds).
- **Kubernetes mesh** (Linkerd, deny-by-default NetworkPolicies, Kyverno admission).
- **CI/CD path**: GitHub Actions, SLSA L3 builds, Cosign keyless signing.

### Test environments

- Dedicated namespace `pen-test` in the testnet EKS cluster.
- Anonymized seed data; no production PII.
- Audit chain isolated to a separate `gtcx.audit.pen-test.*` JetStream subject so findings do not pollute production WORM bucket.

### Out-of-scope (do not test)

- Production AWS account `<redacted>` and its WORM bucket.
- Third-party LLM providers (Anthropic, Google, OpenAI) — out-of-band rules of engagement.
- Social-engineering of GTCX staff (Phase 2 if budget allows).

## 3. Required Test Classes

| #   | Class                        | Notes                                                                                                              |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 1   | **OWASP API Top-10**         | Full coverage required.                                                                                            |
| 2   | **Prompt injection**         | Replay the eval-pipeline injection-suite + novel payloads. Target: bypass the delimited untrusted-context defense. |
| 3   | **Tool-segregation escape**  | Try to invoke mutating tools (TradePass issuance, PvP execution) without a valid approval ticket.                  |
| 4   | **Audit-chain tampering**    | Attempt to forge, replay, or omit records in the JetStream → WORM path.                                            |
| 5   | **Authentication bypass**    | Token replay, JWT forging (if applicable), timing-attack on `constantTimeEquals`.                                  |
| 6   | **Authorization escalation** | Cross-tenant data access (post-Sprint-5), permission escalation via approval header forgery.                       |
| 7   | **Resource exhaustion**      | Per-principal budget bypass, LLM cost amplification, OOM via unbounded chain.                                      |
| 8   | **Container escape**         | securityContext, Kyverno bypass attempts.                                                                          |
| 9   | **Mesh policy bypass**       | NetworkPolicy circumvention, sidecar bypass.                                                                       |
| 10  | **Cryptographic primitives** | Ed25519 implementation review, signature malleability, key handling.                                               |

## 4. Deliverables

- Executive summary (one-page, regulator-ready).
- Technical report with reproducible exploitation steps per finding.
- CVSS v3.1 severity per finding.
- Remediation guidance per finding (not just "fix it" — _how_).
- Re-test of remediated P0/P1 findings within 30 days of GTCX patch delivery.
- All findings filed in the GTCX Linear `SEC` project (we provide access).

## 5. Engagement Timeline

| Milestone                  | Target                                      |
| -------------------------- | ------------------------------------------- |
| RFP sent                   | 2026-05-29                                  |
| Bids received              | 2026-06-12                                  |
| Vendor selected            | 2026-06-16                                  |
| Kickoff + ROE signed       | 2026-06-23                                  |
| Test window                | 2026-06-30 — 2026-07-11 (10 working days)   |
| Draft report               | 2026-07-18                                  |
| Final report               | 2026-07-25                                  |
| Re-test (remediated P0/P1) | 2026-08-15 (subject to GTCX patch velocity) |

## 6. Shortlisted Vendors

See [`pen-test-vendor-shortlist.md`](./pen-test-vendor-shortlist.md). Sending this RFP to:

- SensePost
- Nclose
- Bishop Fox (US fallback)

## 7. Evaluation Criteria

| Criterion                                       | Weight |
| ----------------------------------------------- | ------ |
| AppSec depth in AI/LLM systems                  | 25%    |
| Africa/Global South operational familiarity     | 10%    |
| Cryptography review capability                  | 15%    |
| Reproducible report quality (samples requested) | 15%    |
| Engagement timeline                             | 10%    |
| Price                                           | 15%    |
| References from regulated industries            | 10%    |

## 8. GTCX Pre-Engagement Preparedness

We have run an internal red-team against the gateway using the injection-suite at `tools/eval-pipeline/injection-suite.mjs`. The full pre-engagement evidence ledger is in [`docs/audit/score-evidence-ledger.json`](./score-evidence-ledger.json). We do not consider internal red-teaming a substitute for external pen-test.

## 9. Logistics

- **Point of contact:** security-lead@gtcx
- **Secure channel:** Signal `+27-…-…-…` (provided after NDA)
- **NDA:** GTCX standard mutual NDA, attached to RFP.
- **Insurance:** Vendor must carry minimum $5M professional liability.

## 10. Submission

Email proposals to `security-lead@gtcx` by 23:59 SAST on 2026-06-12. Late submissions reviewed only at GTCX discretion.

---

**Status:** Awaiting leadership send. The pen-test engagement is the single biggest external blocker for stage gate S2→S3 (per `docs/audit/master-audit-2026-05-17.md:135-141`).
