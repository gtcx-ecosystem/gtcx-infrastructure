---
title: 'External Finding Register Template'
status: 'ready'
date: '2026-05-27'
owner: 'security-lead'
tier: 'critical'
tags: ['audit', 'soc2', 'pen-test', 'external-assurance', 'findings']
review_cycle: 'weekly'
source_audit: '01-docs/05-audit/external-assurance-kickoff-2026-05-27.md'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# External Finding Register Template

Use this register for SOC 2, penetration-test, auditor-question, DAST, and vendor-retest findings that need formal closure evidence.

## Required States

| Status             | Meaning                                              | Exit Requirement                                      |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| `new`              | Report received, not yet validated.                  | Owner assigned and duplicate/false-positive checked.  |
| `triaged`          | Severity, owner, and SLA confirmed.                  | Remediation path and due date recorded.               |
| `in-progress`      | Fix or mitigation is being implemented.              | Pull request, config change, or evidence action open. |
| `ready-for-retest` | Internal validation passed and vendor retest needed. | Closure checklist completed except vendor retest.     |
| `closed`           | Closure evidence is complete.                        | Retest/signoff recorded.                              |
| `accepted-risk`    | Leadership accepts residual risk.                    | Risk acceptance record and review date recorded.      |

## SLA Defaults

| Severity        | SLA                 | Required Escalation                                         |
| --------------- | ------------------- | ----------------------------------------------------------- |
| `critical`      | 24 hours            | Security Lead, Platform Lead, executive owner.              |
| `high`          | 72 hours            | Security Lead and accountable domain owner.                 |
| `medium`        | 14 calendar days    | Domain owner and sprint lead.                               |
| `low`           | Next planned sprint | Domain owner.                                               |
| `informational` | Backlog review      | Domain owner decides closure, acceptance, or documentation. |

## Register

| Finding ID   | Source | Severity | Title               | Owner         | Status | SLA Due    | Environment | Linked PR/Evidence | Retest Status | Closure Checklist |
| ------------ | ------ | -------- | ------------------- | ------------- | ------ | ---------- | ----------- | ------------------ | ------------- | ----------------- |
| EXT-YYYY-NNN | soc2   | medium   | Short finding title | Security Lead | new    | YYYY-MM-DD | staging     | TBD                | not-started   | TBD               |

## Entry Requirements

Every finding must include:

- A stable `EXT-YYYY-NNN` identifier.
- Source: `soc2`, `pen-test`, `auditor-question`, `vendor-retest`, `dast`, `sca`, or `internal-audit`.
- Severity and rationale, including CVSS where applicable.
- One accountable owner from the external assurance owner matrix.
- A due date derived from the SLA table.
- A link to the affected system, control, file, route, or environment.
- A planned closure checklist link before moving to `in-progress`.

## Closure Requirements

A finding can move to `closed` only when the paired closure checklist records:

- Code, config, infrastructure, or policy diff.
- Relevant test, scan, or validation output.
- Reviewer signoff by a qualified reviewer.
- Vendor retest result when the finding came from an external vendor.
- Residual risk decision when complete remediation is not possible.
