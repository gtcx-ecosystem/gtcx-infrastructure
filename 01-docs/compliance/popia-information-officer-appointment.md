---
title: 'POPIA Information Officer Appointment Record'
status: 'current'
date: '2026-05-27'
owner: 'ceo'
role: 'compliance-lead'
tier: 'critical'
tags: ['compliance', 'popia', 'data-protection', 'information-officer', 'south-africa']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# POPIA Information Officer Appointment Record

**Document ID:** GTCX-POPIA-IO-001  
**Regulator:** Information Regulator of South Africa  
**Appointment Target Date:** 2026-06-30  
**Status:** Open — pending CISO appointment coordination  
**Legal Basis:** POPIA Section 55 (Duty to appoint Information Officer)

---

## 1. Appointment Requirement

Per POPIA Section 55, every responsible party must appoint an Information Officer (IO). The IO is the statutory point of contact for the Information Regulator and holds accountability for POPIA compliance across the organization.

## 2. Appointment Authority

The CEO appoints the Information Officer, who may be the same person as the CISO or a separate role. GTCX intends to appoint the named CISO as Information Officer to unify security and data-protection accountability.

## 3. Information Officer Responsibilities

| Area                     | Responsibility                                       | Evidence Location                                    |
| ------------------------ | ---------------------------------------------------- | ---------------------------------------------------- |
| Registration             | Ensure responsible party registration is current     | `01-docs/10-compliance/popia-registration.md`        |
| PAIA Manual              | Maintain and publish PAIA manual                     | `01-docs/10-compliance/paia-manual.md`               |
| Data-breach notification | Assess and escalate breaches within 72 hours         | `01-docs/10-compliance/popia-breach-notification.md` |
| ROPIA                    | Maintain Record of Processing Activities             | `01-docs/10-compliance/popia-ropa.md`                |
| Data-subject requests    | Receive and route access/deletion/objection requests | `01-docs/10-compliance/popia-registration.md`        |
| Regulatory liaison       | Primary contact for Information Regulator enquiries  | —                                                    |
| Training                 | Ensure POPIA awareness training for all staff        | `01-docs/09-security/security-training-program.md`   |

## 4. Recruitment / Appointment Status

| Stage                                | Status         | Date       | Notes                                       |
| ------------------------------------ | -------------- | ---------- | ------------------------------------------- |
| Responsible party registration filed | ✅ Complete    | 2026-03-15 | IR-REF-2026-0315-GTCX                       |
| Deputy IO appointed                  | ✅ Complete    | 2026-03-15 | Compliance Lead                             |
| PAIA manual published                | ✅ Complete    | 2026-05-25 | `01-docs/10-compliance/paia-manual.md`      |
| CISO recruitment                     | 🔄 In progress | —          | Target 2026-06-30; CISO will dual-hat as IO |
| IO appointment resolution            | ⏳ Pending     | —          | Board resolution required                   |
| Info Regulator notification          | ⏳ Pending     | —          | Within 14 days of appointment               |
| CIPC officer register update         | ⏳ Pending     | —          | Within 30 days of appointment               |

## 5. Deputy Information Officer

**Current appointee:** Compliance Lead  
**Scope:** Day-to-day POPIA operational matters, data-breach triage, data-subject request routing.  
**Escalation:** All regulatory correspondence and enforcement matters escalate to the appointed Information Officer.

## 6. Risk if Delayed

| Delay        | Impact                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| > 2026-07-15 | POPIA enforcement action risk increases; Enterprise-Grade blocked             |
| > 2026-08-01 | Government-Grade pilot blocked (statutory IO required for public-sector data) |
| > 2026-09-01 | Potential Info Regulator enquiry escalation due to delayed notification       |

## 7. Coordination with CISO Appointment

The CISO and IO appointments are **coupled**: GTCX intends to appoint the same individual to both roles. Therefore, the IO appointment timeline tracks the CISO recruitment timeline (`01-docs/governance/ciso-appointment.md`). If CISO appointment slips beyond 2026-07-15, the Board Security Committee will consider appointing the Compliance Lead as interim Information Officer to maintain POPIA compliance.
