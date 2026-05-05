# =============================================================================
# Secrets Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates Secrets Manager resources and IRSA configuration.
# =============================================================================

variables {
  environment                  = "test"
  eks_cluster_name             = "gtcx-test"
  eks_oidc_provider_arn        = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.af-south-1.amazonaws.com/id/TEST"
  intelligence_namespace       = "intelligence"
  intelligence_service_account = "intelligence-sa"
}

# -----------------------------------------------------------------------------
# Secrets Manager resources
# -----------------------------------------------------------------------------

run "anthropic_api_key_secret_created" {
  command = plan

  assert {
    condition     = aws_secretsmanager_secret.anthropic_api_key.name == "gtcx/intelligence/anthropic-api-key"
    error_message = "Anthropic API key secret must use structured naming"
  }
}

run "comply_advantage_secret_created" {
  command = plan

  assert {
    condition     = aws_secretsmanager_secret.comply_advantage_api_key.name == "gtcx/intelligence/comply-advantage-api-key"
    error_message = "ComplyAdvantage API key secret must use structured naming"
  }
}

# -----------------------------------------------------------------------------
# IRSA configuration
# -----------------------------------------------------------------------------

run "irsa_role_uses_parameterized_namespace" {
  command = plan

  assert {
    condition     = can(regex("intelligence:intelligence-sa", aws_iam_role.intelligence_secrets.assume_role_policy))
    error_message = "IRSA role must use parameterized namespace and service account"
  }
}
