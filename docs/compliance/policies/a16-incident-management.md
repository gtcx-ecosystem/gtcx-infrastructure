# POL-16: Information Security Incident Management

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.16 — Incident Management
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Ensure a consistent and effective approach to the management of information security incidents, including communication and escalation.

## 2. Scope

All security events and incidents affecting GTCX systems, data, or personnel, regardless of whether they originate internally or from third parties.

## 3. Policy Statement

1. **Reporting.** All personnel must report suspected security events within 1 hour of detection via the designated incident channel. Reports include: what was observed, when, affected systems, and any actions taken. There is no penalty for good-faith reporting of false positives.

2. **Severity classification.** Incidents are classified by severity:
   - **SEV-1 (Critical):** Active data breach, production compromise, or regulatory reporting trigger. Response within 15 minutes.
   - **SEV-2 (High):** Attempted breach, significant vulnerability exploitation, or service degradation. Response within 1 hour.
   - **SEV-3 (Medium):** Policy violation, failed attack, suspicious activity. Response within 4 hours.
   - **SEV-4 (Low):** Informational events, minor policy deviations. Response within 24 hours.

3. **Response.** An Incident Commander is assigned for SEV-1 and SEV-2 incidents. The response process follows: detect, contain, eradicate, recover, document. Evidence is preserved in a chain-of-custody log. External communication (customers, regulators, media) is coordinated through the CISO and legal counsel.

4. **Notification.** Data breaches affecting personal data are reported to the relevant supervisory authority within 72 hours per GDPR/applicable regulations. Affected data subjects are notified without undue delay when the breach poses a high risk to their rights.

5. **Post-incident review.** A blameless post-incident review is conducted within 5 business days of incident closure. The review produces: root cause analysis, timeline, lessons learned, and remediation actions with owners and deadlines. Findings are incorporated into the risk register and training program.

## 4. Responsibilities

| Role               | Responsibility                                     |
| ------------------ | -------------------------------------------------- |
| CISO               | Own incident response process, lead SEV-1 response |
| Incident Commander | Coordinate response, manage communication          |
| Security Engineer  | Execute containment and eradication                |
| Legal              | Advise on notification obligations                 |
| All Personnel      | Report incidents promptly                          |

## 5. Exceptions

None. All security events must be reported and triaged.

## 6. Review

Reviewed annually. Incident response procedures tested via tabletop exercises semi-annually.
