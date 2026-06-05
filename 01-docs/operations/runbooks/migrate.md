---
title: 'Migration Runbook — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['compliance', 'architecture', 'infrastructure', 'frontend', 'backend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Migration Runbook — gtcx-infrastructure

Process for running SQL database migrations with `./04-ship/03-platform/scripts/migrate.sh`.

**Hard rule:** A migration that has run in any environment is immutable. Never modify an applied file. Write a forward migration instead.

---

## Two-Database Architecture

Always confirm which database you are targeting before you run anything:

| Database    | Purpose                    | Required URL                |
| ----------- | -------------------------- | --------------------------- |
| Operational | Application read/write     | `DATABASE_URL`              |
| Audit       | Append-only audit evidence | `AUDIT_DATABASE_URL`        |
| AuditWriter | Live negative DML probe    | `AUDIT_WRITER_DATABASE_URL` |

Never cross-write between operational and audit data paths. The audit database must remain append-only for writer roles.

---

## Pre-flight Checklist

Before running migrations against staging or production:

- [ ] Confirm target environment and target database
- [ ] Export `DATABASE_URL`, `AUDIT_DATABASE_URL`, and `AUDIT_WRITER_DATABASE_URL`
- [ ] Run `python 04-ship/migrations/03-platform/scripts/check_docs.py` and clear warnings
- [ ] Review the migration file and confirm it is forward-only
- [ ] Confirm a rollback or compensating migration path exists
- [ ] Obtain explicit human approval
- [ ] Confirm no other deployment or migration is in progress

---

## Environments

| Environment   | Autonomous | Approval Required |
| ------------- | ---------- | ----------------- |
| `development` | Yes        | No                |
| `staging`     | No         | Yes               |
| `production`  | No         | Yes               |

---

## Running Migrations

### Dry-run

Always run dry-run first for staging or production:

```bash
./04-ship/03-platform/scripts/migrate.sh staging --dry-run
./04-ship/03-platform/scripts/migrate.sh production --dry-run
```

Dry-run still performs connectivity checks and audit immutability verification. It does not apply SQL files.

### Development

```bash
./04-ship/03-platform/scripts/migrate.sh development
```

Development runs autonomously. If audit DSNs are set, the script also verifies audit immutability.

### Staging

```bash
./04-ship/03-platform/scripts/migrate.sh staging
```

Requires prior human approval. The script does not prompt interactively for staging.

### Production

```bash
./04-ship/03-platform/scripts/migrate.sh production
```

Requires prior human approval and an interactive `yes` confirmation unless `--force` is used. Do not use `--force` in production.

---

## Execution Sequence

The script runs these steps:

### 1. Environment Validation

Resolves aliases such as `dev`, `stg`, and `prod`. Fails on unrecognized values.

### 2. Pre-flight Checks

- Verifies `psql` is installed
- Verifies `DATABASE_URL` is set and reachable
- Verifies the SQL migration directory exists and contains `.sql` files
- Prompts for confirmation in production unless `--force` is used

### 3. Migration Tracking

Creates `schema_migrations` if needed, computes a checksum for each SQL file, and identifies pending files by filename.

### 4. Migration Execution

Applies each pending SQL file with `psql` and records filename, checksum, timestamp, and environment in `schema_migrations`.

### 5. Audit Constraints Verification

Runs `setup_audit_constraints` after migration scanning:

- Verifies `gtcx_audit_writer` exists
- Verifies the audit database contains non-system tables
- Fails if `gtcx_audit_writer` has `UPDATE` or `DELETE`
- Fails if `PUBLIC` has `UPDATE` or `DELETE`
- Fails if `gtcx_audit_writer` is missing `INSERT`
- Runs a live negative `UPDATE` and `DELETE` probe as the audit writer

Outside development, both `AUDIT_DATABASE_URL` and `AUDIT_WRITER_DATABASE_URL` are mandatory.

---

## Rollback

Do not mutate or edit an applied migration file. Recover with a forward compensating migration.

Examples:

```bash
./04-ship/03-platform/scripts/migrate.sh production --dry-run
psql "$DATABASE_URL" -f path/to/forward-fix.sql
```

Document the recovery action: what failed, which compensating migration ran, and the resulting schema state.

---

## Writing New Migrations

When authoring a new migration file:

1. Place it in `04-ship/docker/init-03-platform/scripts/postgres/` using the existing ordering convention.
2. Add a header comment describing purpose, target database, and recovery path.
3. Run `python 04-ship/migrations/03-platform/scripts/check_docs.py`.
4. Run `python 04-ship/migrations/03-platform/scripts/generate_docs.py`.
5. Test against development before requesting staging approval.
6. If the audit schema or grants change, run `bash 04-ship/03-platform/scripts/test-audit-immutability.sh`.

### Audit migration constraints

Any migration touching audit schema or audit grants must:

- Preserve append-only semantics for writer roles
- Avoid introducing `UPDATE` or `DELETE` privileges
- Avoid destructive cleanup shortcuts
- Be reviewed by the Database & Migration Lead before running anywhere

---

## Flags Reference

| Flag        | Effect                                                        |
| ----------- | ------------------------------------------------------------- |
| `--dry-run` | Show pending migration status without applying schema changes |
| `--force`   | Skip production confirmation prompt — never use in production |

---

## Escalation Triggers

Escalate to human review immediately if:

- A staging or production migration fails
- The wrong database target was used
- Audit immutability verification fails
- `check_docs.py` reports an issue that would require modifying an applied migration

---

## Reference

- [`04-ship/03-platform/scripts/migrate.sh`](../../../04-ship/03-platform/scripts/migrate.sh) — migration runner
- [`04-ship/03-platform/scripts/test-audit-immutability.sh`](../../../04-ship/03-platform/scripts/test-audit-immutability.sh) — live audit immutability fixture
- [`04-ship/migrations/03-platform/scripts/check_docs.py`](../../../03-platform/tools/03-platform/scripts/check_docs.py) — migration doc validation
- [`01-docs/01-agents/workflows/agent-safety-rules.md`](../../agents/workflows/agent-safety-rules.md) — authority tiers
- [`01-docs/architecture/system-overview.md`](../../architecture/system-overview.md) — system overview
