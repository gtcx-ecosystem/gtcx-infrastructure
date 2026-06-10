---
title: Execution roadmap — Security-as-a-Service
status: current
date: 2026-06-10
last_reconciled: 2026-06-10T08:11:42.781Z
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-SECAS
generated: true
generated_by: platform/scripts/generate-secas-execution-roadmap.mjs
sources:
  - pm/secas-roadmap.json
  - pm/security-friction-register.json
  - pm/secas-stories.json
  - pm/sovereign-approval-register.json
  - audit/evidence/secas-friction-check-latest.json
  - audit/evidence/secas-approval-check-latest.json
---

# gtcx-infrastructure SECaaS execution roadmap

> **Generated file.** Edit `pm/secas-stories.json`, `pm/security-friction-register.json`, or
> `pm/secas-roadmap.json`, then run `pnpm generate:secas-roadmap`.

**Co-primary program:** Security-as-a-Service (SECaaS) — parallel to DaaS, not product PM.

## Active Phase: SECAS-S2 — Pen-test execution post EXT-INF-002 approval

**Status:** `in_progress`

| Story       | Title                                | Priority | Status      | Owner               |
| ----------- | ------------------------------------ | -------- | ----------- | ------------------- |
| SECAS-S2-01 | Live-stack pen-test execution window | P0       | in_progress | gtcx-infrastructure |

### SECAS-S2-01: Live-stack pen-test execution window

**Files:** audit/pen-test-intake-evidence-2026-05-31.md, audit/evidence/ext-inf-002-sow-approval-2026-06-10.json, docs/operations/coordination/from-gtcx-infrastructure-ext-inf-002-sow-approved-2026-06-10.md

**Acceptance**

```bash
pnpm secas:friction:check:write
pnpm secas:approval:check:write
```

**UAT / QA**

- [x] Vendor SOW countersign received (2026-06-10 — audit/evidence/ext-inf-002-countersign-approval-2026-06-10.json)
- [ ] Pen-test window scheduled and witnessed
- [ ] Report ingested to audit/evidence/

**Blockers:** none

## Class S — Approval needed (parallel, blocksIR false)

| ID          | Status   | Title                           |
| ----------- | -------- | ------------------------------- |
| EXT-INF-002 | approved | Live-stack pen-test vendor SOW  |
| BL-SOC2-01  | approved | SOC 2 Type I auditor engagement |

## Future Phases

| Sprint   | Goal                                       | Status   | Owner               | Stories / Friction |
| -------- | ------------------------------------------ | -------- | ------------------- | ------------------ |
| SECAS-S1 | Sovereign register + security friction SoR | complete | gtcx-infrastructure |                    |
| SECAS-S3 | Fleet IRSA + WAF hardening cards           | complete | gtcx-infrastructure |                    |

## Issue Reconciliation

| Issue                        | Source                               | Roadmap Mapping | Status      |
| ---------------------------- | ------------------------------------ | --------------- | ----------- |
| `SEC-PENTEST-01`             | `pm/security-friction-register.json` | SECAS-S2-01     | in_progress |
| `SEC-WAF-01`                 | `pm/security-friction-register.json` | —               | done        |
| `SEC-IRSA-01`                | `pm/security-friction-register.json` | SECAS-S3-01     | done        |
| P42 hub protocol publication | `pm/_tasks`                          | gtcx-docs       | done        |

## Unblock Order

_No open security friction items — program clear for current sprint._
