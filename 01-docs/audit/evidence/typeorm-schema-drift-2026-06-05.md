---
title: 'TypeORM Entity / Schema Drift Report — S1-02'
status: current
date: 2026-06-05
owner: gtcx-infrastructure
source_repos:
  - gtcx-infrastructure/04-ship/docker/init-03-platform/scripts/postgres/01-schema.sql
  - gtcx-platforms/platforms/*/03-platform/src/**/*.entity.ts
---

# TypeORM Entity / Schema Drift Report (S1-02)

**Canonical DDL:** `04-ship/docker/init-03-platform/scripts/postgres/01-schema.sql` (1,050 lines)  
**TypeORM entities:** `gtcx-platforms/platforms/*/03-platform/src/**/*.entity.ts` (40+ entities)  
**Method:** Manual comparison of DDL vs entity decorators  
**Date:** 2026-06-05

---

## Executive Summary

The canonical `01-schema.sql` is **significantly stale**. It claims to be "Auto-generated from 6-platforms TypeORM entities" but is missing **25+ tables** that exist in the current entity codebase, has **conflicting dual definitions** for `tradepass_identities`, and contains **8+ type mismatches** (`simple-json` vs `jsonb`, `simple-array` vs `varchar`).

Staging currently works because missing tables were created via **manual K8s Jobs** (XR-302b, INF-49, etc.). This is not sustainable.

---

## Critical Findings

### 1. Tables Missing from Canonical Schema (25+)

These entities exist in TypeORM but have **zero DDL** in `01-schema.sql`.

| #     | Table                                                                                                                                                                                                                                                                                                                                                         | Entity Path                                                                          | Impact                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------- |
| 1     | `tradepass_identities`                                                                                                                                                                                                                                                                                                                                        | `platforms/shared/03-platform/src/operations/tradepass/tradepass-identity.entity.ts` | **XR-302b root cause**    |
| 2     | `audit_records`                                                                                                                                                                                                                                                                                                                                               | `platforms/shared/03-platform/src/audit/audit-record.entity.ts`                      | Audit logging fails       |
| 3     | `outbox`                                                                                                                                                                                                                                                                                                                                                      | `platforms/shared/03-platform/src/events/outbox.entity.ts`                           | Event outbox crashes      |
| 4     | `idempotency_keys`                                                                                                                                                                                                                                                                                                                                            | `platforms/shared/03-platform/src/resilience/idempotency-key.entity.ts`              | Replay protection fails   |
| 5     | `tradepass_credentials`                                                                                                                                                                                                                                                                                                                                       | `platforms/shared/03-platform/src/operations/tradepass/tradepass.entity.ts`          | Credential issuance fails |
| 6     | `device_keys`                                                                                                                                                                                                                                                                                                                                                 | `platforms/shared/03-platform/src/crypto/device-key.entity.ts`                       | Device auth fails         |
| 7     | `geotag_proofs`                                                                                                                                                                                                                                                                                                                                               | `platforms/shared/03-platform/src/operations/geotag/geotag.entity.ts`                | Geotagging fails          |
| 8     | `geotag_sites`                                                                                                                                                                                                                                                                                                                                                | `platforms/shared/03-platform/src/operations/geotag/geotag-site.entity.ts`           | Site registry fails       |
| 9     | `webhook_subscriptions`                                                                                                                                                                                                                                                                                                                                       | `platforms/shared/03-platform/src/marketplace/webhook-subscription.entity.ts`        | Webhooks fail             |
| 10    | `compliance_rules`                                                                                                                                                                                                                                                                                                                                            | `platforms/shared/03-platform/src/compliance/compliance-rule.entity.ts`              | Compliance engine fails   |
| 11–25 | `sync_items`, `sync_counters`, `market_prices`, `roster_assignments`, `sgx_custody_events`, `sgx_revenue_collections`, `crx_permit_documents`, `crx_inspection_evidence`, `pathways_evidence`, `veritas_screening_decisions`, `veritas_inspections`, `veritas_claims`, `veritas_data_stream_subscriptions`, `veritas_confidence_provenance`, `ops_checklists` | Various `platforms/*/03-platform/src/**/*.entity.ts`                                 | Feature-specific failures |

### 2. Dual Entity Conflict: `tradepass_identities`

Two incompatible entity definitions for the same table:

| Aspect          | Shared Entity (`platforms/shared/03-platform/src/…`)                      | TradePass Entity (`platforms/tradepass/03-platform/src/…`) |
| --------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **PK**          | `did` varchar(256) PK                                                     | `id` UUID PK + `did` unique                                |
| **Base cols**   | `createdAt`, `updatedAt`                                                  | `id`, `createdAt`, `updatedAt`, `deletedAt`                |
| **Soft delete** | No                                                                        | Yes                                                        |
| **Extra cols**  | `kycDocumentType`, `kycDocumentRef`, `kycDocumentStatus`, `kycVerifiedAt` | `idNumber`, `phone`                                        |

**Resolution:** `SHARED_ENTITIES` in `typeorm.config.ts` now uses the shared version. The TradePass-specific entity should be deprecated or aligned.

### 3. Type Mismatches (High)

#### `simple-json` (TEXT) vs `jsonb` (JSONB)

TypeORM `simple-json` serializes to TEXT, not JSONB. Schema uses JSONB.

