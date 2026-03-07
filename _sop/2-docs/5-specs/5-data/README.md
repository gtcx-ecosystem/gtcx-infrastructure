# Data

Data governance, data dictionary, and ETL pipelines.

## Contents

| File                         | Description                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| [data-spec.md](data-spec.md) | Data governance, entity definitions, ETL pipelines, access patterns, backup, and retention |

## What belongs here

- **Data governance policies** — Ownership, classification, retention, and privacy standards
- **ETL pipeline documentation** — Extract-transform-load workflows, scheduling, and dependencies
- **Data quality standards** — Validation rules, anomaly detection, and reconciliation processes
- **Data access patterns** — Query optimization, caching strategies, and read/write separation
- **Backup and recovery procedures** — Snapshot schedules, restore processes, and disaster recovery

## What does NOT belong here

- **Database schemas** — Table definitions, ERDs, migration files (→ `../../../4-engineering/2-system-design/database-schema.md`)
- **Analytics KPIs** — Business metrics, funnel definitions, reporting dashboards (→ `../../../5-devops/5-analytics/`)
