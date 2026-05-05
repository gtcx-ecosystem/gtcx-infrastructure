# =============================================================================
# GTCX Secrets Module — Intelligence Services
# =============================================================================
# AWS Secrets Manager secrets for GTCX intelligence services (ANISA, PANX,
# Cortex) with External Secrets Operator (ESO) sync into Kubernetes.
# Per SECURE: Secrets never stored in git, rotated automatically
# Per SOVEREIGN (6): Secrets stored in-region alongside compute
# Per DEPLOYABLE (14): Reproducible secret infrastructure
# =============================================================================

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    Service     = "intelligence"
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Principle   = "SECURE SOVEREIGN"
  })

  oidc_issuer = replace(
    replace(var.eks_oidc_provider_arn, "/^arn:aws:iam::\\d+:oidc-provider\\//", ""),
    "/$/", ""
  )
}

# -----------------------------------------------------------------------------
# AWS Secrets Manager — Intelligence Secrets
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name        = "gtcx/intelligence/anthropic-api-key"
  description = "Anthropic API key for ANISA and intelligence LLM calls"

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-anthropic-api-key"
  })
}

resource "aws_secretsmanager_secret" "comply_advantage_api_key" {
  name        = "gtcx/intelligence/comply-advantage-api-key"
  description = "ComplyAdvantage API key for AML/KYC screening"

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-comply-advantage-api-key"
  })
}

resource "aws_secretsmanager_secret" "database_url" {
  name        = "gtcx/intelligence/database-url"
  description = "PostgreSQL connection string for intelligence services"

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-intelligence-database-url"
  })
}

# -----------------------------------------------------------------------------
# Automatic Rotation — Database URL (30-day schedule)
# -----------------------------------------------------------------------------

resource "aws_secretsmanager_secret_rotation" "database_url" {
  secret_id           = aws_secretsmanager_secret.database_url.id
  rotation_lambda_arn = aws_lambda_function.secret_rotation.arn

  rotation_rules {
    automatically_after_days = 30
  }
}

resource "aws_lambda_function" "secret_rotation" {
  function_name = "gtcx-${var.environment}-intelligence-db-secret-rotation"
  description   = "Rotates the intelligence database URL secret"
  runtime       = "python3.12"
  handler       = "index.handler"
  timeout       = 30
  memory_size   = 128

  filename         = "${path.module}/lambda/rotation.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/rotation.zip")

  role = aws_iam_role.rotation_lambda.arn

  environment {
    variables = {
      SECRET_ARN  = aws_secretsmanager_secret.database_url.arn
      ENVIRONMENT = var.environment
    }
  }

  tags = local.common_tags
}

resource "aws_iam_role" "rotation_lambda" {
  name = "gtcx-${var.environment}-intelligence-rotation-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "rotation_lambda" {
  name = "gtcx-${var.environment}-intelligence-rotation-policy"
  role = aws_iam_role.rotation_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:DescribeSecret",
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:UpdateSecretVersionStage",
        ]
        Resource = aws_secretsmanager_secret.database_url.arn
      },
      {
        # GetRandomPassword is an account-level action — no resource ARN exists
        Effect = "Allow"
        Action = [
          "secretsmanager:GetRandomPassword",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:log-group:/aws/lambda/gtcx-*-intelligence-rotation:*"
      },
    ]
  })
}

resource "aws_lambda_permission" "secrets_manager" {
  statement_id  = "AllowSecretsManagerInvocation"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.secret_rotation.function_name
  principal     = "secretsmanager.amazonaws.com"
}

# -----------------------------------------------------------------------------
# IAM — IRSA Policy for Intelligence Service Account
# -----------------------------------------------------------------------------

