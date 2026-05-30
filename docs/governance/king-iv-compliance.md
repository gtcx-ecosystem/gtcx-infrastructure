---
title: 'King IV Governance Compliance Mapping'
status: 'current'
date: '2026-05-27'
owner: 'ceo'
role: 'ceo'
tier: 'critical'
tags: ['governance', 'king-iv', 'south-africa', 'compliance', 'government-grade']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# King IV Governance Compliance Mapping

**Document ID:** GTCX-KING4-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Owner:** Chief Executive Officer  
**Framework:** King IV Report on Corporate Governance for South Africa 2016

---

## 1. Purpose

Map GTCX governance practices to the 17 principles of King IV to demonstrate readiness for South African institutional and government contracts.

## 2. Principle Mapping

### Principle 1: Ethical Leadership

| Requirement         | GTCX Implementation                                         | Evidence                                              |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Lead with integrity | Ethics policy published; CEO signature                      | `docs/governance/ethics-policy.md`                    |
| Set ethical tone    | Board Security Committee charter mandates ethical oversight | `docs/compliance/board-security-committee-charter.md` |

### Principle 2: Organizational Ethics

| Requirement     | GTCX Implementation                                            | Evidence                           |
| --------------- | -------------------------------------------------------------- | ---------------------------------- |
| Ethical culture | Whistleblower channel (ethics@gtcx.io); non-retaliation policy | `docs/governance/ethics-policy.md` |
| Code of conduct | Ethics policy + employment contracts                           | HR records                         |

### Principle 3: Responsible Corporate Citizenship

| Requirement   | GTCX Implementation                             | Evidence                                    |
| ------------- | ----------------------------------------------- | ------------------------------------------- |
| Social impact | Offline-first architecture for frontier markets | `docs/architecture/offline-architecture.md` |
| Environmental | Carbon footprint assessment pending             | Target 2026-Q4                              |
| Economic      | Zimbabwe pilot supporting local banks           | `docs/gtm/sandbox-application/`             |

### Principle 4: Strategy and Performance

| Requirement                | GTCX Implementation                     | Evidence                           |
| -------------------------- | --------------------------------------- | ---------------------------------- |
| Sustainable value creation | 3-year security roadmap; quarterly OKRs | Board minutes (pending)            |
| Risk-based strategy        | Master audit cadence; risk register     | `docs/compliance/risk-register.md` |

### Principle 5: Reporting and Stakeholder Communication

| Requirement            | GTCX Implementation                                 | Evidence                                            |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- |
| Transparent reporting  | Quarterly master audit reports published internally | `docs/audit/`                                       |
| Stakeholder engagement | Partner security questionnaire; bug bounty program  | `docs/security/partner-security-self-assessment.md` |

### Principle 6: Primary Role and Responsibilities of the Board

| Requirement       | GTCX Implementation                                         | Evidence                                              |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Board composition | CEO, Independent Director, CISO (pending), External Advisor | `docs/compliance/board-security-committee-charter.md` |
| Board charter     | Board Security Committee charter defines roles              | `docs/compliance/board-security-committee-charter.md` |

### Principle 7: Composition of the Board

| Requirement   | GTCX Implementation                                        | Evidence       |
| ------------- | ---------------------------------------------------------- | -------------- |
| Diversity     | Independent Director required; diversity metrics pending   | Target 2026-Q4 |
| Skills matrix | Security, compliance, engineering, financial skills mapped | Board charter  |

### Principle 8: Committees of the Board

| Requirement      | GTCX Implementation                                   | Evidence                                              |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Board committees | Board Security Committee operational                  | `docs/compliance/board-security-committee-charter.md` |
| Audit committee  | Pending — combined with Security Committee through S3 | Target 2026-Q3                                        |

### Principle 9: Evaluations of the Board's Performance

| Requirement      | GTCX Implementation                                       | Evidence       |
| ---------------- | --------------------------------------------------------- | -------------- |
| Board evaluation | Annual evaluation cycle defined; first evaluation pending | Target 2026-Q4 |

