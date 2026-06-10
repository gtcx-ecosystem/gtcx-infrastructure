---
title: PRD — SECaaS stack security
status: current
date: 2026-06-10
initiative: INIT-GTCX-INFRA-SECAS
protocol: P42-SECURITY-AS-A-SERVICE
uxRefs:
  personas: [security-operator, compliance-buyer]
  jtbd: [JTBD-security-evidence-path]
  flows: [flow-secas-pentest-evidence]
  exrs: [EXR-003]
---

# PRD — SECaaS stack security

## Problem

Stack security (WAF, IRSA, pen-test execution) must not be owned by product PM nor block engineering readiness.

## Solution

SECaaS program with sovereign register (Class S) + security friction register (Class R/A), `blocksIR: false`.

## Success criteria

From JTBD-security-evidence-path acceptanceCriteria:

- Approval and friction witnesses accurate
- Class S evidence + seals
- Pen-test prep before completion claims

## Non-goals

- Agent signing vendor SOW or auditor MSA
- App-level security controls (sibling repos)

## Links

- `pm/secas-roadmap.json`
- `docs/operations/security-as-a-service.md`
- `pm/ux/stakeholders/stakeholder-map.md`