resource "aws_iam_policy" "intelligence_secrets_reader" {
  name        = "gtcx-${var.environment}-intelligence-secrets-reader"
  description = "Allow EKS intelligence service account to read secrets from AWS Secrets Manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = [
          aws_secretsmanager_secret.anthropic_api_key.arn,
          aws_secretsmanager_secret.comply_advantage_api_key.arn,
          aws_secretsmanager_secret.database_url.arn,
        ]
      },
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role" "intelligence_secrets" {
  name = "gtcx-${var.environment}-intelligence-secrets-role"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.intelligence_namespace}:${var.intelligence_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "intelligence_secrets" {
  role       = aws_iam_role.intelligence_secrets.name
  policy_arn = aws_iam_policy.intelligence_secrets_reader.arn
}

# -----------------------------------------------------------------------------
# External Secrets Operator — Helm Release (controller install)
# -----------------------------------------------------------------------------
# Must be applied before SecretStore/ExternalSecret CRDs can be registered.
# Per DEPLOYABLE (14): operator lifecycle is Terraform-managed, not manual.
# -----------------------------------------------------------------------------

resource "helm_release" "external_secrets_operator" {
  name             = "external-secrets"
  repository       = "https://charts.external-secrets.io"
  chart            = "external-secrets"
  namespace        = "external-secrets"
  create_namespace = true
  version          = "0.9.20"

  set {
    name  = "installCRDs"
    value = "true"
  }

  set {
    name  = "webhook.port"
    value = "9443"
  }

  # Wait for all pods to be ready before Terraform proceeds to kubectl_manifest
  wait    = true
  timeout = 300
}

# -----------------------------------------------------------------------------
# External Secrets Operator — SecretStore + ExternalSecret (K8s manifests)
# -----------------------------------------------------------------------------

resource "kubectl_manifest" "secret_store" {
  yaml_body = yamlencode({
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "SecretStore"
    metadata = {
      name      = "intelligence-aws-secrets"
      namespace = "intelligence"
      labels = {
        "app.kubernetes.io/managed-by" = "terraform"
        "app.kubernetes.io/part-of"    = "gtcx-intelligence"
      }
    }
    spec = {
      provider = {
        aws = {
          service = "SecretsManager"
          region  = data.aws_region.current.name
          auth = {
            jwt = {
              serviceAccountRef = {
                name = "intelligence-sa"
              }
            }
          }
        }
      }
    }
  })

  depends_on = [helm_release.external_secrets_operator]
}

resource "kubectl_manifest" "external_secret" {
  yaml_body = yamlencode({
    apiVersion = "external-secrets.io/v1beta1"
    kind       = "ExternalSecret"
    metadata = {
      name      = "intelligence-secrets"
      namespace = "intelligence"
      labels = {
        "app.kubernetes.io/managed-by" = "terraform"
        "app.kubernetes.io/part-of"    = "gtcx-intelligence"
      }
    }
    spec = {
      refreshInterval = "1h"
      secretStoreRef = {
        name = "intelligence-aws-secrets"
        kind = "SecretStore"
      }
      target = {
        name           = "intelligence-secrets"
        creationPolicy = "Owner"
      }
      data = [
        {
          secretKey = "ANTHROPIC_API_KEY"
          remoteRef = {
            key = aws_secretsmanager_secret.anthropic_api_key.name
          }
        },
        {
          secretKey = "COMPLY_ADVANTAGE_API_KEY"
          remoteRef = {
            key = aws_secretsmanager_secret.comply_advantage_api_key.name
          }
        },
        {
          secretKey = "DATABASE_URL"
          remoteRef = {
            key = aws_secretsmanager_secret.database_url.name
          }
        },
      ]
    }
  })

  depends_on = [
    helm_release.external_secrets_operator,
    kubectl_manifest.secret_store,
  ]
}

# -----------------------------------------------------------------------------
# Secret Rotation Failure Monitoring
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "rotation_alerts" {
  name = "gtcx-${var.environment}-secret-rotation-alerts"
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "rotation_failure" {
  alarm_name        = "gtcx-${var.environment}-secret-rotation-failure"
  alarm_description = "Alert when Secrets Manager rotation fails for intelligence DB credentials"

  namespace   = "AWS/SecretsManager"
  metric_name = "RotationFailed"
  statistic   = "Sum"
  period      = 86400 # 24 hours
  threshold   = 1

  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  treat_missing_data  = "notBreaching"

  dimensions = {
    SecretName = aws_secretsmanager_secret.database_url.name
  }

  alarm_actions = [aws_sns_topic.rotation_alerts.arn]
  ok_actions    = [aws_sns_topic.rotation_alerts.arn]

  tags = local.common_tags
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}
