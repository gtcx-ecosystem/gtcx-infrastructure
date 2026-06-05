# =============================================================================
# External Access Plane (EAP) — Secrets + IAM (Protocol 23 / ADR-001)
# =============================================================================
# Client API key material: gtcx/eap/<environment>/clients/<client_id>
# Intelligence runtime bundle (AUTH_API_KEYS sync target):
#   gtcx/intelligence/<environment>/auth-keys
# =============================================================================

locals {
  eap_tags = merge(local.common_tags, {
    Service   = "eap"
    Principle = "SECURE"
  })
}

resource "aws_secretsmanager_secret" "intelligence_auth_keys" {
  name        = "gtcx/intelligence/${var.environment}/auth-keys"
  description = "Intelligence HTTP auth bundle (AUTH_API_KEYS, AUTH_KEY_ROLES) — EAP sync target"

  tags = merge(local.eap_tags, {
    Name = "gtcx-${var.environment}-intelligence-auth-keys"
  })
}

resource "aws_iam_policy" "eap_admin" {
  name        = "gtcx-${var.environment}-eap-admin"
  description = "EAP control plane: issue/revoke client secrets and sync intelligence auth bundle"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EapClientSecrets"
        Effect = "Allow"
        Action = [
          "secretsmanager:CreateSecret",
          "secretsmanager:PutSecretValue",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:TagResource",
          "secretsmanager:UpdateSecret",
        ]
        Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:gtcx/eap/${var.environment}/clients/*"
      },
      {
        Sid    = "IntelligenceAuthBundle"
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:PutSecretValue",
          "secretsmanager:DescribeSecret",
        ]
        Resource = aws_secretsmanager_secret.intelligence_auth_keys.arn
      },
      {
        Sid      = "ListSecrets"
        Effect   = "Allow"
        Action   = ["secretsmanager:ListSecrets"]
        Resource = "*"
      },
    ]
  })

  tags = local.eap_tags
}

resource "aws_iam_role" "eap_admin" {
  name = "gtcx-${var.environment}-eap-admin"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.eks_oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${local.oidc_issuer}:sub" = "system:serviceaccount:platform:eap-admin"
            "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
          }
        }
      },
    ]
  })

  tags = local.eap_tags
}

resource "aws_iam_role_policy_attachment" "eap_admin" {
  role       = aws_iam_role.eap_admin.name
  policy_arn = aws_iam_policy.eap_admin.arn
}

data "aws_caller_identity" "current" {}
