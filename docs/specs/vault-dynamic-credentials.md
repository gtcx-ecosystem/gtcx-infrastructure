---
title: 'Vault Dynamic Credentials — SIGNAL L4 Infrastructure Spec'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Vault Dynamic Credentials — SIGNAL L4 Infrastructure Spec

**Status:** Planned
**SIGNAL Gate:** L4 Safeguards — zero standing access
**Priority:** Required for L4 autonomous operation
**Effort:** L (2-3 weeks engineering)

---

## Problem

Current secrets management uses static credentials in AWS Secrets Manager, synced to K8s via ESO every 1 hour. Credentials are long-lived. A leaked key works until someone manually rotates it. This is acceptable at L3 but blocks L4, which requires autonomous security — the system protects itself without human intervention.

## Solution

Deploy HashiCorp Vault with dynamic secret engines. Services receive short-lived credentials issued at runtime. No standing access. Leaked credentials expire automatically.

---

## Architecture

```
┌─────────────────────┐
│   Intelligence Pod   │
│                      │
│  1. Pod starts       │
│  2. Vault Agent      │──── authenticates via K8s SA ────┐
│     sidecar injects  │                                   │
│     credentials      │                                   ▼
│  3. Credentials      │                          ┌─────────────────┐
│     auto-renew       │                          │   Vault Server   │
│  4. Credentials      │                          │                  │
│     expire (1hr TTL) │                          │  ┌────────────┐ │
│                      │                          │  │ DB Engine  │ │
└─────────────────────┘                          │  │ (dynamic)  │ │
                                                  │  └─────┬──────┘ │
                                                  │        │        │
                                                  │  ┌─────▼──────┐ │
                                                  │  │ PKI Engine │ │
                                                  │  │ (mTLS)     │ │
                                                  │  └────────────┘ │
                                                  └────────┬────────┘
                                                           │
                                          creates temp user/cert
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │  RDS / NATS     │
                                                  │  (accepts       │
                                                  │   dynamic creds)│
                                                  └─────────────────┘
```

## Components

### 1. Vault Server (Helm)

Deploy Vault in HA mode with Raft integrated storage.

```hcl
module "vault" {
  source = "./modules/vault"

  environment       = var.environment
  namespace         = "vault"
  replicas          = 3  # HA with Raft
  storage_size_gb   = 10
  kms_key_arn       = aws_kms_key.vault.arn  # Auto-unseal via AWS KMS
  oidc_provider_arn = module.eks.oidc_provider_arn
}
```

**Key decisions:**

- **Storage:** Raft integrated (no external Consul dependency)
- **Auto-unseal:** AWS KMS (no manual unsealing after restart)
- **HA:** 3 replicas across AZs
- **Namespace:** `vault` (isolated from workloads)

### 2. Kubernetes Auth Method

Vault authenticates pods via their K8s service account JWT.

```
vault auth enable kubernetes
vault write auth/kubernetes/config \
  kubernetes_host="https://kubernetes.default.svc" \
  token_reviewer_jwt="@/var/run/secrets/kubernetes.io/serviceaccount/token"
```

**Roles:**

| Role                   | Bound SA               | Bound NS               | Policies                                   | TTL |
| ---------------------- | ---------------------- | ---------------------- | ------------------------------------------ | --- |
| `intelligence-prod`    | `intelligence`         | `intelligence`         | `db-intelligence-prod`, `pki-intelligence` | 1h  |
| `intelligence-staging` | `staging-intelligence` | `intelligence-staging` | `db-intelligence-staging`                  | 1h  |
| `protocols-prod`       | `gtcx-platform`        | `gtcx`                 | `db-protocols-prod`                        | 1h  |

### 3. Database Secrets Engine (Dynamic DB Credentials)

Vault connects to RDS and issues temporary users on demand.

```
vault secrets enable database

vault write database/config/operational \
  plugin_name=postgresql-database-plugin \
  allowed_roles="intelligence-prod,protocols-prod" \
  connection_url="postgresql://{{username}}:{{password}}@<operational-rds-endpoint>:5432/gtcx_development?sslmode=require" \
  username="vault_admin" \
  password="<from-secrets-manager>"

vault write database/roles/intelligence-prod \
  db_name=operational \
  creation_statements="CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}'; GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO \"{{name}}\";" \
  revocation_statements="DROP ROLE IF EXISTS \"{{name}}\";" \
  default_ttl=1h \
  max_ttl=24h
```

**Per-role grants:**

| Role                   | Tables               | Permissions                    | TTL |
| ---------------------- | -------------------- | ------------------------------ | --- |
| `intelligence-prod`    | All operational      | SELECT, INSERT, UPDATE         | 1h  |
| `intelligence-staging` | All operational      | SELECT, INSERT, UPDATE         | 1h  |
| `protocols-prod`       | Protocol tables only | SELECT, INSERT, UPDATE, DELETE | 1h  |
| `audit-readonly`       | All audit            | SELECT only                    | 1h  |

### 4. PKI Secrets Engine (mTLS Certificates)

Vault issues short-lived TLS certificates for service-to-service auth.

