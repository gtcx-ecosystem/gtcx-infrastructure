---
title: 'Witness — S1-06 production IRSA trust cleanup'
status: verified
date: 2026-06-05
owner: gtcx-infrastructure
work_id: S1-06
---

# Witness: S1-06 production IRSA trust cleanup

## What was done

Removed stale staging ServiceAccount trust from `gtcx-production-platforms-irsa`.

**Before (3 statements):**

1. `system:serviceaccount:gtcx:gtcx-platforms` ✅ production
2. `system:serviceaccount:gtcx:gtcx-platform` ✅ production
3. `system:serviceaccount:gtcx-staging:gtcx-platform-staging` ❌ **stale** — staging SA on production OIDC

**After (2 statements):**

1. `system:serviceaccount:gtcx:gtcx-platforms` ✅ production
2. `system:serviceaccount:gtcx:gtcx-platform` ✅ production

## Why this mattered

The stale trust allowed `system:serviceaccount:gtcx-staging:gtcx-platform-staging` to assume the **production** IRSA role. However, the staging cluster has a **different OIDC provider** (`88225752107BD8162969D30455B2C3D7`) than production (`E7AA87C9290FFFAE1B154462CE2F33E4`).

This meant:

- The staging SA **could not actually assume** the production role (OIDC mismatch)
- The trust policy was **dead code** — impossible to satisfy
- But it represented a **configuration hazard** if someone later added the staging OIDC to the same role

## Command

```bash
aws iam update-assume-role-policy \
  --role-name gtcx-production-platforms-irsa \
  --policy-document file:///tmp/production-irsa-trust.json \
  --region af-south-1
```

## Verification

```bash
aws iam get-role --role-name gtcx-production-platforms-irsa --region af-south-1 | \
  jq '.Role.AssumeRolePolicyDocument | fromjson | .Statement | length'
# → 2 (was 3)
```

## Cross-references

- Staging IRSA role: `gtcx-staging-platforms-irsa` (captured in Terraform via S1-05)
- Production IRSA role: `gtcx-production-platforms-irsa`
- OIDC providers: staging `8822...`, production `E7AA...`
- Sprint roadmap: `gtcx-infrastructure/01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md`
