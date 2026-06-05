# =============================================================================
# KYC Screening Module — Terraform Native Tests
# =============================================================================
# Requires Terraform >= 1.7 (mise-pinned to 1.7.5).
# Run: terraform test (from this directory)
# =============================================================================

variables {
  environment              = "test"
  kyc_documents_bucket_arn = "arn:aws:s3:::gtcx-test-kyc-documents"
  kyc_documents_kms_key_arn = "arn:aws:kms:af-south-1:123456789012:key/abcd1234"
  lambda_package_path      = "test-fixtures/empty.zip"
}

# -----------------------------------------------------------------------------
# Lambda is wired with least-privilege IAM
# -----------------------------------------------------------------------------

run "iam_policy_read_only_under_kyc_prefix" {
  command = plan

  assert {
    # GetObject is scoped to kyc/* (NOT the bucket root). Without this
    # condition, the Lambda could read its own screening sidecars +
    # any unrelated keys in the bucket.
    condition     = strcontains(aws_iam_role_policy.screening_access.policy, "${var.kyc_documents_bucket_arn}/kyc/*")
    error_message = "GetObject must be scoped to the kyc/ prefix"
  }
}

run "iam_policy_write_only_screening_sidecars" {
  command = plan

  assert {
    # PutObject is scoped to *.screening.json keys only. Without this,
    # a Lambda compromise could overwrite KYC documents themselves.
    condition     = strcontains(aws_iam_role_policy.screening_access.policy, "${var.kyc_documents_bucket_arn}/kyc/*.screening.json")
    error_message = "PutObject must be scoped to *.screening.json suffix"
  }
}

run "iam_policy_does_not_grant_wildcard_resources" {
  command = plan

  assert {
    condition = (
      !strcontains(aws_iam_role_policy.screening_access.policy, "\"Resource\": \"*\"") &&
      !strcontains(aws_iam_role_policy.screening_access.policy, "\"Resource\":\"*\"")
    )
    error_message = "No statement may use Resource: \"*\""
  }
}

# -----------------------------------------------------------------------------
# Lambda hardening
# -----------------------------------------------------------------------------

run "lambda_has_dlq" {
  command = plan

  assert {
    condition     = aws_lambda_function.screening.dead_letter_config[0].target_arn == aws_sqs_queue.dlq.arn
    error_message = "Lambda must have a DLQ wired"
  }
}

run "lambda_has_reserved_concurrency" {
  command = plan

  assert {
    condition     = aws_lambda_function.screening.reserved_concurrent_executions == 50
    error_message = "Reserved concurrency cap protects downstream provider rate limits"
  }
}

run "lambda_tracing_enabled" {
  command = plan

  assert {
    condition     = aws_lambda_function.screening.tracing_config[0].mode == "Active"
    error_message = "X-Ray tracing must be active for forensic visibility"
  }
}

# -----------------------------------------------------------------------------
# Provider validation
# -----------------------------------------------------------------------------

run "rejects_unknown_provider" {
  command = plan

  variables {
    environment               = "test"
    kyc_documents_bucket_arn  = "arn:aws:s3:::gtcx-test-kyc-documents"
    kyc_documents_kms_key_arn = "arn:aws:kms:af-south-1:123456789012:key/abcd1234"
    lambda_package_path       = "test-fixtures/empty.zip"
    screening_provider        = "fake-provider"
  }

  expect_failures = [var.screening_provider]
}
