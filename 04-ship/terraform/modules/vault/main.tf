# =============================================================================
# GTCX Vault Module — Main
# =============================================================================
# HashiCorp Vault in HA mode with Raft integrated storage and AWS KMS
# auto-unseal. Deployed via Helm with IRSA for KMS access.
#
# Per SECURE: Zero standing credentials — all dynamic via Vault
# Per SIGNAL L4: Autonomous security — no human intervention for rotation
# Per SOVEREIGN (6): In-country deployment alongside compute
# =============================================================================

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "gtcx"
    Component   = "vault"
    Principle   = "SECURE SIGNAL-L4"
  })

  cluster_name = "gtcx-${var.environment}"
  oidc_issuer  = var.eks_oidc_provider_url
}

# -----------------------------------------------------------------------------
# KMS Key — Vault Auto-Unseal
# -----------------------------------------------------------------------------
# Vault uses this key to automatically unseal after pod restarts.
# Without it, 3 operators must manually provide unseal keys — blocking L4.

resource "aws_kms_key" "vault_unseal" {
  description             = "Vault auto-unseal key for ${var.environment}"
  deletion_window_in_days = var.kms_deletion_window_days
  enable_key_rotation     = true
  is_enabled              = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAccountRoot"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowVaultUnseal"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.vault_server.arn
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:DescribeKey",
        ]
        Resource = "*"
      },
    ]
  })

  tags = merge(local.common_tags, {
    Name = "gtcx-${var.environment}-vault-unseal"
  })
}

resource "aws_kms_alias" "vault_unseal" {
  name          = "alias/gtcx-${var.environment}-vault-unseal"
  target_key_id = aws_kms_key.vault_unseal.key_id
}

# -----------------------------------------------------------------------------
# IAM — IRSA Role for Vault Server
# -----------------------------------------------------------------------------
# Vault server pods need KMS access for auto-unseal.

resource "aws_iam_role" "vault_server" {
  name = "gtcx-${var.environment}-vault-server"

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
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.namespace}:vault"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "vault_kms" {
  name = "gtcx-${var.environment}-vault-kms-unseal"
  role = aws_iam_role.vault_server.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:DescribeKey",
      ]
      Resource = aws_kms_key.vault_unseal.arn
    }]
  })
}

# -----------------------------------------------------------------------------
# Helm Release — Vault Server (HA with Raft)
# -----------------------------------------------------------------------------

resource "helm_release" "vault" {
  name             = "vault"
  repository       = "https://helm.releases.hashicorp.com"
  chart            = "vault"
  version          = var.vault_version
  namespace        = var.namespace
  create_namespace = true

  wait    = true
  timeout = 600

  # -- Global
  set {
    name  = "global.enabled"
    value = "true"
  }

  # -- Server
  set {
    name  = "server.ha.enabled"
    value = tostring(var.replicas > 1)
  }

  set {
    name  = "server.ha.replicas"
    value = tostring(var.replicas)
  }

  set {
    name  = "server.ha.raft.enabled"
    value = "true"
  }

  set {
    name  = "server.image.tag"
    value = var.vault_image_tag
  }

  # -- IRSA annotation
  set {
    name  = "server.serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.vault_server.arn
  }

  # -- Resources
  set {
    name  = "server.resources.requests.cpu"
    value = var.server_resources.cpu_request
  }

  set {
    name  = "server.resources.requests.memory"
    value = var.server_resources.memory_request
  }

  set {
    name  = "server.resources.limits.cpu"
    value = var.server_resources.cpu_limit
  }

  set {
    name  = "server.resources.limits.memory"
    value = var.server_resources.memory_limit
  }

  # -- Storage
  set {
    name  = "server.dataStorage.size"
    value = "${var.storage_size_gb}Gi"
  }

  # -- Audit storage (separate PVC for audit logs)
  set {
    name  = "server.auditStorage.enabled"
    value = "true"
  }

  set {
    name  = "server.auditStorage.size"
    value = "10Gi"
  }

  # -- Vault config (HCL) — KMS auto-unseal + Raft listener + TLS
  # TLS certificates are provisioned by cert-manager (vault-server-tls secret).
  # See: infra/kubernetes/base/services/vault-tls.yaml
  values = [yamlencode({
    server = {
      extraEnvironmentVars = {
        AWS_REGION = data.aws_region.current.name
      }
      extraVolumes = [
        {
          type = "secret"
          name = "vault-server-tls"
        }
      ]
      extraVolumeMounts = [
        {
          name      = "vault-server-tls"
          mountPath = "/vault/tls"
          readOnly  = true
        }
      ]
      ha = {
        raft = {
          config = <<-EOT
            ui = true

            listener "tcp" {
              tls_disable       = 0
              tls_cert_file     = "/vault/tls/tls.crt"
              tls_key_file      = "/vault/tls/tls.key"
              tls_client_ca_file = "/vault/tls/ca.crt"
              address           = "[::]:8200"
              cluster_address   = "[::]:8201"
            }

            storage "raft" {
              path = "/vault/data"
            }

            seal "awskms" {
              region     = "${data.aws_region.current.name}"
              kms_key_id = "${aws_kms_key.vault_unseal.key_id}"
            }

            service_registration "kubernetes" {}
          EOT
        }
      }
    }
  })]

  # -- Injector (sidecar)
  set {
    name  = "injector.enabled"
    value = "true"
  }

  set {
    name  = "injector.resources.requests.cpu"
    value = var.injector_resources.cpu_request
  }

  set {
    name  = "injector.resources.requests.memory"
    value = var.injector_resources.memory_request
  }

  set {
    name  = "injector.resources.limits.cpu"
    value = var.injector_resources.cpu_limit
  }

  set {
    name  = "injector.resources.limits.memory"
    value = var.injector_resources.memory_limit
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
