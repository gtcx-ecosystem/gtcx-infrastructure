# =============================================================================
# GTCX Vault Module — Kubernetes Auth Method
# =============================================================================
# Authenticates pods via their Kubernetes service account JWT.
# Each role binds a service account to Vault policies with TTL.
#
# Per SIGNAL L4: No human credentials — pods authenticate autonomously
# =============================================================================

# -----------------------------------------------------------------------------
# Vault Kubernetes Auth Backend
# -----------------------------------------------------------------------------

resource "vault_auth_backend" "kubernetes" {
  type = "kubernetes"
  path = "kubernetes"
}

resource "vault_kubernetes_auth_backend_config" "cluster" {
  backend                = vault_auth_backend.kubernetes.path
  kubernetes_host        = "https://kubernetes.default.svc"
  disable_iss_validation = true
}

# -----------------------------------------------------------------------------
# Kubernetes Auth Roles (dynamic from variable)
# -----------------------------------------------------------------------------
# Each role maps a K8s service account to Vault policies.
# Spec roles:
#   intelligence-prod    → db-intelligence-prod, pki-intelligence (1h TTL)
#   intelligence-staging → db-intelligence-staging (1h TTL)
#   protocols-prod       → db-protocols-prod (1h TTL)

resource "vault_kubernetes_auth_backend_role" "roles" {
  for_each = var.k8s_auth_roles

  backend                          = vault_auth_backend.kubernetes.path
  role_name                        = each.key
  bound_service_account_names      = each.value.bound_service_account_names
  bound_service_account_namespaces = each.value.bound_service_account_namespaces
  token_ttl                        = each.value.token_ttl_seconds
  token_policies                   = each.value.token_policies
  token_max_ttl                    = each.value.token_ttl_seconds * 2
}
