---
title: 'External Finding Closure Checklist'
status: 'ready'
date: '2026-05-27'
owner: 'security-lead'
tier: 'critical'
tags: ['audit', 'soc2', 'pen-test', 'external-assurance', 'findings']
review_cycle: 'weekly'
source_audit: 'docs/audit/external-assurance-kickoff-2026-05-27.md'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# External Finding Closure Checklist

Copy this checklist for each external SOC 2, penetration-test, or auditor finding before moving the finding to `ready-for-retest` or `closed`.

## Finding Metadata

| Field          | Value                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Finding ID     | EXT-YYYY-NNN                                                                     |
| Source         | soc2 / pen-test / auditor-question / vendor-retest / dast / sca / internal-audit |
| Severity       | critical / high / medium / low / informational                                   |
| Owner          | TBD                                                                              |
| SLA Due        | YYYY-MM-DD                                                                       |
| Affected Scope | Route, service, control, environment, or infrastructure component                |
| Current Status | new / triaged / in-progress / ready-for-retest / closed / accepted-risk          |

## Remediation Evidence

| Requirement                                               | Status  | Evidence |
| --------------------------------------------------------- | ------- | -------- |
| Root cause recorded                                       | Pending | TBD      |
| Code/config/infrastructure diff linked                    | Pending | TBD      |
| Tests or scans added/updated                              | Pending | TBD      |
| Relevant validation command output captured               | Pending | TBD      |
| Docs/runbook/control mapping updated if needed            | Pending | TBD      |
| Reviewer signoff recorded                                 | Pending | TBD      |
| Vendor retest requested when applicable                   | Pending | TBD      |
| Vendor retest result attached when applicable             | Pending | TBD      |
| Residual risk acceptance recorded if not fully remediated | Pending | TBD      |

## Required Validation By Severity

| Severity      | Minimum Validation                                                                                              |
| ------------- | --------------------------------------------------------------------------------------------------------------- |
| critical      | Focused regression test, full relevant gate suite, security lead review, vendor retest, executive closure note. |
| high          | Focused regression test, relevant gate suite, security lead review, vendor retest.                              |
| medium        | Focused regression test or scan, domain owner review, retest when vendor-originated.                            |
| low           | Evidence of fix or accepted backlog decision, domain owner review.                                              |
| informational | Documentation update, accepted-risk note, or backlog disposition.                                               |

## Closure Decision

| Decision Field   | Value                             |
| ---------------- | --------------------------------- |
| Closure Decision | closed / accepted-risk / deferred |
| Decision Date    | YYYY-MM-DD                        |
| Approved By      | TBD                               |
| Retest Reference | TBD                               |
| Next Review Date | YYYY-MM-DD or N/A                 |

## Closure Notes

Record the final evidence summary here. Include exact command names, artifact paths, PR numbers, reviewer names, and retest references.
