---
id: sibling-integrator
type: primary
---

# Sibling repo integrator

| Field                | Value                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **id**               | `sibling-integrator`                                                                                                   |
| **name**             | Product repo engineer (integrator)                                                                                     |
| **type**             | primary                                                                                                                |
| **institutionalMap** | [developer](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/institutional/personas/developer.md) |

## Context

Engineer in `compliance-os`, `gtcx-markets`, `terminal-os`, or `gtcx-intelligence` who needs staging ingress, secrets, GHCR pull, or WAF paths — without owning the AWS control plane. Files inbound handoffs (`to-gtcx-infrastructure-*`) and consumes outbound seals.

## Goals

- Get staging URLs, secrets sync, and health witnesses without learning full Terraform
- Know when infra work is **done** vs **blocked on Class S** (parallel, not repo frozen)
- Run product-side checks (`w2:staging-prereq-check`) after infra seal

## Pain points

| Pain                                                                           | Tag                            |
| ------------------------------------------------------------------------------ | ------------------------------ |
| Unclear handoff boundary — product PM owns features, infra owns stack apply    | `validated` (P41/P42 split)    |
| imagePullSecrets / ESO bootstrap failures block entire pilot                   | `validated` (DAAS F2 friction) |
| External hostname 525 while service is healthy in-cluster — confusing go/no-go | `inferred-from-audit`          |

## Success signals

- Inbound ticket acked within one sprint; `from-gtcx-infrastructure-*` seal links evidence JSON
- Product repo staging prereq check passes after seal
- DaaS card for their repo lists current action matrix row

## Anti-personas

- **Infra terraform author** — integrators consume handoffs; they do not apply `module.waf` by default
- **Legal signatory** — sovereign gates stay Class S in `pm/sovereign-approval-register.json`
