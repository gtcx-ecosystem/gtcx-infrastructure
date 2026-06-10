---
id: compliance-buyer
type: buyer
---

# Compliance buyer (auditor / regulator)

| Field                | Value                                                                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **id**               | `compliance-buyer`                                                                                                                       |
| **name**             | Compliance buyer (auditor / regulator)                                                                                                   |
| **type**             | buyer                                                                                                                                    |
| **institutionalMap** | [compliance-officer](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/institutional/personas/compliance-officer.md) |

## Context

External auditor, regulator liaison, or enterprise procurement security reviewer evaluating whether GTCX staging/production substrate meets assurance claims (pen-test, SOC 2 path, WORM evidence). Consumes **published evidence JSON and seals** — not raw cluster access.

## Goals

- Trace claims to dated evidence artifacts and sovereign approval records
- Verify live-stack pen-test and SOC 2 programs are authorized before attestation language
- See clear separation between engineering readiness (IR) and external assurance (XC)

## Pain points

| Pain                                                                 | Tag                   |
| -------------------------------------------------------------------- | --------------------- |
| Marketing attestation language ahead of vendor report                | `hypothesis`          |
| Scattered evidence across repos without deployment-proof-index links | `inferred-from-audit` |

## Success signals

- `audit/latest.json` leadership decisions list sovereign approvals with evidence paths
- `pm/sovereign-approval-register.json` status matches procurement reality
- Master audit composite score documented with open external assurance burden

## Anti-personas

- **Platform operator** — buyers witness outcomes; they do not execute staging scripts
