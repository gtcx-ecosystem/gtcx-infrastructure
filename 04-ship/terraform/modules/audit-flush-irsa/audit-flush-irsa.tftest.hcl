# =============================================================================
# Audit Flush IRSA Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates the IAM policy is least-privilege: write-only PutObject,
# ListBucket scoped via s3:prefix condition, KMS scoped to the
# bucket CMK only. The prefix condition closes the cross-tenant
# inventory exposure flagged in the 2026-05-30 security audit.
# =============================================================================

variables {
  environment       = "test"
  oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
  oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
  worm_bucket_arn   = "arn:aws:s3:::gtcx-test-worm-audit"
  worm_kms_key_arn  = "arn:aws:kms:af-south-1:123456789012:key/abcd1234-ab12-cd34-ef56-abcdef123456"
}

# -----------------------------------------------------------------------------
# Role assumption is scoped to the audit-flush ServiceAccount only
# -----------------------------------------------------------------------------

run "role_assumption_scoped_to_serviceaccount" {
  command = plan

  assert {
    condition     = aws_iam_role.audit_flush.name == "gtcx-test-audit-flush-irsa"
    error_message = "Role name must follow gtcx-<env>-audit-flush-irsa convention"
  }
}

# -----------------------------------------------------------------------------
# Policy: PutObject is the only write granted; no Delete, no Get
# -----------------------------------------------------------------------------

run "policy_grants_putobject_only_no_delete_no_get" {
  command = plan

  variables {
    environment       = "test"
    oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
    oidc_provider_url = "oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
    worm_bucket_arn   = "arn:aws:s3:::gtcx-test-worm-audit"
    worm_kms_key_arn  = "arn:aws:kms:af-south-1:123456789012:key/abcd1234"
  }

  assert {
    # Policy JSON must contain s3:PutObject and NOT contain DeleteObject/GetObject
    condition = (
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "\"s3:PutObject\"") &&
      !strcontains(aws_iam_role_policy.audit_flush_write.policy, "s3:DeleteObject") &&
      !strcontains(aws_iam_role_policy.audit_flush_write.policy, "s3:GetObject")
    )
    error_message = "Policy must grant PutObject only — no Delete, no Get"
  }
}

# -----------------------------------------------------------------------------
# REGRESSION: ListBucket carries an s3:prefix Condition (cross-tenant guard)
# -----------------------------------------------------------------------------

run "listbucket_has_s3_prefix_condition" {
  command = plan

  assert {
    # The policy JSON must contain a StringLike condition with
    # s3:prefix scoping. Without this, a compromised audit-flush pod
    # could enumerate every tenant's keys in the WORM bucket —
    # exactly the 2026-05-30 audit's MEDIUM finding on this module.
    condition = (
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "\"s3:prefix\"") &&
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "StringLike")
    )
    error_message = "ListBucket must carry an s3:prefix StringLike Condition (cross-tenant guard)"
  }

  assert {
    # Default prefixes scope to tenant=*/* and _quarantine/* per the
    # audit-flush key convention in flush.unit.test.mjs.
    condition = (
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "tenant=*/*") &&
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "_quarantine/*")
    )
    error_message = "Default list_bucket_prefixes must include tenant=*/* and _quarantine/*"
  }
}

# -----------------------------------------------------------------------------
# Custom prefix override is honored
# -----------------------------------------------------------------------------

run "custom_list_bucket_prefixes_override" {
  command = plan

  variables {
    environment          = "test"
    oidc_provider_arn    = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
    oidc_provider_url    = "oidc.eks.af-south-1.amazonaws.com/id/EXAMPLE"
    worm_bucket_arn      = "arn:aws:s3:::gtcx-test-worm-audit"
    worm_kms_key_arn     = "arn:aws:kms:af-south-1:123456789012:key/abcd1234"
    list_bucket_prefixes = ["tenant=zw/*"]
  }

  assert {
    condition     = strcontains(aws_iam_role_policy.audit_flush_write.policy, "tenant=zw/*")
    error_message = "Custom list_bucket_prefixes override must appear in the policy"
  }
}

# -----------------------------------------------------------------------------
# KMS is scoped to the bucket CMK only
# -----------------------------------------------------------------------------

run "kms_scoped_to_bucket_cmk_only" {
  command = plan

  assert {
    # Single KMS resource (not "*"), matching the var.worm_kms_key_arn input.
    condition = (
      strcontains(aws_iam_role_policy.audit_flush_write.policy, "abcd1234-ab12-cd34-ef56-abcdef123456") &&
      !strcontains(aws_iam_role_policy.audit_flush_write.policy, "\"Resource\": \"*\"") &&
      !strcontains(aws_iam_role_policy.audit_flush_write.policy, "\"Resource\":\"*\"")
    )
    error_message = "KMS resource must be the bucket CMK ARN, not the wildcard"
  }
}