```
vault secrets enable pki
vault secrets tune -max-lease-ttl=87600h pki

vault write pki/root/generate/internal \
  common_name="gtcx-internal-ca" \
  ttl=87600h

vault write pki/roles/intelligence \
  allowed_domains="intelligence.svc.cluster.local,gtcx.svc.cluster.local" \
  allow_subdomains=true \
  max_ttl=72h
```

**Use cases:**

- Intelligence → NATS (mutual TLS, replacing password auth)
- Intelligence → RDS (certificate-based auth, replacing password)
- Cross-service calls (intelligence → protocols)

### 5. Vault Agent Sidecar Injector

Automatically injects Vault Agent as a sidecar into annotated pods.

```yaml
# Pod annotation to trigger injection
vault.hashicorp.com/agent-inject: 'true'
vault.hashicorp.com/role: 'intelligence-prod'
vault.hashicorp.com/agent-inject-secret-db-creds: 'database/creds/intelligence-prod'
vault.hashicorp.com/agent-inject-template-db-creds: |
  {{- with secret "database/creds/intelligence-prod" -}}
  postgresql://{{ .Data.username }}:{{ .Data.password }}@operational-rds:5432/gtcx_development?sslmode=require
  {{- end }}
```

The sidecar:

1. Authenticates to Vault via K8s SA
2. Fetches dynamic credentials
3. Writes them to a shared volume (`/vault/secrets/db-creds`)
4. Auto-renews before TTL expiry
5. Application reads from file (no env var — env vars persist in process table)

### 6. Terraform Module Structure

```
infra/terraform/modules/vault/
├── main.tf           # Helm release, KMS key, IRSA role
├── auth.tf           # K8s auth method, roles
├── database.tf       # Database secrets engine, connection configs, roles
├── pki.tf            # PKI engine, CA, roles
├── variables.tf
├── outputs.tf
└── vault.tftest.hcl
```

---

## Migration Path

### Phase 1: Deploy Vault (no workload changes)

1. Create Vault Terraform module
2. Deploy Vault server (3 replicas, KMS auto-unseal)
3. Configure K8s auth method
4. Configure database secrets engine with RDS connection
5. Verify: `vault read database/creds/intelligence-prod` returns temp credentials

**Workload impact:** None. ESO continues to work alongside Vault.

### Phase 2: Migrate intelligence services

1. Add Vault Agent annotations to intelligence K8s manifests
2. Update application code to read credentials from `/vault/secrets/` instead of env vars
3. Test in staging: pod starts, gets dynamic creds, connects to DB
4. Roll to production
5. Remove ESO ExternalSecret for DB credentials (API keys stay in Secrets Manager — can't be dynamic)

### Phase 3: Migrate remaining services

1. Protocols server
2. AGX platform
3. NATS (mTLS via PKI engine, replacing password auth)

### Phase 4: Enable audit + compliance

1. Enable Vault audit device (log every secret access)
2. Wire audit logs to Loki
3. Create Grafana dashboard for credential issuance patterns
4. Alert on anomalous access (unusual SA requesting creds, excessive issuance rate)

---

## What Stays in Secrets Manager

| Secret                         | Why                                              |
| ------------------------------ | ------------------------------------------------ |
| Anthropic API key              | External provider — can't issue dynamically      |
| OpenAI API key                 | Same                                             |
| ComplyAdvantage API key        | Same                                             |
| Vault unseal key (KMS-wrapped) | Bootstrap — Vault can't store its own unseal key |

ESO continues to sync these. Vault handles everything that can be dynamic.

---

## L4 Verification Criteria (from SIGNAL roadmap)

- [ ] Zero standing database credentials — all connections use Vault-issued temp users
- [ ] Credential TTL ≤ 1 hour — leaked creds auto-expire
- [ ] No human intervention for credential rotation — Vault Agent handles renewal
- [ ] Audit log of every credential issuance — who, when, what, TTL
- [ ] mTLS between intelligence services (PKI engine)
- [ ] Auto-revocation on pod termination — orphan credentials cleaned up

---

## Cost + Operational Impact

| Item                   | Impact                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Vault server (3 pods)  | ~150m CPU, 512Mi memory per pod                                                                                                                 |
| Vault Agent sidecar    | ~25m CPU, 32Mi memory per application pod                                                                                                       |
| KMS auto-unseal        | ~$1/mo per key usage                                                                                                                            |
| RDS temp user churn    | ~100 CREATE/DROP ROLE per hour (negligible)                                                                                                     |
| Operational complexity | Vault is a critical path dependency — if Vault is down, no new credentials are issued. Existing credentials continue working until TTL expires. |

**Risk mitigation:** HA with 3 replicas + KMS auto-unseal means Vault recovers from single node failure without human intervention. This is the L4 autonomous requirement.

---

## Dependencies

- EKS cluster running (done)
- RDS operational + audit databases (done)
- KMS key for auto-unseal (new — create in Vault module)
- IRSA role for Vault server (new — create in Vault module)
- Application code change: read creds from file instead of env var (intelligence + protocols repos)
