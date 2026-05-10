# Tokenization Architecture

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> PII tokenization design using HashiCorp Vault Transit for format-preserving encryption across GTCX services.

---

## Overview

GTCX tokenizes all PII fields before storage. The tokenization layer sits between application services and the data layer, ensuring that databases never contain raw PII. Detokenization requires explicit authorization and produces an immutable audit record.

---

## Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│ Application  │────>│ Tokenization Service │────>│ Token Store  │
│   Service    │<────│  (Vault Transit)     │<────│ (PostgreSQL) │
└─────────────┘     └──────────────────────┘     └─────────────┘
                            │
                            v
                    ┌──────────────┐
                    │  Audit Log   │
                    │ (gtcx_audit) │
                    └──────────────┘
```

**Flow**:

1. Application sends raw PII to the Tokenization Service via internal API
2. Vault Transit encrypts the value using format-preserving encryption (FPE)
3. The token (same length/type as original) is returned to the application
4. Application stores the token in the operational database
5. Original plaintext is never persisted outside Vault

---

## Fields to Tokenize

| Field           | Format                        | Token Example                    | FPE Mode                  |
| --------------- | ----------------------------- | -------------------------------- | ------------------------- |
| `name`          | Unicode string, max 128 chars | Same-length alphanumeric token   | FF3-1                     |
| `email`         | user@domain.tld               | token@gtcx.internal              | FF3-1 (preserves @ and .) |
| `phone`         | E.164 (+263771234567)         | +263700000000 (preserves prefix) | FF3-1 (digit-only)        |
| `national_id`   | Country-specific alphanumeric | Same-length alphanumeric         | FF3-1                     |
| `address`       | Free-text string              | Same-length token                | FF3-1                     |
| `date_of_birth` | YYYY-MM-DD                    | Valid date token                 | FF3-1 (digit-only)        |

**Token properties**:

- Same length and character class as the original value
- Passes basic format validation (email tokens contain @, phone tokens start with +)
- Deterministic per key version — same input produces same token (enables equality checks without detokenization)
- Not reversible without Vault access

---

## Vault Transit Engine Configuration

### Terraform

```hcl
# infra/terraform/modules/vault/tokenization.tf

resource "vault_mount" "transit" {
  path        = "transit"
  type        = "transit"
  description = "Transit engine for PII tokenization"

  default_lease_ttl_seconds = 0
  max_lease_ttl_seconds     = 0
}

resource "vault_transit_secret_backend_key" "pii_tokenization" {
  backend          = vault_mount.transit.path
  name             = "gtcx-pii-tokenization"
  type             = "aes256-gcm96"
  deletion_allowed = false
  exportable       = false
  min_decryption_version = 1
  min_encryption_version = 1
}

# Separate key for each sensitivity domain
resource "vault_transit_secret_backend_key" "restricted_tokenization" {
  backend          = vault_mount.transit.path
  name             = "gtcx-restricted-tokenization"
  type             = "aes256-gcm96"
  deletion_allowed = false
  exportable       = false
  min_decryption_version = 1
  min_encryption_version = 1
}
```

### Key Rotation Policy

```hcl
resource "vault_generic_endpoint" "pii_key_rotation_config" {
  path = "transit/keys/gtcx-pii-tokenization/config"

  data_json = jsonencode({
    auto_rotate_period = "720h" # 30 days
  })
}
```

### Access Policy

```hcl
resource "vault_policy" "tokenization_service" {
  name = "tokenization-service"

  policy = <<-EOT
    # Encrypt (tokenize)
    path "transit/encrypt/gtcx-pii-tokenization" {
      capabilities = ["update"]
    }

    # Decrypt (detokenize) — separate policy, requires elevated role
    path "transit/decrypt/gtcx-pii-tokenization" {
      capabilities = ["update"]
    }

    # No key export, no key deletion
    path "transit/export/*" {
      capabilities = ["deny"]
    }

    path "transit/keys/gtcx-pii-tokenization/config" {
      capabilities = ["deny"]
    }
  EOT
}

