mock_provider "aws" {}

variables {
  environment       = "test"
  signing_role_arns = ["arn:aws:iam::123456789012:role/replay-guard-test"]
  admin_role_arns   = ["arn:aws:iam::123456789012:role/infra-admin-test"]
  alarm_sns_topic_arns    = []
  deletion_window_days    = 30
  rotation_interval_days  = 90
  log_retention_days      = 2557
}

run "signing_key_is_asymmetric_ecc" {
  command = plan

  assert {
    condition     = aws_kms_key.signing.key_usage == "SIGN_VERIFY"
    error_message = "Signing key must be SIGN_VERIFY usage"
  }

  assert {
    condition     = aws_kms_key.signing.customer_master_key_spec == "ECC_NIST_P256"
    error_message = "Signing key must be ECC_NIST_P256 for ES256 compatibility"
  }

  assert {
    condition     = aws_kms_key.signing.is_enabled == true
    error_message = "Signing key must be enabled"
  }
}

run "deletion_protection_is_30_days" {
  command = plan

  assert {
    condition     = aws_kms_key.signing.deletion_window_in_days == 30
    error_message = "Signing key must have 30-day deletion window"
  }
}

run "alias_follows_naming_convention" {
  command = plan

  assert {
    condition     = aws_kms_alias.signing.name == "alias/gtcx-test-signing"
    error_message = "Alias must follow gtcx-{env}-signing pattern"
  }
}

run "audit_log_retention_is_7_years" {
  command = plan

  assert {
    condition     = aws_cloudwatch_log_group.kms_audit.retention_in_days == 2557
    error_message = "KMS audit logs must be retained for 7 years"
  }
}

run "iam_policy_restricts_to_ecdsa_sha_256" {
  command = plan

  assert {
    condition     = can(regex("ECDSA_SHA_256", aws_iam_policy.replay_guard_kms.policy))
    error_message = "IAM policy must restrict signing to ECDSA_SHA_256 algorithm"
  }
}

run "ssm_parameters_exist" {
  command = plan

  assert {
    condition     = aws_ssm_parameter.signing_key_id.name == "/gtcx/test/kms/signing-key-id"
    error_message = "SSM parameter for key ID must follow naming convention"
  }

  assert {
    condition     = aws_ssm_parameter.signing_key_arn.name == "/gtcx/test/kms/signing-key-arn"
    error_message = "SSM parameter for key ARN must follow naming convention"
  }
}
