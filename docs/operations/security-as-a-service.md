---
title: Security-as-a-Service (SECaaS)
status: current
date: 2026-06-10
owner: fabric-os
protocol: P42-SECURITY-AS-A-SERVICE
initiative: INIT-GTCX-INFRA-SECAS
---

# Security-as-a-Service — gtcx-infrastructure co-primary program

**Normative:** `canon-os/.../42-security-as-a-service/protocol.md`  
**Machine spec:** `bridge-os/pm/spec/security-as-a-service.json`  
**Operational friction:** `pm/security-friction-register.json`  
**Class S gates:** `pm/sovereign-approval-register.json`  
**Roadmap SoR:** `pm/secas-roadmap.json`  
**Stories SoR:** `pm/secas-stories.json`  
**Execution roadmap:** `audit/product-management/secas-execution-roadmap.md`  
**Task inbox:** `pm/_tasks` — `INIT-GTCX-INFRA-SECAS`

## Obligation

Stack security operations (WAF, IRSA, network policy, pen-test **execution**, security evidence) are a **separate concern** from product engineering — parallel to **DaaS** (P41) and **assurance normative** (protocols/core).

Product PM does **not** own pen-test scheduling, WAF apply, or sovereign SOW signature.

## Two registers (do not conflate)

| Register                           | Authority     | Agent behavior                                       |
| ---------------------------------- | ------------- | ---------------------------------------------------- |
| `sovereign-approval-register.json` | **Class S**   | **Approval needed** — prepare intake, never sign SOW |
| `security-friction-register.json`  | **Class R/A** | Execute in-session after sovereign approval          |

**`blocksIR: false`** for both — engineering and IR continue.

## EXT-INF-002 example

| Step                                | Owner               | Class                                  |
| ----------------------------------- | ------------------- | -------------------------------------- |
| Intake pack (RFP, scope, shortlist) | gtcx-infrastructure | R                                      |
| Sovereign SOW approval              | Human / Security    | **S** — recorded `approved` 2026-06-10 |
| Vendor countersign + kickoff        | Human / Procurement | S                                      |
| Pen-test window + evidence          | gtcx-infrastructure | A/R — `SEC-PENTEST-01`                 |

Witness: `audit/evidence/ext-inf-002-sow-approval-2026-06-10.json`

## Product interface

1. App security controls stay in product `09-security/`
2. Stack security handoff → `to-fabric-os-{topic}-YYYY-MM-DD.md`
3. Re-probe when `from-fabric-os-*` security seal **delivered**

## Four-plane model

| Plane           | Owner                      | Product engineering                                   |
| --------------- | -------------------------- | ----------------------------------------------------- |
| **Engineering** | Product repo               | Features, tests, app security controls                |
| **DaaS**        | gtcx-infrastructure        | Deploy handoff only (P41)                             |
| **SECaaS**      | **gtcx-infrastructure**    | Stack security handoff — WAF, IRSA, pen-test window   |
| **Assurance**   | gtcx-core + gtcx-protocols | Normative only — witness parallel (`blocksIR: false`) |

## Infra interface

1. Triage security inbound → `pm/security-friction-register.json`
2. Class S gates → `pm/sovereign-approval-register.json` (witness only)
3. Execute on `pm/secas-roadmap.json` sprints (SECAS-S\*)
4. Seal with `from-fabric-os-*` + `audit/evidence/secas-*-latest.json`

```bash
pnpm agent:next-work              # P22 — infra programs (DaaS + SECaaS)
pnpm generate:secas-roadmap       # refresh SECaaS execution roadmap
pnpm secas:friction:check
pnpm secas:approval:check
pnpm secas:cards:check
```

## Cross-repo false blocks (baseline-os M3 pattern)

Repos that label Class S items **blocked** on security/compliance are usually **false blocks** per
[`human-gate-navigation.md`](https://github.com/gtcx-ecosystem/baseline-os/blob/main/docs/operations/human-gate-navigation.md).
Use **Approval needed** — `blocksIR: false` — implement/witness queues continue.

| Approval needed (your list)     | Hub SoR ID     | Repo-local alias         | SECaaS register         | blocksClaims only                  |
| ------------------------------- | -------------- | ------------------------ | ----------------------- | ---------------------------------- |
| H-05 / EXT-INF-002 pen-test SOW | H-05           | baseline-os **BG-10-10** | **approved** 2026-06-10 | `pen-test complete`                |
| BG-10-11 SOC 2 auditor          | BL-SOC2-01     | baseline-os **BG-10-11** | approved 2026-06-10     | `SOC 2 attested`                   |
| BG-10-12 operator witnesses     | BL-OPERATOR-01 | baseline-os **BG-10-12** | _baseline-os owner_     | `non-core engineer baseline proof` |

**ID collision:** gtcx-docs **BG-10-11/12** are M2 Q2/Q3 hygiene gates (automatable, done) — different
stories from baseline-os M3 Class S gates. Resolve by **owner repo**, not ID alone.

Fleet reconciliation spec: `bridge-os/pm/spec/sovereign-gate-reconciliation.json`

## Operator entry

**Approval needed (Class S only):**

- **EXT-INF-002 / H-05 / BG-10-10** — sovereign SOW approved 2026-06-10; next: vendor countersign
- **BL-SOC2-01 / BG-10-11** — SOC 2 Type I auditor engagement
- **BL-OPERATOR-01 / BG-10-12** — named non-core operator workflow (baseline-os register — parallel)

**Next operational (Class R/A):**

- **SEC-PENTEST-01** — schedule live-stack pen-test after vendor ack
