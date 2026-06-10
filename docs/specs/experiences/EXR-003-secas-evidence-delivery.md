---
exrId: EXR-003
title: SECaaS evidence delivery
status: p0
jtbdId: JTBD-security-evidence-path
flowId: flow-secas-pentest-evidence
personaId: security-operator
---

# EXR-003 — SECaaS evidence delivery

## Intent

Maintain honest parallel assurance track: sovereign gates recorded, friction executable, pen-test evidence path documented.

## Acceptance (from JTBD)

- secas approval + friction witnesses accurate
- Class S evidence JSON + seals
- Pen-test prep before completion claims

## UX refs

- Flow: `pm/ux/user-flows/flow-secas-pentest-evidence.md`
- PRD: `pm/product/prds/PRD-secas-stack-security.md`

## Engineering anchors

- `pm/sovereign-approval-register.json`
- `pm/security-friction-register.json`
- `platform/scripts/secas-approval-check.mjs`
- `platform/scripts/secas-friction-check.mjs`
