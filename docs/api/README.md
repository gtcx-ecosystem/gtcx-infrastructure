---
title: 'API — GTCX Compliance Gateway'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['api', 'openapi', 'compliance-gateway', 'reference', 'external']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# API — GTCX Compliance Gateway

> **Audience:** External integrators, partner-team engineers, AI agent runtimes, regulator-facing tooling.
> **Canonical machine-readable spec:** [`openapi.yaml`](./openapi.yaml) — OpenAPI 3.1.

## Scope

The compliance-gateway HTTP API is the substrate's primary surface for consumers — both internal (sibling repos in the GTCX ecosystem) and external (partners, regulators, AI agents). This folder is the canonical home for the machine-readable spec.

## Endpoints overview

| Endpoint                    | Method | Auth                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------- | ------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/health`                   | GET    | None                      | Liveness + signing-key health for the gateway pod                                                                                                                                                                                                                                                                                                                                         |
| `/v1/query`                 | POST   | Bearer                    | Natural-language compliance query routed to LLM providers + protocol tools                                                                                                                                                                                                                                                                                                                |
| `/v1/audit/chain`           | GET    | Bearer (`audit:read`)     | Current in-memory audit-chain state + checkpoint hash                                                                                                                                                                                                                                                                                                                                     |
| `/v1/audit/verify`          | POST   | Bearer (`audit:read`)     | Verify a posted NDJSON chain offline-style                                                                                                                                                                                                                                                                                                                                                |
| `/v1/audit/evidence-bundle` | GET    | Bearer (`audit:read`)     | Per-tenant evidence bundle export, optionally bounded by `since`                                                                                                                                                                                                                                                                                                                          |
| `/v1/budget`                | GET    | Bearer (`query:read`)     | Per-principal QPS + daily USD budget remaining                                                                                                                                                                                                                                                                                                                                            |
| `/v1/brief`                 | GET    | Bearer (`query:read`)     | Operator-facing brief: chain state + spend + signing posture + narrative                                                                                                                                                                                                                                                                                                                  |
| `/v1/tools`                 | GET    | Bearer (`tools:read`)     | List of available protocol tools, filtered by caller's access profile                                                                                                                                                                                                                                                                                                                     |
| `/v1/providers`             | GET    | Bearer (`providers:read`) | List of available LLM providers + routing tier mapping                                                                                                                                                                                                                                                                                                                                    |
| `/metrics`                  | GET    | None                      | Prometheus exposition format                                                                                                                                                                                                                                                                                                                                                              |
| `/audit/bundles`            | POST   | Signed-edge               | Mobile bundle ingest endpoint (per [`gtcx-mobile/packages/agents/src/transport-contract.ts`](https://github.com/gtcx-ecosystem/gtcx-mobile/blob/main/packages/agents/src/transport-contract.ts)). **Feature-flagged behind `AUDIT_BUNDLES_ENABLED=1`**. Implementation on `feat/audit-bundles-verifier` branch — PR [#56](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/56). |
| `/audit/query`              | POST   | Bearer                    | Portal + regulator query against ingested audit events (per [`gtcx-mobile/apps/web/portal/lib/audit-client.ts`](https://github.com/gtcx-ecosystem/gtcx-mobile/blob/main/apps/web/portal/lib/audit-client.ts)). **Feature-flagged behind `AUDIT_QUERY_ENABLED=1`**. Implementation on `feat/audit-query` branch — PR [#58](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/58). |

## Authentication

Two distinct auth modes coexist on the gateway:

| Mode            | Where used                                                       | Headers                                                                                                                                                      |
| --------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Bearer**      | All `/v1/*` endpoints + `/health` (unauth) + `/metrics` (unauth) | `Authorization: Bearer <token>`                                                                                                                              |
| **Signed-edge** | `/audit/bundles` (mobile contract)                               | 9-field signed envelope per [`docs/operations/runbooks/audit-signing-key-rotation.md`](../operations/runbooks/audit-signing-key-rotation.md) §canonical form |

Bearer-token permissions follow the principal model:

- `query:read` — can call `/v1/query`, `/v1/budget`, `/v1/brief`
- `audit:read` — can call `/v1/audit/chain`, `/v1/audit/verify`, `/v1/audit/evidence-bundle`
- `tools:read` — can call `/v1/tools`
- `providers:read` — can call `/v1/providers`

A token may carry multiple permissions. Token issuance and rotation: see [`../security/credential-rotation-log.md`](../security/credential-rotation-log.md).

## Error responses

All error responses follow the same shape:

```json
{
  "error": "human-readable-or-machine-tag",
  "fieldErrors": { "...": "..." } // optional, only on 400 Zod failures
}
```

Standard codes:

| Code | Meaning               | Common causes                                                  |
| ---- | --------------------- | -------------------------------------------------------------- |
| 200  | OK                    | Success                                                        |
| 400  | Bad Request           | Zod validation failure, malformed body, malformed query string |
| 401  | Unauthorized          | Missing / invalid bearer token                                 |
| 403  | Forbidden             | Token valid but lacks required permission                      |
| 405  | Method Not Allowed    | Wrong HTTP method for the route                                |
| 409  | Conflict              | Nonce replayed (mobile `/audit/bundles` only)                  |
| 429  | Too Many Requests     | Per-principal QPS exceeded; `Retry-After` header set           |
| 500  | Internal Server Error | Unexpected; check `/health` + logs                             |
| 502  | Bad Gateway           | All LLM providers failed (only on `/v1/query`)                 |
| 503  | Service Unavailable   | Gateway production-fail-closed: audit signer not configured    |

## Versioning

- **Stable surface:** `/v1/*` endpoints. Breaking changes ship as new versioned paths (`/v2/*`), not as `/v1/*` modifications.
- **Experimental surface:** Endpoints without a version prefix (`/audit/bundles`, `/health`, `/metrics`) follow the substrate's deploy cadence; non-breaking changes ship at any time.

The canonical OpenAPI spec carries version metadata under `info.version` in `openapi.yaml`.

## OpenAPI spec coverage

The [`openapi.yaml`](./openapi.yaml) covers all 12 documented endpoints (full request / response / error schemas), including the two mobile-contract endpoints: `/audit/bundles` (PR [#56](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/56), `feat/audit-bundles-verifier`) and `/audit/query` (PR [#58](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/58), `feat/audit-query`). Both are documented even though their implementations live on feature branches; with the feature flags off (`AUDIT_BUNDLES_ENABLED`, `AUDIT_QUERY_ENABLED`) the endpoints return 404 (default route), and the spec documents the active-flag behavior.

The pluggable store architecture backing `/audit/query` is documented in [ADR-022](../architecture/decisions/ADR-022-pluggable-audit-query-store.md).

## What's NOT in this API

The gateway intentionally does **not** expose:

- Tenant management (out of scope; provisioned via Terraform + onboarding runbook)
- Direct database access (audit/operational DBs are server-only)
- Cryptographic-key material (KMS-managed, not exposed via API)
- LLM provider credentials (server-only)

## Related documents

- [`openapi.yaml`](./openapi.yaml) — canonical spec
- [`../architecture/system-overview.md`](../architecture/system-overview.md) — system architecture
- [`../architecture/compliance-substrate-deep-dive.md`](../architecture/compliance-substrate-deep-dive.md) — long-form architecture + failure modes
- [`../operations/runbooks/deploy.md`](../operations/runbooks/deploy.md) — deployment runbook
- [`../security/threat-model-2026-05.md`](../security/threat-model-2026-05.md) — STRIDE coverage of API surface
- Source: [`tools/compliance-gateway/src/server.mjs`](../../tools/compliance-gateway/src/server.mjs)
