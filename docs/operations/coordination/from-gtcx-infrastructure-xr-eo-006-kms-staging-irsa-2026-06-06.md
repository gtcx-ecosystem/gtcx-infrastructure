---
title: 'Inbound — XR-EO-006 production KMS key allows staging platforms IRSA'
status: current
date: 2026-06-06
owner: gtcx-infrastructure
work_ids: [XR-EO-006, INF-86, XR-405]
document_id: COORD-XR-EO-006-INFRA-001
---

# XR-EO-006 — KMS cross-environment signing (staging → production key)

## Problem

Staging sovereign pods reference `alias/gtcx-production-sovereign-gh-bog` with IRSA role `gtcx-staging-platforms-irsa`. The production KMS module `kms_sovereign_signing` `gh-bog` authority listed only `module.irsa_platform.platforms_role_arn` (production platforms IRSA). `kms:Sign` from staging pods would be **AccessDenied** despite correct IRSA trust on the staging role.

## Fix

| Item        | Detail                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Commit      | `c36a5f6`                                                                                       |
| File        | `infra/terraform/environments/production/main.tf`                                               |
| Data source | `data.aws_iam_role.staging_platforms` → `gtcx-staging-platforms-irsa`                           |
| Policy      | `module.kms_sovereign_signing.authorities.gh-bog.signing_role_arns` = production + staging ARNs |
| Algorithm   | ECC_NIST_P256 / `ECDSA_SHA_256` (HOLD comment → UNBLOCKED)                                      |

## Verification (2026-06-06)

```bash
cd infra/terraform/environments/production && terraform validate  # exit 0
cd infra/terraform/environments/staging && terraform validate     # exit 0
node tools/scripts/validate-all.mjs                               # 46/46 PASS
```

## Apply + live verify (2026-06-06)

| Step       | Command                                                                           | Result                                                                |
| ---------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Apply      | `terraform apply -target=module.kms_sovereign_signing -auto-approve` (production) | exit **0** — 2 resources changed                                      |
| KMS policy | `aws kms get-key-policy` on `d44106a0-…`                                          | `gtcx-staging-platforms-irsa` present in policy                       |
| Health     | `curl sovereign-staging.gtcx.trade/api/health`                                    | **200**                                                               |
| Smoke      | gtcx-platforms `pnpm smoke:signed-edge-tenant:evidence` @ staging                 | exit **0** — `signed-edge-tenant-smoke-2026-06-04T12-08-02-755Z.json` |

## Human remainder (not this ticket)

XR-401 / H-01-B/C/D ceremony governance — Class **S**; tracked in gtcx-protocols.

## Sibling ack

- **gtcx-protocols:** update [`from-gtcx-protocols-xr-eo-006-inf-86-closure-2026-06-05.md`](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/operations/coordination/from-gtcx-protocols-xr-eo-006-inf-86-closure-2026-06-05.md)
- **exploration-os / baseline-os:** evidence JSON `kmsCrossEnv` row
