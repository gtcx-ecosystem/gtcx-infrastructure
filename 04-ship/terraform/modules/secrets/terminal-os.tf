# =============================================================================
# GTCX Secrets Module — terminal-os staging (W2-OPS-001)
# =============================================================================
# IRSA for ESO SecretStore in terminal-os-staging. Secret *values* are operator-
# populated in AWS SM; Terraform creates empty secret resources only.
# =============================================================================

locals {
  terminal_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "terminal-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  terminal_os_sm_prefix = "gtcx/terminal-os/${var.environment}"
}

# -----------------------------------------------------------------------------
# AWS Secrets Manager — terminal-os secrets shell
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "terminal_os_api_keys" {
  name        = "${local.terminal_os_sm_prefix}/api-keys"
  description = "terminal-os staging API keys bundle (COMPLIANCE_OS_TERMINAL_API_KEY, AUTH_SECRET, etc.)"

  tags = merge(local.terminal_os_tags, {
    Name = "gtcx-${var.environment}-terminal-os-api-keys"
  })
}

# -----------------------------------------------------------------------------
# IRSA — terminal-os-sa → read staging SM paths
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "terminal_os_secrets_reader" {
  name        = "gtcx-${var.environment}-terminal-os-secrets-reader"
  description = "Read terminal-os secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.terminal_os_api_keys.arn,
      ]
    }]
  })

  tags = local.terminal_os_tags
}

resource "aws_iam_role" "terminal_os_secrets" {
  name = "gtcx-${var.environment}-terminal-os-secrets-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = var.eks_oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.terminal_os_namespace}:${var.terminal_os_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.terminal_os_tags
}

resource "aws_iam_role_policy_attachment" "terminal_os_secrets" {
  role       = aws_iam_role.terminal_os_secrets.name
  policy_arn = aws_iam_policy.terminal_os_secrets_reader.arn
}
