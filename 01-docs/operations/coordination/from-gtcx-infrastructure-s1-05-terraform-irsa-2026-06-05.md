---
title: 'Witness — S1-05 Terraform IRSA drift captured'
status: verified
date: 2026-06-05
owner: gtcx-infrastructure
work_id: S1-05 / INF-86 / XR-405
---

# Witness: S1-05 Terraform IRSA drift capture

## What was done

```bash
cd 04-ship/terraform/environments/staging

# 1. Added irsa_platform module to main.tf
# 2. Fixed irsa-platform module KMS policy bug (split statements)
# 3. Imported existing role and policy into Terraform state

terraform init
terraform import module.irsa_platform.aws_iam_role.platforms gtcx-staging-platforms-irsa
terraform import 'module.irsa_platform.aws_iam_role_policy.platforms_kms[0]' gtcx-staging-platforms-irsa:gtcx-staging-platforms-kms-sign

# 4. Applied tag alignment
terraform apply -target=module.irsa_platform -auto-approve

# 5. Verified 0 changes
terraform plan -target=module.irsa_platform
# → "no differences, so no changes are needed"
```

## Role details

| Attribute  | Value                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| Role name  | `gtcx-staging-platforms-irsa`                                                        |
| ARN        | `arn:aws:iam::348389439381:role/gtcx-staging-platforms-irsa`                         |
| Trust      | OIDC `88225752107BD8162969D30455B2C3D7` + SA `gtcx-staging:gtcx-platform-staging`    |
| KMS policy | `kms:Sign` (with `ECDSA_SHA_256` condition) + `kms:GetPublicKey` + `kms:DescribeKey` |
| Key        | `arn:aws:kms:af-south-1:348389439381:key/d44106a0-cb37-4225-b84d-bb8105eaaca5`       |

## Module bug fixed

The `irsa-platform` module originally created a **single** KMS policy statement with all three actions plus the `kms:SigningAlgorithm` condition. This caused `AccessDenied` on `GetPublicKey` because that action does not accept the `kms:SigningAlgorithm` condition key.

**Fixed:** Split into two statements:

- `AllowKmsSign`: `kms:Sign` + `ECDSA_SHA_256` condition
- `AllowKmsGetPublicKeyAndDescribe`: `kms:GetPublicKey` + `kms:DescribeKey` (no condition)

This matches the working AWS CLI-created policy and the pattern documented in `01-docs/09-security/key-ceremony-runbook.md` §KMS policy condition pitfall.

## Pre-existing issue noted

The staging `main.tf` has a **separate, pre-existing bug** in `module.route53`:

```
Error: Unsupported attribute
  on ../../modules/route53/main.tf line 93, in resource "aws_route53_record" "acm_validation":
  93:   type    = each.value.type
```

This blocks `terraform plan` on the full configuration. It is **not related to S1-05** and should be tracked separately.

## Acceptance

- [x] `module.irsa_platform` in staging `main.tf`
- [x] `terraform plan -target=module.irsa_platform` shows 0 changes
- [x] Role imported into Terraform state
- [x] KMS policy imported into Terraform state
- [x] Tags aligned with Terraform standard
- [ ] Full `terraform plan` (all modules) — **blocked by route53 bug**