### Principle 10: Appointment and Delegation to Management

| Requirement     | GTCX Implementation                            | Evidence                       |
| --------------- | ---------------------------------------------- | ------------------------------ |
| CEO appointment | Board-approved CEO role                        | Board minutes (pending)        |
| Delegation      | Clear authority matrix in CISO role definition | `docs/governance/ciso-role.md` |

### Principle 11: Governance of Risk

| Requirement     | GTCX Implementation                                      | Evidence                           |
| --------------- | -------------------------------------------------------- | ---------------------------------- |
| Risk governance | Risk register; quarterly master audit; anomaly detection | `docs/compliance/risk-register.md` |
| Risk appetite   | Defined in security strategy (pending board approval)    | Target 2026-Q3                     |

### Principle 12: Technology and Information Governance

| Requirement      | GTCX Implementation                                | Evidence                                        |
| ---------------- | -------------------------------------------------- | ----------------------------------------------- |
| Data governance  | Data classification policy; ROPA; retention policy | `docs/compliance/data-classification-policy.md` |
| Cyber resilience | SLOs, DR runbooks, chaos tests, mTLS mesh          | `docs/operations/slo-definitions.md`            |

### Principle 13: Compliance with Laws and Adopted Codes

| Requirement           | GTCX Implementation                    | Evidence                                                                        |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------- |
| Regulatory compliance | FICA, POPIA, PAIA frameworks published | `docs/compliance/fica-compliance.md`, `popia-registration.md`, `paia-manual.md` |
| Code adoption         | King IV mapping (this document)        | `docs/governance/king-iv-compliance.md`                                         |

### Principle 14: Stakeholder Relationships

| Requirement         | GTCX Implementation                                   | Evidence                                                                   |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- |
| Partner engagement  | Security questionnaire; incident notification SLA     | `docs/security/partner-security-self-assessment.md`                        |
| Customer protection | Data retention; right to erasure; breach notification | `docs/compliance/data-retention-policy.md`, `popia-breach-notification.md` |

### Principle 15: Remuneration

| Requirement       | GTCX Implementation                      | Evidence              |
| ----------------- | ---------------------------------------- | --------------------- |
| Fair remuneration | Market-aligned salary bands; equity plan | HR policies (pending) |

### Principle 16: Assurance

| Requirement           | GTCX Implementation                                               | Evidence                                                     |
| --------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Combined assurance    | Internal audit (quarterly master audit); external audit (pending) | `docs/audit/`                                                |
| Independent assurance | SOC 2 Type I planned; pen-test planned                            | `docs/audit/pen-test-rfp-2026.md`, `soc2-engagement-2026.md` |

### Principle 17: Governance of Ethics

| Requirement        | GTCX Implementation                               | Evidence                           |
| ------------------ | ------------------------------------------------- | ---------------------------------- |
| Ethical governance | Ethics policy; whistleblower protection; training | `docs/governance/ethics-policy.md` |

## 3. Maturity Assessment

| Principle         | Maturity        | Gap                                      |
| ----------------- | --------------- | ---------------------------------------- |
| 1–2, 6, 12–14, 17 | **Established** | Documents published; operational         |
| 3, 5, 10–11       | **Developing**  | Framework defined; some evidence pending |
| 4, 7–9, 15–16     | **Emerging**    | Target definitions; not yet operational  |

## 4. Roadmap to Full King IV Compliance

| Quarter | Deliverable                                                    |
| ------- | -------------------------------------------------------------- |
| 2026-Q3 | Appoint Independent Director + CISO; establish Audit Committee |
| 2026-Q4 | First board evaluation; diversity metrics; carbon footprint    |
| 2027-Q1 | External assurance (SOC 2 Type I); remuneration committee      |
| 2027-Q2 | Combined assurance framework; stakeholder engagement report    |

---

_Last updated: 2026-05-25_
