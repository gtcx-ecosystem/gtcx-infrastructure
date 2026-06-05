# Archived K8s Migration Jobs

**Status:** Deprecated and archived 2026-06-05  
**Reason:** Tables now created by `01-schema.sql` init script (S1-02 phase 1).  
**Retention:** Kept until TypeORM migration runner is wired in deploy (phase 2).

## Jobs

| File                                        | Original Purpose                | Tables Created                                |
| ------------------------------------------- | ------------------------------- | --------------------------------------------- |
| `staging-migrate-audit.yaml`                | Create audit schema             | `audit_records`                               |
| `staging-migrate-shared-entities.yaml`      | Create shared platform tables   | `audit_records`, `outbox`, `idempotency_keys` |
| `staging-migrate-tradepass-identities.yaml` | Create TradePass identity table | `tradepass_identities`                        |

## History

These Jobs were created as ad-hoc remediation for XR-302 (AGX staging deployment)
when the staging database lacked tables that the platforms code expected.
They were annotated as deprecated on 2026-06-05 once the tables were added
to `04-ship/docker/init-03-platform/scripts/postgres/01-schema.sql`.

## When to delete

Delete this directory when:

1. gtcx-platforms ships a TypeORM migration runner in deploy (S2-07 phase 2), OR
2. All staging environments have been rebuilt from `01-schema.sql` and no longer need the safety net.
