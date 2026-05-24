---
title: 'ADR-015: Per-Tenant JetStream Subject Routing'
status: 'accepted'
date: '2026-05-22'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['architecture', 'audit', 'tenancy', 'messaging']
review_cycle: 'on-change'
---

# ADR-015: Per-Tenant JetStream Subject Routing

## Status

Accepted

## Date

2026-05-22

## Context

GTCX moves from single-tenant pilot to multi-tenant pilot in Sprint 5 (May 2026). Audit records must be cleanly separable per tenant so that:

1. An auditor for tenant A can request and verify exactly tenant A's chain, without ever touching tenant B's data
2. Per-tenant cost metering is unambiguous
3. Tenant decommissioning revokes future access without affecting historical evidence (WORM bucket preserves history per FATF 7-year retention)
4. Cross-tenant data leakage in transport is structurally impossible, not just policy-enforced

The signed audit record itself does NOT carry tenantId in a verifiable field — `createRecord` from `@gtcx/audit-signer` strips raw payload to a hash. Tenant routing must therefore live at a layer the auditor can inspect: the NATS subject.

## Decision

The compliance-gateway publishes signed audit records to JetStream subjects of the form:

```
gtcx.audit.<service>.<tenantId>
```

Where `<service>` is the publishing service (`compliance-gateway` today, expandable later) and `<tenantId>` is the tenant identifier from the authenticated principal. The audit-flush sidecar consumes the `gtcx.audit.>` wildcard, extracts `<tenantId>` from the subject's last segment, and writes WORM S3 objects under `tenant=<tenantId>/yyyy/MM/dd/HH/<chainHash>.ndjson`.

## Alternatives Considered

| Option                                    | Pros                                                 | Cons                                                                             |
| ----------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| Single stream + tenant filter on consumer | Simpler stream config; one stream serves all tenants | Tenant isolation depends on consumer logic, not structural; a buggy filter leaks |
| One JetStream stream per tenant           | Maximum isolation                                    | O(N) streams; quota explosion at 50+ tenants; operational overhead               |
| Tenant in record body                     | Verifiable cryptographically                         | Payload is hashed-only in signed records; conflicts with chain semantics         |
| **Per-tenant subject**                    | Structural routing; one stream; auditor-inspectable  | Subject name format becomes a contract that must be documented                   |

## Consequences

**Positive:**

- Auditor can request `nats sub 'gtcx.audit.compliance-gateway.acme-corp.>'` and see only their tenant's records
- WORM bucket prefix is per-tenant; lifecycle policies can differ per tenant if FATF mappings require
- One stream `gtcx-audit` covers all tenants — single quota, single retention policy at broker
- Audit-flush sidecar code path is uniform; tenant extraction is one `subject.split('.')` call
- NATS subject ACLs (per-account auth) can lock down cross-tenant subscription at the broker layer

**Negative:**

- Subject format is now a load-bearing contract. Changing it requires coordinated gateway + sidecar deploy + auditor notification
- Tenant code must match the kebab-case regex `^[a-z0-9-]+$`; underscores in legacy `terraform-aws-compliance-db` jurisdiction codes (e.g. `south_africa`) are converted at the auth-layer if a tenant uses a jurisdiction name as its ID

**Neutral:**

- Subject names appear in NATS monitoring and Prometheus exposition (`compliance_gateway_audit_records_total{...}`) — operators see tenant codes in dashboards. This is intentional for observability; it's not PII

## References

- ADR-014 — NATS JetStream as the audit record transport
- ADR-008 — Dual-database architecture (parallel tenant-isolation reasoning)
- `tools/audit-flush/src/index.mjs` — `tenantFromSubject` implementation
- `tools/compliance-gateway/src/audit-sink.mjs` — gateway-side subject construction
- `docs/operations/runbooks/tenant-onboarding.md` — operator-facing convention
