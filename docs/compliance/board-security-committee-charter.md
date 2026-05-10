# Board Security Committee Charter

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Approved By:** Board of Directors

## 1. Purpose

The Board Security Committee ("the Committee") provides governance and oversight of GTCX's information security program, ensuring that security risks are identified, assessed, and managed in alignment with the organization's risk appetite and strategic objectives.

## 2. Composition

| Seat    | Role                      | Requirements                                                           |
| ------- | ------------------------- | ---------------------------------------------------------------------- |
| Chair   | Independent Director      | Independent of management; cybersecurity or risk management experience |
| Member  | CEO                       | Standing member                                                        |
| Member  | CISO                      | Standing member; primary reporting officer                             |
| Advisor | External Security Advisor | Independent security expert; engaged annually; no voting rights        |

**Appointment:** Members are appointed by the Board of Directors. The Chair must be independent of GTCX management. The External Advisor is selected through a competitive process and rotated every 3 years to maintain independence.

**Term:** Members serve for the duration of their role at GTCX. The Chair is appointed for a 2-year renewable term.

## 3. Meeting Frequency

- **Quarterly meetings:** Minimum four scheduled meetings per year, aligned with the risk register quarterly review cycle.
- **Emergency sessions:** Convened within 24 hours upon: SEV-1 security incident, material data breach, regulatory enforcement action, or any event the Chair or CISO deems requiring immediate Committee attention.
- **Annual strategy session:** Extended session (half-day) to review and approve the annual security strategy, budget, and risk appetite.

## 4. Quorum and Voting

- **Quorum:** Chair plus one additional member (minimum 2 of 3 voting members).
- **Voting:** Decisions by simple majority of voting members present. The External Advisor participates in discussion but does not vote.
- **Conflicts of interest:** Members with a conflict on a specific matter must declare it and recuse themselves from the relevant vote.

## 5. Standing Agenda

Each quarterly meeting covers the following items:

1. **Minutes and actions.** Approval of prior meeting minutes; status of open action items.
2. **Risk register review.** Updated risk scores, new risks, treatment progress, risk appetite adherence. Presented by CISO.
3. **Incident summary.** All security incidents since last meeting: count by severity, root causes, remediation status, lessons learned. Presented by CISO.
4. **Compliance status.** Audit findings (internal and external), regulatory changes, certification status (SOC 2, ISO 27001), open non-conformities. Presented by CISO.
5. **Security metrics dashboard.** Key indicators: mean time to detect/respond, vulnerability remediation SLA adherence, training completion rate, access review completion rate.
6. **Budget review.** Security spend vs. budget, upcoming expenditures, ROI on key investments. Presented by CISO.
7. **Threat landscape.** Relevant external threats, industry incidents, intelligence briefing. Presented by CISO or External Advisor.
8. **Strategic items.** New initiatives, policy approvals, vendor decisions requiring Committee authority.

## 6. Authority

The Committee has authority to:

- **Approve** the annual information security budget and material unplanned expenditures.
- **Approve** the organizational risk appetite statement and any changes thereto.
- **Approve** the information security strategy and annual objectives.
- **Approve** all policies in the security policies library (`docs/compliance/policies/`).
- **Direct** the CISO to investigate specific risks, incidents, or concerns.
- **Recommend** to the Board: changes to organizational structure affecting security, engagement of external auditors or assessors, and material security investments.
- **Request** access to any GTCX system, report, or personnel necessary for its oversight function.

The Committee does not have authority to make operational decisions (e.g., deploy patches, revoke access) — those remain with the CISO and operational teams.

## 7. CISO Quarterly Report Template

The CISO prepares a written report for each quarterly meeting covering:

1. **Executive summary.** One-paragraph security posture assessment (improving / stable / degrading) with supporting rationale.
2. **Risk register changes.** New risks added, risks re-scored, risks resolved since last report.
3. **Incident report.** Incident count by severity, notable incidents with root cause and remediation, trends.
4. **Compliance status.** Audit status, certification renewals, regulatory changes, open findings with ETA.
5. **Metrics.** Security KPIs with trend (improving / stable / degrading):
   - Mean time to detect (MTTD)
   - Mean time to respond (MTTR)
   - Vulnerability remediation SLA adherence (%)
   - Security training completion (%)
   - Access review completion (%)
   - Open exceptions count and age
6. **Budget.** Spend to date vs. plan, forecast to year-end, material variances.
7. **Recommendations.** Actions requiring Committee decision or awareness.

The report is distributed to Committee members 5 business days before the meeting.

## 8. Reporting

- The Committee Chair reports to the full Board of Directors after each meeting.
- Meeting minutes are maintained by the CISO and stored in the compliance documentation repository.
- The Committee produces an annual summary report for the Board covering: security posture trend, material incidents, audit outcomes, budget utilization, and strategic priorities for the coming year.

## 9. Review

This charter is reviewed annually by the Board of Directors. Amendments require Board approval.
