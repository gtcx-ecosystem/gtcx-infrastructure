# =============================================================================
# GTCX Vault Module — Variables
# =============================================================================
# Per SECURE: Zero standing database credentials — all dynamic via Vault
# Per SIGNAL L4: Autonomous security — system protects itself
# =============================================================================

variable "environment" {
  description = "Environment name (e.g., zimbabwe-pilot, ghana-prod)"
  type        = string
}

variable "namespace" {
  description = "Kubernetes namespace for Vault server"
  type        = string
  default     = "vault"
}

variable "replicas" {
  description = "Number of Vault server replicas (3 for HA)"
  type        = number
  default     = 3

  validation {
    condition     = var.replicas >= 1 && var.replicas <= 5
    error_message = "Replicas must be between 1 and 5."
  }
}

variable "storage_size_gb" {
  description = "Raft storage volume size in GB per replica"
  type        = number
  default     = 10
}

variable "vault_version" {
  description = "Vault Helm chart version"
  type        = string
  default     = "0.28.1"
}

variable "vault_image_tag" {
  description = "Vault server image tag"
  type        = string
  default     = "1.17.2"
}

# -----------------------------------------------------------------------------
# AWS / KMS
# -----------------------------------------------------------------------------

variable "kms_deletion_window_days" {
  description = "KMS key deletion window (days). Minimum 7."
  type        = number
  default     = 30

  validation {
    condition     = var.kms_deletion_window_days >= 7
    error_message = "KMS deletion window must be at least 7 days."
  }
}

# -----------------------------------------------------------------------------
# EKS / IRSA
# -----------------------------------------------------------------------------

variable "eks_oidc_provider_arn" {
  description = "EKS OIDC provider ARN for IRSA trust policy"
  type        = string
}

variable "eks_oidc_provider_url" {
  description = "EKS OIDC provider URL (without https://)"
  type        = string
}

# -----------------------------------------------------------------------------
# Database Secrets Engine
# -----------------------------------------------------------------------------

variable "rds_endpoint" {
  description = "RDS operational database endpoint (host:port)"
  type        = string
}

variable "rds_database_name" {
  description = "RDS database name"
  type        = string
  default     = "gtcx_development"
}

variable "vault_db_admin_username" {
  description = "Vault admin username for RDS (must have CREATE ROLE privileges)"
  type        = string
  default     = "vault_admin"
}

variable "vault_db_admin_password_secret_arn" {
  description = "ARN of Secrets Manager secret containing Vault's RDS admin password"
  type        = string
}

# -----------------------------------------------------------------------------
# Dynamic Credential Roles
# -----------------------------------------------------------------------------

variable "db_roles" {
  description = "Database dynamic credential roles to create"
  type = map(object({
    db_name               = string
    creation_statements   = list(string)
    revocation_statements = list(string)
    default_ttl_seconds   = number
    max_ttl_seconds       = number
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# Kubernetes Auth Roles
# -----------------------------------------------------------------------------

variable "k8s_auth_roles" {
  description = "Kubernetes auth method roles mapping service accounts to Vault policies"
  type = map(object({
    bound_service_account_names      = list(string)
    bound_service_account_namespaces = list(string)
    token_ttl_seconds                = number
    token_policies                   = list(string)
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# PKI
# -----------------------------------------------------------------------------

variable "enable_pki" {
  description = "Enable PKI secrets engine for mTLS certificates"
  type        = bool
  default     = true
}

variable "pki_common_name" {
  description = "Common name for the internal root CA"
  type        = string
  default     = "gtcx-internal-ca"
}

variable "pki_max_ttl_hours" {
  description = "Maximum TTL for the root CA in hours (default 10 years)"
  type        = number
  default     = 87600
}

variable "pki_roles" {
  description = "PKI certificate roles"
  type = map(object({
    allowed_domains  = list(string)
    allow_subdomains = bool
    max_ttl_hours    = number
    key_type         = string
    key_bits         = number
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# AWS Secrets Engine (SIGNAL L5 — Per-Workflow Credentials)
# -----------------------------------------------------------------------------

variable "enable_aws_engine" {
  description = "Enable AWS secrets engine for dynamic IAM credentials"
  type        = bool
  default     = false
}

variable "aws_credential_roles" {
  description = "AWS dynamic credential roles for pipeline workloads"
  type = map(object({
    credential_type     = string
    policy_arns         = list(string)
    default_ttl_seconds = number
    max_ttl_seconds     = number
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# Resource Limits
# -----------------------------------------------------------------------------

variable "server_resources" {
  description = "Resource requests/limits for Vault server pods"
  type = object({
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
  })
  default = {
    cpu_request    = "100m"
    memory_request = "256Mi"
    cpu_limit      = "500m"
    memory_limit   = "512Mi"
  }
}

variable "injector_resources" {
  description = "Resource requests/limits for Vault Agent Injector pods"
  type = object({
    cpu_request    = string
    memory_request = string
    cpu_limit      = string
    memory_limit   = string
  })
  default = {
    cpu_request    = "50m"
    memory_request = "64Mi"
    cpu_limit      = "250m"
    memory_limit   = "128Mi"
  }
}

variable "tags" {
  description = "Additional tags for AWS resources"
  type        = map(string)
  default     = {}
}