| Table                  | Column                                                     | Schema  | Entity        | File                            |
| ---------------------- | ---------------------------------------------------------- | ------- | ------------- | ------------------------------- |
| `trace_points`         | `location`, `evidence_ids`, `metadata`                     | `JSONB` | `simple-json` | `tapkit.entity.ts`              |
| `trade_cvs`            | `profile`, `summary`, `derived_metrics`, `attestation_ids` | `JSONB` | `simple-json` | `tradecv.entity.ts`             |
| `jurisdiction_configs` | `premium_tiers`, `pathway_thresholds`                      | `JSONB` | `simple-json` | `jurisdiction-config.entity.ts` |

#### `simple-array` (TEXT) vs `varchar` (VARCHAR)

| Table         | Column                                                                     | Schema    | Entity         | File                       |
| ------------- | -------------------------------------------------------------------------- | --------- | -------------- | -------------------------- |
| `agx_buyers`  | `preferred_commodities`, `accepted_payment_methods`, `accepted_currencies` | `VARCHAR` | `simple-array` | `buyer.entity.ts`          |
| `crx_permits` | `commodity_type_codes`, `activities`, `cadastre_references`                | `VARCHAR` | `simple-array` | `digital-permit.entity.ts` |

### 4. Missing Columns in Schema

| Table                  | Missing in Schema                                                                          | Present in Entity | File                            |
| ---------------------- | ------------------------------------------------------------------------------------------ | ----------------- | ------------------------------- |
| `agx_listings`         | `tenant_id`, `crx_permit_id`, `vault_mark_custody_proof_id`                                | Yes               | `listing.entity.ts`             |
| `agx_trades`           | `tenant_id`, `previous_status`                                                             | Yes               | `trade.entity.ts`               |
| `agx_buyers`           | `tenant_id`                                                                                | Yes               | `buyer.entity.ts`               |
| `jurisdiction_configs` | `gci_enforcement_mode`, `default_unit_price_cents`, `gci_weights`, `clearance_authorities` | Yes               | `jurisdiction-config.entity.ts` |
| `veritas_attestations` | `screening_decision_id`, `screening_risk_level`, `batch_id`                                | Yes               | `attestation.entity.ts`         |

### 5. Foreign Key Mismatches (Medium)

| Table         | Schema (DDL)                                                 | Entity (TypeORM)              |
| ------------- | ------------------------------------------------------------ | ----------------------------- |
| `agx_trades`  | `buyer_id UUID REFERENCES agx_buyers(id)`                    | `buyerId` string, no FK       |
| `agx_trades`  | `listing_id UUID REFERENCES agx_listings(id)`                | `listingId` string, no FK     |
| `crx_permits` | `application_id UUID REFERENCES crx_permit_applications(id)` | `applicationId` string, no FK |

---

## Staging Remediation Status

| Table                  | Staging Status | How it was fixed                                 |
| ---------------------- | -------------- | ------------------------------------------------ |
| `tradepass_identities` | ✅ Exists      | K8s Job `migrate-tradepass-identities` (XR-302b) |
| `audit_records`        | ✅ Exists      | K8s Job `migrate-shared-entities`                |
| `outbox`               | ✅ Exists      | K8s Job `migrate-shared-entities`                |
| `idempotency_keys`     | ✅ Exists      | K8s Job `migrate-shared-entities`                |
| Other missing tables   | ❌ Unknown     | Not verified                                     |

---

## Remediation Log

### 2026-06-05 — Phase 1 Complete (infra)

- [x] `tradepass_identities`, `audit_records`, `outbox`, `idempotency_keys` added to `01-schema.sql`
- [x] K8s Jobs `migrate-shared-entities`, `migrate-tradepass-identities`, `migrate-audit-records` annotated as deprecated (idempotent safety net until TypeORM migration runner is wired)
- [x] Jobs moved to `04-ship/kubernetes/jobs/archive/` — no longer active manifests

### Remaining (Phase 2 — platforms backlog)

Per coordination doc `from-gtcx-platforms-s2-07-typeorm-phase1-2026-06-05.md`:

- `tradepass_credentials`, `device_keys`, `geotag_proofs`, `geotag_sites`, `webhook_subscriptions`, `compliance_rules`, and 15+ additional tables remain **platforms backlog** (S2-07 phase 2). Infra does not block on these.

## Recommended Actions

### Immediate (S1-02) — DONE

1. ~~Add missing critical tables to `01-schema.sql`~~ ✅
2. ~~Retire/gate K8s Jobs~~ ✅

### Short-term (Sprint 2)

3. Resolve `tradepass_identities` dual entity conflict
4. Fix `simple-json` → `jsonb` where JSONB operators are needed
5. Fix `simple-array` → `varchar` or align schema to `TEXT`
6. Add missing columns (`tenant_id`, etc.) to schema or remove from entities

### Long-term

7. Automate schema generation in CI — run `typeorm schema:sync --dry-run` and fail on drift
8. Remove manual K8s Job pattern for schema migrations

---

## Evidence

- This report: `01-docs/05-audit/evidence/typeorm-schema-drift-2026-06-05.md`
- Canonical schema: `04-ship/docker/init-03-platform/scripts/postgres/01-schema.sql`
- Entities: `gtcx-platforms/platforms/*/03-platform/src/**/*.entity.ts`
- Staging migration jobs (archived): `04-ship/kubernetes/jobs/archive/staging-migrate-*.yaml`
