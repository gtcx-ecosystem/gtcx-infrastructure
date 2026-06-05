---
title: 'Bank-grade — index'
status: current
date: 2026-06-07
owner: gtcx-infrastructure
role: quality-evidence-lead
audit_lane: bank-grade
composite: 8.3
tier: critical
tags: ['audit', 'bank-grade', 'composite', 'index']
review_cycle: quarterly
---

# Bank-grade — index

**Lane 4 of 5** — buyer-lens composite for `gtcx-infrastructure`.

**Primary command:** `bank-grade-audit` → `01-docs/05-audit/bank-grade-audit-<date>.md` (legacy alias: `master-audit`)  
**Scoring:** [bank-grade-scoring.md](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/03-platform/tools/audit/lane-scoring/bank-grade-scoring.md)

**Certified composite** per `gtcx-docs` SCORING_FRAMEWORK — seven core dimensions + three audience lenses. **Not** a substitute for engineering signoff, internal compliance, or GTM tiers.

---

## Audit quality (1–10)

**Lane 4 forensic artifact quality:** **8.4/10**

## Readiness outcomes

| Metric                       |      Value | Source                                                                  |
| ---------------------------- | ---------: | ----------------------------------------------------------------------- |
| Certified composite          | **8.3/10** | [bank-grade-audit-2026-06-07.md](./bank-grade-audit-2026-06-07.md)      |
| Investor lens                |        7.9 | §Lens table                                                             |
| Enterprise lens              |        7.6 | §Lens table                                                             |
| Sovereign / DFI              |        7.4 | §Lens table                                                             |
| Banking readiness (B.1–B.10) |     yellow | [bank-grade-evidence.json](./prompts/evidence/bank-grade-evidence.json) |

Machine-readable: [latest.json](./latest.json) → `lanes.bankGrade`

---

## Canonical audits

| Audit                                                              | Role                                           |
| ------------------------------------------------------------------ | ---------------------------------------------- |
| [bank-grade-audit-2026-06-07.md](./bank-grade-audit-2026-06-07.md) | **Latest** lane-4 forensic (`/master-audit`)   |
| [master-audit-2026-06-02.md](./master-audit-2026-06-02.md)         | Prior certified **7.1** (legacy master format) |
| [master-audit-2026-05-30.md](./master-audit-2026-05-30.md)         | Superseded cluster                             |
| [gtm-audit-2026-06-05.md](./gtm-audit-2026-06-05.md)               | Lane 5 GTM (GR-T3)                             |
| [bank-grade-rating-framework.md](./bank-grade-rating-framework.md) | Internal vs external dual-rating methodology   |

---

## Delta since 2026-06-02

- M1 Foundation complete — monorepo typecheck/build/lint coverage
- `validate-all` 50/50 (was 38)
- IR-3.4 `gtcx-ctl validate --ci` + IR-4.1 USSD soak in CI
- Composite **7.1 → 8.3** (+1.2); external assurance gaps unchanged