resource "vault_policy" "detokenization_service" {
  name = "detokenization-service"

  policy = <<-EOT
    path "transit/decrypt/gtcx-pii-tokenization" {
      capabilities = ["update"]
    }

    path "transit/decrypt/gtcx-restricted-tokenization" {
      capabilities = ["update"]
    }
  EOT
}
```

---

## API Contract

### POST /v1/tokenize

Tokenizes one or more PII fields in a single request.

**Request**:

```json
{
  "fields": [
    { "name": "email", "value": "user@example.com" },
    { "name": "phone", "value": "+263771234567" },
    { "name": "national_id", "value": "63-123456-A-78" }
  ],
  "context": {
    "subject_id": "usr_abc123",
    "purpose": "kyc_onboarding"
  }
}
```

**Response** (200):

```json
{
  "tokens": [
    { "name": "email", "token": "tkn_xq@gtcx.internal" },
    { "name": "phone", "token": "+263700198432" },
    { "name": "national_id", "token": "63-987654-X-21" }
  ],
  "metadata": {
    "key_version": 3,
    "tokenized_at": "2026-05-08T14:30:00Z"
  }
}
```

**Authorization**: Service-to-service mTLS + Vault AppRole token with `tokenization-service` policy.

### POST /v1/detokenize

Reverses tokenization. Requires elevated authorization and produces an audit record.

**Request**:

```json
{
  "tokens": [{ "name": "email", "token": "tkn_xq@gtcx.internal" }],
  "context": {
    "subject_id": "usr_abc123",
    "purpose": "data_subject_request",
    "ticket": "GTCX-4521",
    "requester": "compliance@gtcx.io"
  }
}
```

**Response** (200):

```json
{
  "fields": [{ "name": "email", "value": "user@example.com" }],
  "audit": {
    "audit_id": "aud_789xyz",
    "detokenized_at": "2026-05-08T14:35:00Z",
    "requester": "compliance@gtcx.io",
    "purpose": "data_subject_request"
  }
}
```

**Authorization**: Service-to-service mTLS + Vault AppRole token with `detokenization-service` policy. The `ticket` field is mandatory — requests without a valid ticket reference are rejected.

### Error Responses

| Code | Condition                                                                    |
| ---- | ---------------------------------------------------------------------------- |
| 400  | Missing required fields or invalid token format                              |
| 401  | Missing or invalid authentication                                            |
| 403  | Caller lacks detokenization policy (tokenize-only callers cannot detokenize) |
| 404  | Token not found in token store                                               |
| 429  | Rate limit exceeded                                                          |
| 500  | Vault unavailable or internal error                                          |

---

## Performance Requirements

| Metric                       | Target                    |
| ---------------------------- | ------------------------- |
| Tokenization latency (p50)   | < 2ms                     |
| Tokenization latency (p99)   | < 5ms                     |
| Detokenization latency (p99) | < 5ms                     |
| Throughput                   | 10,000 ops/sec per node   |
| Availability                 | 99.99% (Vault HA cluster) |

### Deployment Topology

- Vault runs as a 3-node HA cluster with Raft storage
- Tokenization Service runs as a sidecar in the same K8s namespace as the calling service (minimizes network hop)
- Connection pooling to Vault with keep-alive (eliminates TLS handshake per request)
- Local caching of tokenization results is prohibited (tokens are the cache)

---

## Audit Trail

Every tokenization and detokenization operation writes to `gtcx_audit`:

```sql
CREATE TABLE tokenization_audit (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation     TEXT NOT NULL CHECK (operation IN ('tokenize', 'detokenize')),
  field_name    TEXT NOT NULL,
  subject_id    TEXT NOT NULL,
  purpose       TEXT NOT NULL,
  requester     TEXT NOT NULL,
  ticket        TEXT,
  key_version   INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only: no UPDATE or DELETE grants on this table
```

---

## Key Lifecycle

1. **Creation** — Terraform provisions initial key
2. **Rotation** — Auto-rotated every 30 days; old versions retained for decryption
3. **Re-wrapping** — Quarterly batch job re-encrypts all tokens with the latest key version
4. **Destruction** — Only on data subject erasure request, after deletion certificate is issued

---

**Review Cycle**: Quarterly
**Owner**: GTCX Security Team
