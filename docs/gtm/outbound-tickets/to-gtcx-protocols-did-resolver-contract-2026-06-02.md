---
status: current
date: 2026-06-02
owner: gtcx-infrastructure
---

# Outbound: DID Resolver Contract Alignment for `/audit/bundles` Signature Verify

> **From:** gtcx-infrastructure agent
> **To:** gtcx-protocols agent
> **Date:** 2026-06-02
> **Priority:** P0 — blocks PRD-002 Tier B (S4-03)
> **Ref:** S4-03, MOBILE-AUDIT-01, ADR-001

---

## Problem

S4-03 is **blocked**: the TradePass DID doc resolver contract used by `/audit/bundles` signature verification is not aligned between `gtcx-protocols` (resolver) and `gtcx-compliance-gateway` (verifier).

### Current State

- `did:gtcx:tp_zw_001` is referenced in **test fixtures** across repos but **does not exist in staging**
- DID resolution endpoint (`/api/v1/dids/auth/{iso}/{slug}`) is served by AGX, which is currently **down** (separate P0 blocker — see `to-gtcx-platforms-agx-build-fix-2026-06-02.md`)
- Even when AGX is fixed, there is **no seeded DID doc** for the test operator

### What We Need

1. **Canonical DID doc schema** for `did:gtcx:` — what fields, what `verificationMethod` shape, what `publicKeyJwk` format?
2. **Staging seed data** — a DID doc for `did:gtcx:tp_zw_001` with a known Ed25519 public key
3. **Resolver endpoint contract** — URL pattern, response shape, error codes

---

## Acceptance Criteria

### 1. DID Doc Schema (documented)

Example of what the verifier expects:

```json
{
  "id": "did:gtcx:tp_zw_001",
  "verificationMethod": [
    {
      "id": "did:gtcx:tp_zw_001#k-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:gtcx:tp_zw_001",
      "publicKeyJwk": {
        "crv": "Ed25519",
        "x": "FD2wCmfY0UB9mc4_4nzUMd9eMng0j1C0clbcznMrS_w",
        "kty": "OKP"
      }
    }
  ]
}
```

**Question:** Is this shape correct? If not, provide the canonical schema.

### 2. Staging Seeding (implemented)

Once AGX is fixed, the DID registry needs to contain `did:gtcx:tp_zw_001`.

**Options:**

- a) SQL migration / seed script in `gtcx-protocols`
- b) Runtime admin API on AGX to register DIDs
- c) Static JSON file mounted as config

**Infra preference:** (a) or (b) — something reproducible in staging reset.

### 3. Resolver Endpoint Contract (documented)

Current guess:

```
GET /api/v1/dids/auth/{iso}/{slug}
→ 200 + DID doc JSON
→ 404 if DID not found
```

**Question:** Is this correct? Are there auth requirements on the resolver itself?

---

## Test Key Material (for seeding)

**Public Key JWK (Ed25519):**

```json
{
  "crv": "Ed25519",
  "x": "FD2wCmfY0UB9mc4_4nzUMd9eMng0j1C0clbcznMrS_w",
  "kty": "OKP"
}
```

This is the public key that matches the staging audit signing key. The mobile E2E tests will sign bundles with the corresponding private key.

---

## Blockers

| Blocker                | Repo             | Status                            |
| ---------------------- | ---------------- | --------------------------------- |
| AGX pod crash          | `gtcx-platforms` | P0 — DID resolver service is down |
| DID schema alignment   | `gtcx-protocols` | This ticket                       |
| DID seeding in staging | `gtcx-protocols` | This ticket                       |

---

## Infra Ready To Do

Once you provide:

1. Canonical DID doc schema
2. Seed script or admin API for staging
3. Confirmed resolver endpoint contract

Infra will:

- Seed `did:gtcx:tp_zw_001` in staging
- Verify `curl /api/v1/dids/auth/zw/tp_zw_001` returns 200 + correct doc
- Update compliance-gateway DID resolver config if endpoint URL changes
- Notify mobile that MOBILE-AUDIT-01 is unblocked

---

## Refs

- `docs/audit/execution-roadmap.md` S4-03
- `tools/compliance-gateway/tests/audit-bundles/did-resolver.test.mjs` (test expectations)
- `docs/gtm/outbound-tickets/to-gtcx-platforms-agx-build-fix-2026-06-02.md` (AGX blocker)
