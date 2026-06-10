---
id: security-operator
type: secondary
---

# Security operator

| Field                | Value                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **id**               | `security-operator`                                                                                                                    |
| **name**             | Stack security operator (SECaaS)                                                                                                       |
| **type**             | secondary                                                                                                                              |
| **institutionalMap** | [security-engineer](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/institutional/personas/security-engineer.md) |

## Context

Agent or human security lead executing **SECaaS** in gtcx-infrastructure: WAF apply, IRSA review, pen-test window prep, sovereign register hygiene. Prepares Class S intake; never substitutes human signature on SOW or auditor MSA.

## Goals

- Maintain `security-friction-register.json` with executable Class R/A items after sovereign approval
- Publish pen-test and SOC 2 evidence paths auditors can trace
- Keep `blocksIR: false` — engineering gates continue during assurance parallel track

## Pain points

| Pain                                                             | Tag                            |
| ---------------------------------------------------------------- | ------------------------------ |
| Conflating sovereign approval with vendor countersign completion | `validated` (EXT-INF-002 flow) |
| Pen-test claimed complete before vendor report ingested          | `hypothesis`                   |
| IRSA drift between Terraform and live cluster                    | `validated` (SECAS-S3 closed)  |

## Success signals

- `pnpm secas:friction:check:write` — open P0 only when truly blocked
- `pnpm secas:approval:check:write` — approval-needed count accurate
- Evidence under `audit/evidence/` linked from coordination seals

## Anti-personas

- **Product app security author** — app controls stay in product `09-security/`
- **Regulator** — auditors are stakeholders; they do not run `terraform apply`
