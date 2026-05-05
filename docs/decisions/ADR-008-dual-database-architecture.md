# ADR-008: Separate operational and audit databases

## Status

Accepted

## Context

GTCX operates under regulatory frameworks (FATF, IFC ESG, jurisdiction-specific mining regulations) that require an immutable audit trail. Audit data must not be accidentally modified or deleted, and must have independent retention policies from operational data.

Mixing operational and audit data in a single database creates risk: a migration error, accidental DELETE, or compromised credential could destroy compliance evidence.

## Decision

Deploy two separate RDS PostgreSQL instances per environment:

1. **Operational database** -- mutable, standard CRUD operations, application state
2. **Audit database** -- append-only, `deletion_protection=true`, extended backup retention (30+ days), restricted write access

The audit database accepts inserts only. No UPDATE or DELETE permissions are granted to application service accounts.

## Rationale

- **Immutability guarantee** -- audit data cannot be accidentally modified or deleted by application code
- **Independent backup retention** -- audit data retains 30+ day backups; operational data uses shorter cycles
- **Independent scaling** -- audit writes are append-only and can use a smaller instance class with high storage
- **Blast radius containment** -- a compromised operational credential cannot touch audit data
- **Regulatory alignment** -- auditors can verify the audit database has deletion protection enabled at the infrastructure level

## Consequences

- **Higher cost** -- two RDS instances per environment instead of one
- **No cross-database queries** -- application code must join data in memory or use separate queries
- **Deployment complexity** -- migrations must target the correct database; audit schema changes require careful coordination
- **Connection management** -- services connecting to both databases consume twice the connection pool budget
