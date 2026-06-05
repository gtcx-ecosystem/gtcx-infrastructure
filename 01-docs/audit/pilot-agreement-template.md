---
title: 'Pilot Agreement Template — GTCX Platform Evaluation'
status: 'draft'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'testing']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Pilot Agreement Template — GTCX Platform Evaluation

**This is a template. Customize for each pilot engagement.**

---

## 1. Parties

- **Provider**: GTCX (Global Trade & Compliance Exchange)
- **Customer**: [Organization name]
- **Effective Date**: [Date]

## 2. Scope

Provider will make the GTCX platform available to Customer for a controlled evaluation ("Pilot") of trade verification services, specifically:

- **Protocol(s)**: [TradePass / GeoTag / GCI / VaultMark / PvP / PANX]
- **Operator count**: Up to [N] licensed operators
- **Duration**: [30] calendar days from first live verification
- **Environment**: Dedicated infrastructure in [af-south-1 / region]

## 3. Success Criteria

The Pilot will be evaluated against the success criteria document attached as Exhibit A. Both parties agree these criteria define "success" and "failure" for the purpose of this agreement.

Reference: `01-docs/assessments/pilot-success-criteria.md`

## 4. Data Handling

- All Customer operational data will be stored in [af-south-1] and will not leave that region except as documented in the Data Flow Diagram (Exhibit B)
- Provider will process Customer data solely for the purpose of delivering the Pilot services
- Provider will not use Customer data for training AI models
- Third-party data processors: [Anthropic (LLM inference), ComplyAdvantage (AML screening)] — DPAs required before Pilot start
- Audit records are append-only and cannot be modified or deleted by Provider

Reference: `01-docs/09-security/data-flow.md`

## 5. Support

Provider will provide support during the Pilot per the support matrix defined in the Success Criteria document (Exhibit A).

## 6. Fees

[Option A: No fee — design partner engagement]
[Option B: $[X] pilot fee, credited toward production contract if converted]
[Option C: Equity/future-credit arrangement — specify terms]

## 7. Intellectual Property

- Customer retains all rights to Customer data
- Provider retains all rights to the GTCX platform and protocols
- Verification records generated during the Pilot are jointly owned

## 8. Confidentiality

Each party agrees to keep the other party's confidential information private and not disclose it to third parties without prior written consent. This obligation survives termination for [2] years.

## 9. Termination

Either party may terminate the Pilot:

- For convenience: 7 days written notice
- For cause (failure criteria triggered): immediate written notice
- Upon mutual agreement

## 10. Post-Termination Data Handling

Upon termination without conversion to production:

- Provider will delete Customer PII within 30 days
- Provider will provide written confirmation of deletion
- Audit records will be retained in anonymized form for regulatory compliance
- Infrastructure will be fully decommissioned

Upon conversion to production:

- Data transitions to production retention policies
- Separate production agreement supersedes this Pilot agreement

## 11. Limitation of Liability

Provider's total liability under this Pilot agreement shall not exceed the Pilot fee (or $0 if no fee). Provider is not liable for indirect, consequential, or incidental damages.

## 12. Governing Law

This agreement is governed by the laws of [Jurisdiction].

---

## Exhibits

- **Exhibit A**: Pilot Success Criteria (`01-docs/assessments/pilot-success-criteria.md`)
- **Exhibit B**: Data Flow Diagram (`01-docs/09-security/data-flow.md`)

---

## Signatures

| Role            | Name | Date | Signature |
| --------------- | ---- | ---- | --------- |
| Provider (GTCX) |      |      |           |
| Customer        |      |      |           |
