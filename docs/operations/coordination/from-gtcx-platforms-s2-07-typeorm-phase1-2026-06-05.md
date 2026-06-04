---
title: 'Inbound — platforms S2-07 TypeORM phase 1 (infra S1-02 drift)'
status: current
date: 2026-06-05
from: gtcx-platforms
owner: gtcx-infrastructure
work_ids: [S1-02, S2-07]
tags: ['coordination', 'inbound', 'typeorm', 'migrations']
---

# Inbound — platforms S2-07 phase 1 complete

**Platforms witness:** [`s2-07-typeorm-shared-migrations-2026-06-05.md`](https://github.com/gtcx-ecosystem/gtcx-platforms/blob/main/docs/audit/s2-07-typeorm-shared-migrations-2026-06-05.md)

## Delivered (entity/migration slice of S1-02)

| Migration                                         | Tables                                        |
| ------------------------------------------------- | --------------------------------------------- |
| `20260605000001-SharedEntitiesStagingParity`      | `outbox`, `idempotency_keys`, `audit_records` |
| `20260605000002-TradepassIdentitiesStagingParity` | `tradepass_identities`                        |

Path: `gtcx-platforms/platforms/shared/src/migrations/` — idempotent `CREATE IF NOT EXISTS`, mirrors staging K8s Jobs.

Run:

```bash
cd platforms/shared
DATABASE_URL=... pnpm migrate:run
```

## Infra resume (S1-02 remaining)

1. Update `infra/docker/init-scripts/postgres/01-schema.sql` with parity DDL.
2. Retire or gate `staging-migrate-shared-entities` / `migrate-tradepass-identities` Jobs once migration runner is wired in deploy.
3. Phase 2 tables (sovereign, `tradepass_credentials`, drift gate) remain **platforms backlog** — do not block infra 01-schema refresh on phase 2.

**Drift report:** `docs/audit/evidence/typeorm-schema-drift-2026-06-05.md`
