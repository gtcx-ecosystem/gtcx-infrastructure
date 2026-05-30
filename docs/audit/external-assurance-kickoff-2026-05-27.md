---
title: 'External Assurance Kickoff Pack'
status: 'ready'
date: '2026-05-27'
owner: 'security-lead'
tier: 'critical'
tags: ['audit', 'soc2', 'pen-test', 'external-assurance']
review_cycle: 'weekly'
source_audit: 'docs/audit/master-audit-2026-05-27.md'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# External Assurance Kickoff Pack - 2026-05-27

## Purpose

This document converts the SOC 2 and penetration-test roadmap into an executable kickoff pack. It does not claim that external assurance has been completed. It records that the repo-side materials, scope, owner matrix, evidence inventory, and finding workflow are ready for vendor execution.

## Current Status

| Track                      | Status                         | Evidence                                                                                               |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| SOC 2 Type 1 scope         | Ready                          | [`soc2-engagement-2026.md`](./soc2-engagement-2026.md)                                                 |
| SOC 2 evidence inventory   | Ready                          | [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md) |
| Pen-test RFP               | Ready                          | [`pen-test-rfp-2026.md`](./pen-test-rfp-2026.md)                                                       |
| Pen-test scope             | Ready                          | [`pen-test-scope-2026.md`](./pen-test-scope-2026.md)                                                   |
| Vendor shortlist           | Ready                          | [`pen-test-vendor-shortlist.md`](./pen-test-vendor-shortlist.md)                                       |
| WORM runtime proof         | Ready for auditor review       | [`worm-runtime-evidence-2026-05-27.md`](./worm-runtime-evidence-2026-05-27.md)                         |
| Finding register template  | Ready                          | [`external-finding-register-template.md`](./external-finding-register-template.md)                     |
| Finding closure checklist  | Ready                          | [`external-finding-closure-checklist.md`](./external-finding-closure-checklist.md)                     |
| Signed external engagement | Pending vendor/legal execution | Requires selected auditor and pen-test vendor.                                                         |
| External finding retest    | Pending findings               | Starts after vendor reports first confirmed finding.                                                   |

## Control Owner Matrix

| Domain                              | Primary Owner         | Backup Owner        | Evidence Source                                                                               |
| ----------------------------------- | --------------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| Identity, auth, rate limits         | Security Lead         | Platform Lead       | `tools/compliance-gateway/src/auth.mjs`, `tools/compliance-gateway/src/budget.mjs`            |
| WORM audit chain                    | Compliance Platform   | Security Lead       | `tools/audit-signer/`, `tools/audit-flush/`, `docs/audit/worm-runtime-evidence-2026-05-27.md` |
| Kubernetes deployability            | Infrastructure Lead   | Platform Lead       | `infra/kubernetes/`, `.github/workflows/ci.yml`                                               |
| Terraform and AWS controls          | Infrastructure Lead   | SRE                 | `infra/terraform/`                                                                            |
| DR and recovery                     | SRE                   | Infrastructure Lead | `infra/scripts/dr-test.sh`, `.github/workflows/dr-test.yml`                                   |
| Documentation governance            | Quality Evidence Lead | Security Lead       | `tools/scripts/docs-standard-validator.mjs`, `tools/scripts/docs-link-checker.mjs`            |
| External comms and evidence handoff | Security Lead         | Compliance Lead     | `docs/audit/`, `docs/compliance/`                                                             |

## Pen-Test Rules Of Engagement Baseline

| Item               | Decision                                                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target environment | Dedicated `pen-test` namespace or equivalent isolated testnet environment.                                                                                             |
| Production data    | Out of scope. No production PII.                                                                                                                                       |
| WORM pollution     | Do not write test findings into production WORM paths. Use isolated test subjects/buckets.                                                                             |
| Allowed tests      | OWASP API Top 10, auth bypass, tenant isolation, audit-chain tampering, resource exhaustion, mesh/network policy review, container hardening, prompt/tool segregation. |
| Prohibited tests   | Staff social engineering, production account compromise attempts, destructive AWS account actions, third-party LLM provider attacks outside agreed rules.              |
| Stop condition     | Any plausible P0 or data exposure stops active exploitation and triggers immediate triage.                                                                             |

## External Finding Workflow

| Field                      | Required Values                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------- |
| Finding ID                 | `EXT-YYYY-NNN`                                                                      |
| Source                     | `soc2`, `pen-test`, `auditor-question`, `vendor-retest`                             |
| Severity                   | `critical`, `high`, `medium`, `low`, `informational`                                |
| Owner                      | Named accountable owner from the matrix above.                                      |
| SLA                        | Critical 24h, high 72h, medium 14d, low next planned sprint.                        |
| Evidence required to close | Code/config diff, test output, reviewer signoff, and retest result when applicable. |
| Status                     | `new`, `triaged`, `in-progress`, `ready-for-retest`, `closed`, `accepted-risk`      |
| Register template          | [`external-finding-register-template.md`](./external-finding-register-template.md)  |
| Closure checklist          | [`external-finding-closure-checklist.md`](./external-finding-closure-checklist.md)  |

## Initial Finding Register

| Finding ID   | Source       | Severity | Title                                                                           | Owner               | Status      | SLA             |
| ------------ | ------------ | -------- | ------------------------------------------------------------------------------- | ------------------- | ----------- | --------------- |
| EXT-2026-001 | master-audit | high     | Testnet-pilot WORM bucket not deployed in AWS account                           | Infrastructure Lead | triaged     | 14d             |
| EXT-2026-002 | master-audit | medium   | Staging `/health` returns ALB 403 without captured authenticated smoke evidence | SRE                 | triaged     | 14d             |
| EXT-2026-003 | master-audit | medium   | External SOC 2 and pen-test signatures pending                                  | Security Lead       | in-progress | vendor timeline |

## Auditor Reading Order

1. [`master-audit-2026-05-27.md`](./master-audit-2026-05-27.md)
2. [`master-audit-summary-2026-05-27.md`](./master-audit-summary-2026-05-27.md)
3. [`10-10-remediation-plan-2026-05-27.md`](./10-10-remediation-plan-2026-05-27.md)
4. [`worm-runtime-evidence-2026-05-27.md`](./worm-runtime-evidence-2026-05-27.md)
5. [`../compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md)
6. [`pen-test-rfp-2026.md`](./pen-test-rfp-2026.md)
7. [`external-finding-register-template.md`](./external-finding-register-template.md)
8. [`external-finding-closure-checklist.md`](./external-finding-closure-checklist.md)
9. Fresh re-audit report after remediation.

## Re-Audit Impact

Repo-controlled assurance readiness is now complete. Independent assurance remains an external dependency and should be scored as underway/readiness complete, not as completed SOC 2 or completed third-party penetration test.
