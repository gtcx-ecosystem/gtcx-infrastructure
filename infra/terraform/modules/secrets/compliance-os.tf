# =============================================================================
# GTCX Secrets Module — compliance-os staging (Hub #17 / ER-1-10)
# =============================================================================
# IRSA for ESO SecretStore in compliance-os-staging. Secret *values* are operator-
# populated in AWS SM; Terraform creates empty secret resources only.
# =============================================================================

locals {
  compliance_os_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "compliance-os"
    ManagedBy   = "terraform"
    Project     = "gtcx"
  })

  compliance_os_sm_prefix = "gtcx/compliance-os/${var.environment}"

  compliance_os_secret_names = [
    "${local.compliance_os_sm_prefix}/ghcr-pull-token",
    "${local.compliance_os_sm_prefix}/w2",
    "${local.compliance_os_sm_prefix}/compliance-api",
    "${local.compliance_os_sm_prefix}/caas",
    "${local.compliance_os_sm_prefix}/core12",
    "${local.compliance_os_sm_prefix}/via",
    "${local.compliance_os_sm_prefix}/vxa",
    "${local.compliance_os_sm_prefix}/minio",
  ]
}

# -----------------------------------------------------------------------------
# AWS Secrets Manager — shells (operator fills values)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "compliance_os_ghcr_pull" {
  name        = "${local.compliance_os_sm_prefix}/ghcr-pull-token"
  description = "GHCR pull token (.dockerconfigjson) for compliance-os staging"

  tags = merge(local.compliance_os_tags, {
    Name = "gtcx-${var.environment}-compliance-os-ghcr-pull"
  })
}

resource "aws_secretsmanager_secret" "compliance_os_w2" {
  name        = "${local.compliance_os_sm_prefix}/w2"
  description = "Hub #17 W2 bundle — intake, terminal export, compliance-api client, session (web pod)"

  tags = merge(local.compliance_os_tags, {
    Name = "gtcx-${var.environment}-compliance-os-w2"
  })
}

resource "aws_secretsmanager_secret" "compliance_os_compliance_api" {
  name        = "${local.compliance_os_sm_prefix}/compliance-api"
  description = "compliance-api secrets bundle"

  tags = local.compliance_os_tags
}

resource "aws_secretsmanager_secret" "compliance_os_caas" {
  name        = "${local.compliance_os_sm_prefix}/caas"
  description = "caas staging secrets bundle"

  tags = local.compliance_os_tags
}

resource "aws_secretsmanager_secret" "compliance_os_core12" {
  name        = "${local.compliance_os_sm_prefix}/core12"
  description = "core12 staging secrets bundle"

  tags = local.compliance_os_tags
}

resource "aws_secretsmanager_secret" "compliance_os_via" {
  name        = "${local.compliance_os_sm_prefix}/via"
  description = "via staging secrets bundle"

  tags = local.compliance_os_tags
}

resource "aws_secretsmanager_secret" "compliance_os_vxa" {
  name        = "${local.compliance_os_sm_prefix}/vxa"
  description = "vxa staging secrets bundle"

  tags = local.compliance_os_tags
}

resource "aws_secretsmanager_secret" "compliance_os_minio" {
  name        = "${local.compliance_os_sm_prefix}/minio"
  description = "minio staging secrets bundle"

  tags = local.compliance_os_tags
}

# -----------------------------------------------------------------------------
# IRSA — compliance-os-sa → read staging SM paths
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "compliance_os_secrets_reader" {
  name        = "gtcx-${var.environment}-compliance-os-secrets-reader"
  description = "Read compliance-os secrets from AWS Secrets Manager (ESO)"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ]
      Resource = [
        aws_secretsmanager_secret.compliance_os_ghcr_pull.arn,
        aws_secretsmanager_secret.compliance_os_w2.arn,
        aws_secretsmanager_secret.compliance_os_compliance_api.arn,
        aws_secretsmanager_secret.compliance_os_caas.arn,
        aws_secretsmanager_secret.compliance_os_core12.arn,
        aws_secretsmanager_secret.compliance_os_via.arn,
        aws_secretsmanager_secret.compliance_os_vxa.arn,
        aws_secretsmanager_secret.compliance_os_minio.arn,
      ]
    }]
  })

  tags = local.compliance_os_tags
}

resource "aws_iam_role" "compliance_os_secrets" {
  name = "gtcx-${var.environment}-compliance-os-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.compliance_os_namespace}:${var.compliance_os_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.compliance_os_tags
}

resource "aws_iam_role_policy_attachment" "compliance_os_secrets" {
  role       = aws_iam_role.compliance_os_secrets.name
  policy_arn = aws_iam_policy.compliance_os_secrets_reader.arn
}
