# [Project Name] Data Specification

**Document ID**: [DOC-DATA-NNN]
**Version**: {version}
**Date**: {YYYY-MM-DD}
**Status**: [Draft / Approved]

---

## 1. Data Governance

### Data Ownership

| Data Domain        | Owner  | Steward | Classification     |
| ------------------ | ------ | ------- | ------------------ |
| User profiles      | [Team] | [Name]  | Confidential (PII) |
| Content / articles | [Team] | [Name]  | Internal / Public  |
| Analytics events   | [Team] | [Name]  | Internal           |
| [Domain]           | [Team] | [Name]  | [Class]            |

### Data Classification

| Class            | Definition                      | Handling                     |
| ---------------- | ------------------------------- | ---------------------------- |
| **Public**       | Published, freely accessible    | No restrictions              |
| **Subscriber**   | Access-gated content and data   | API-keyed, access-controlled |
| **Internal**     | Operational data, not published | Internal systems only        |
| **Confidential** | PII, financial, credentials     | Encrypted, need-to-know      |

---

## 2. Core Data Entities

### Entity: [Entity Name]

| Field        | Type      | Required | Description   |
| ------------ | --------- | -------- | ------------- |
| `id`         | UUID      | Yes      | Primary key   |
| `created_at` | timestamp | Yes      | UTC timestamp |
| `updated_at` | timestamp | Yes      | UTC timestamp |
| `[field]`    | [type]    | [Yes/No] | [Description] |

**Relationships:**

- Has many [Entity B] (via `[entity_a]_id`)
- Belongs to [Entity C] (via `[entity_c]_id`)

---

## 3. ETL Pipelines

### Pipeline: [Pipeline Name]

| Property        | Value                                       |
| --------------- | ------------------------------------------- |
| **Trigger**     | [Schedule / Event / Manual]                 |
| **Source**      | [System / API / File]                       |
| **Transform**   | [Description of transformation]             |
| **Destination** | [Database / Service]                        |
| **SLA**         | Complete within [N] minutes of trigger      |
| **On failure**  | [Retry N times / Alert / Dead-letter queue] |

```
[Source] → [Extract] → [Validate] → [Transform] → [Load] → [Notify]
```

### Pipeline Dependency Map

```
[Pipeline A] → [Pipeline B]
              ↘ [Pipeline C] → [Pipeline D]
```

---

## 4. Data Quality Standards

| Dimension    | Requirement                            | Validation                                 |
| ------------ | -------------------------------------- | ------------------------------------------ |
| Completeness | Required fields non-null               | Schema validation on insert                |
| Accuracy     | Values within expected range           | Business rule checks                       |
| Timeliness   | Delivered within [N] minutes of SLA    | Pipeline monitoring alert                  |
| Consistency  | No conflicting records for same entity | Uniqueness constraint + reconciliation job |

### Anomaly Detection

- Automated checks run after every pipeline execution
- Thresholds: volume change >[N]%, null rate >[N]%
- Alert sent to [channel] on threshold breach
- Pipeline paused pending human review for critical anomalies

---

## 5. Data Access Patterns

### Read Patterns

| Pattern             | Implementation                   | Cache TTL   |
| ------------------- | -------------------------------- | ----------- |
| Single record by ID | Primary key lookup               | [N] seconds |
| List with filters   | Indexed query + pagination       | [N] seconds |
| Full-text search    | [Elasticsearch / PostgreSQL FTS] | N/A         |
| Aggregations        | Materialized views               | [N] minutes |

### Write Patterns

| Pattern     | Implementation             | Notes                               |
| ----------- | -------------------------- | ----------------------------------- |
| Create      | INSERT with UUID           | Idempotent via unique constraint    |
| Update      | PATCH (partial)            | Optimistic locking via `updated_at` |
| Delete      | Soft delete (`deleted_at`) | Hard delete after [N] days          |
| Bulk import | Batch INSERT via [tool]    | Max [N] records per batch           |

### Caching Strategy

- Application-level cache: Redis, TTL [N] seconds
- Database query cache: [Enabled / Disabled]
- CDN cache: [N] minutes for public content
- Cache invalidation: [Strategy — event-driven / TTL only]

---

## 6. Backup and Recovery

| Component      | Backup Type                     | Frequency  | Retention  | RTO       | RPO      |
| -------------- | ------------------------------- | ---------- | ---------- | --------- | -------- |
| Primary DB     | Continuous WAL + daily snapshot | Continuous | [N] days   | [N] min   | [N] min  |
| Search index   | Daily snapshot                  | Daily      | [N] days   | [N] hours | 24 hours |
| Object storage | Replication                     | Real-time  | Indefinite | [N] min   | 0        |

### Restore Procedure

```bash
# Restore database to point-in-time
[restore command]

# Verify data integrity after restore
[verification query]
```

---

## 7. Data Retention

| Data Type        | Retention Period                | Archive                       | Delete                      |
| ---------------- | ------------------------------- | ----------------------------- | --------------------------- |
| User data        | Duration of account + [N] years | After [N] years               | Permanently after [N] years |
| Analytics events | [N] months                      | After [N] months (aggregated) | Source after [N] months     |
| Audit logs       | [N] years                       | After [N] years               | Permanently after [N] years |
| Content          | Indefinite                      | —                             | Only on explicit request    |

---

_Data is infrastructure. Treat it with the same discipline as code._
