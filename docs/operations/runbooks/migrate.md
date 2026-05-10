# Migration Runbook — gtcx-infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Process for running database migrations using `./infra/scripts/migrate.sh`.

**Hard rule**: A migration that has run in any environment is immutable. Never modify it — write a forward migration instead.

---

## Two-Database Architecture

Always confirm the target database before running any migration command:

| Database    | DB Name              | Port | User               | Purpose                    |
| ----------- | -------------------- | ---- | ------------------ | -------------------------- |
| Operational | `gtcx_{environment}` | 5432 | `gtcx_admin`       | All application read/write |
| Audit       | `gtcx_{env}_audit`   | 5433 | `gtcx_audit_admin` | Append-only audit events   |

Never cross-write between these two databases. The audit database accepts no `UPDATE`, `DELETE`, or `DROP`. Any migration touching the audit schema must be reviewed by the Database & Migration Lead before running.

---

## Pre-flight Checklist

Before running any migration against staging or production:

- [ ] Confirm target environment and target database (operational vs. audit)
- [ ] Run `python infra/migrations/scripts/check_docs.py` — fix all warnings
- [ ] Review the migration file — confirm it is forward-only (no `DROP`, no destructive changes unless explicitly approved)
- [ ] Confirm a rollback path exists — document it before running
- [ ] For staging/production: obtain explicit human approval
- [ ] For production: confirm no active deployment is in progress

---

## Environments

| Environment   | Autonomous | Approval Required |
| ------------- | ---------- | ----------------- |
| `development` | Yes        | No                |
| `staging`     | No         | Yes               |
| `production`  | No         | Yes               |

---

## Running Migrations

### Dry-run (always run first for staging/production)

```bash
./infra/scripts/migrate.sh staging --dry-run
./infra/scripts/migrate.sh production --dry-run
```

Dry-run shows pending migration status via `rails db:migrate:status` without applying anything.

### Development (autonomous)

```bash
./infra/scripts/migrate.sh development
```

No confirmation prompt. Runs `bundle exec rails db:migrate` with `RAILS_ENV=development`.

### Staging (requires approval)

```bash
# After obtaining human approval:
./infra/scripts/migrate.sh staging
```

No `--force` flag required for staging — the script will not prompt for staging. Requires human approval before running per `safety-rules.md`.

### Production (requires approval + confirmation)

```bash
# After obtaining human approval:
./infra/scripts/migrate.sh production
```

Production prompts: `Type 'yes' to confirm`. If `--force` is passed, this prompt is skipped — **never use `--force` for production**.

---

## Migration Execution Sequence

The script runs these steps:

### 1. Environment Validation

Resolves aliases (`prod` → `production`, `stg` → `staging`). Fails on unrecognized environment.

### 2. Pre-flight Checks

- Verifies `Gemfile` exists in the project root
- Production (without `--force`): prompts `Type 'yes' to confirm`

### 3. Migration Check

Runs `bundle exec rails db:migrate:status` and counts pending (`down`) migrations. If count is 0, exits with success — no migrations needed.

### 4. Migration Execution

Runs `bundle exec rails db:migrate` with the target `RAILS_ENV`. Logs current schema version via `bundle exec rails db:version`.

### 5. Audit Constraints Verification

Runs `setup_audit_constraints` — verifies the append-only constraints on the audit database are in place. If the dry-run flag is set, logs what would be done without running.

---

## Rollback

**Production rollbacks require manual approval — the script refuses them:**

```
Production rollbacks require manual approval
Use: RAILS_ENV=production bundle exec rails db:rollback
```

For staging:

```bash
# The script supports rollback for non-production only
RAILS_ENV=staging bundle exec rails db:rollback
```

Document the rollback action: which migration was undone, why, and what the new schema version is.

---

## Writing New Migrations

When authoring a new migration file:

1. Place it in `infra/migrations/` following the existing naming convention
2. Add a header comment documenting: what it does, the rollback path, and which database it targets
3. Run `python infra/migrations/scripts/check_docs.py` — fix all warnings before proposing for review
4. Run `python infra/migrations/scripts/generate_docs.py` to update migration documentation
5. Test against development before requesting staging approval

### Migration constraints for the audit database

Any migration touching the audit schema (`gtcx_{env}_audit`) must:

- Never add `UPDATE` or `DELETE` permissions to any role
- Never add an index that could be used to facilitate bulk deletion
- Be reviewed by the Database & Migration Lead before running anywhere

---

## Flags Reference

| Flag        | Effect                                                        |
| ----------- | ------------------------------------------------------------- |
| `--dry-run` | Show pending migration status without applying                |
| `--force`   | Skip production confirmation prompt — never use in production |

---

## Escalation Triggers

Escalate to human review immediately if:

- A migration fails against staging or production — do not retry without investigation
- A migration ran against the wrong database (operational vs. audit cross-write)
- `check_docs.py` reports errors that cannot be resolved without modifying an applied migration

---

## Reference

- [`infra/scripts/migrate.sh`](../../../infra/scripts/migrate.sh) — migration runner
- `infra/migrations/config/` — per-environment configs
- [`infra/migrations/scripts/check_docs.py`](../../../infra/migrations/scripts/check_docs.py) — validation
- [`docs/agents/safety-rules.md`](../../agents/workflows/agent-safety-rules.md) — authority tiers
- [`docs/architecture/system-overview.md`](../../architecture/system-overview.md) — two-database architecture
