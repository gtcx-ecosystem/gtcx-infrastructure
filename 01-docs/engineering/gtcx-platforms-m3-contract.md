---
title: 'GTCX Platforms M3 Cross-Repo Contract'
status: current
date: '2026-05-27'
owner: frontier-infra-engineer
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
tier: 'standard'
tags: ['documentation', 'engineering']
review_cycle: 'on-change'
---

# GTCX Platforms M3 Cross-Repo Contract

> **Status:** Current — Infrastructure deliverables complete. Platforms team unblocked.
> **Date:** 2026-05-12
> **Owner:** frontier-infra-engineer

## Deliverables from Infrastructure (this repo)

| Resource                | ARN / Identifier                                                               | Status     |
| ----------------------- | ------------------------------------------------------------------------------ | ---------- |
| KMS signing key         | `arn:aws:kms:af-south-1:348389439381:key/ffd06311-3c16-4951-9d4b-c4ebc1632e3e` | ✅ Live    |
| KMS alias               | `alias/gtcx-production-signing`                                                | ✅ Live    |
| SSM parameter (key ID)  | `/gtcx/production/kms/signing-key-id`                                          | ✅ Live    |
| SSM parameter (key ARN) | `/gtcx/production/kms/signing-key-arn`                                         | ✅ Live    |
| IRSA role               | `arn:aws:iam::348389439381:role/gtcx-production-platforms-irsa`                | ✅ Live    |
| CloudWatch alarm        | `unexpected-kms-sign-production`                                               | ✅ Live    |
| ServiceAccount manifest | `04-ship/kubernetes/base/service-accounts/gtcx-platforms.yaml`                 | ✅ In repo |

## Required from Platforms Team (`gtcx-platforms`)

1. **Apply ServiceAccount** to production EKS:

   ```bash
   kubectl apply -f 04-ship/kubernetes/base/service-accounts/gtcx-platforms.yaml
   ```

2. **Bind deployment** to the ServiceAccount in pod spec:

   ```yaml
   serviceAccountName: gtcx-platforms
   ```

3. **Implement signing flow** using AWS SDK with IRSA token:
   - Use `kms:Sign` with `ECDSA_SHA_256`
   - Cache public key via `kms:GetPublicKey`
   - Handle `ThrottlingException` with exponential backoff

4. **Coverage threshold** ≥70% statements before M3 sign-off.

## Verification Commands

```bash
# Verify IRSA role trust
aws iam get-role --role-name gtcx-production-platforms-irsa

# Verify KMS key policy
aws kms get-key-policy --key-id ffd06311-3c16-4951-9d4b-c4ebc1632e3e --policy-name default

# Verify SSM parameters
aws ssm get-parameter --name /gtcx/production/kms/signing-key-id
aws ssm get-parameter --name /gtcx/production/kms/signing-key-arn
```

## Contacts

- Infrastructure lead: @amanianai
- Platforms lead: (assign from gtcx-platforms)
