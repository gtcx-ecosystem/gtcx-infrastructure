# =============================================================================
# GTCX Vault Module — PKI Secrets Engine
# =============================================================================
# Issues short-lived TLS certificates for service-to-service mTLS.
# Replaces long-lived certs and password-based auth between services.
#
# Per SIGNAL L4: mTLS between intelligence services
# Per SECURE: Certificate-based auth, auto-renewal via Vault Agent
# =============================================================================

# -----------------------------------------------------------------------------
# PKI Secrets Engine (conditionally enabled)
# -----------------------------------------------------------------------------

resource "vault_mount" "pki" {
  count = var.enable_pki ? 1 : 0

  path        = "pki"
  type        = "pki"
  description = "Internal PKI for GTCX service-to-service mTLS"

  default_lease_ttl_seconds = 259200 # 72 hours
  max_lease_ttl_seconds     = var.pki_max_ttl_hours * 3600
}

# -----------------------------------------------------------------------------
# Root CA — Internal Only
# -----------------------------------------------------------------------------

resource "vault_pki_secret_backend_root_cert" "internal_ca" {
  count = var.enable_pki ? 1 : 0

  backend     = vault_mount.pki[0].path
  type        = "internal"
  common_name = var.pki_common_name
  ttl         = "${var.pki_max_ttl_hours}h"
  key_type    = "ec"
  key_bits    = 256

  issuer_name = "gtcx-root"
}

# -----------------------------------------------------------------------------
# PKI Certificate Roles
# -----------------------------------------------------------------------------
# Each role defines which domains a service can request certs for.
# Spec roles:
#   intelligence → intelligence.svc.cluster.local, gtcx.svc.cluster.local
#   nats         → nats.svc.cluster.local (mTLS replacing password auth)

resource "vault_pki_secret_backend_role" "roles" {
  for_each = var.enable_pki ? var.pki_roles : {}

  backend          = vault_mount.pki[0].path
  name             = each.key
  allowed_domains  = each.value.allowed_domains
  allow_subdomains = each.value.allow_subdomains
  max_ttl          = "${each.value.max_ttl_hours}h"
  key_type         = each.value.key_type
  key_bits         = each.value.key_bits

  generate_lease = true
  no_store       = true
}

# -----------------------------------------------------------------------------
# Vault Policies for PKI Access
# -----------------------------------------------------------------------------

resource "vault_policy" "pki_roles" {
  for_each = var.enable_pki ? var.pki_roles : {}

  name = "pki-${each.key}"

  policy = <<-EOT
    path "pki/issue/${each.key}" {
      capabilities = ["create", "update"]
    }
    path "pki/cert/ca" {
      capabilities = ["read"]
    }
  EOT
}
