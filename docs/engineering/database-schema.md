# Database Schema — {Project Name}

**Database type:** {PostgreSQL / MongoDB / DynamoDB / MySQL}
**Version:** {version}
**ORM / query layer:** {Prisma / TypeORM / SQLAlchemy / raw SQL}
**Last updated:** {YYYY-MM-DD}

---

## Schema Architecture

### Database selection rationale

```yaml
Requirements:
  data_structure: Relational / Document / Key-Value
  consistency: ACID / BASE / Eventual
  scale: Vertical / Horizontal
  access_pattern: Read-heavy / Write-heavy / Balanced

Choice: { database type }
Reason: { justification }
```

---

## Entity Relationship Diagram

```mermaid
erDiagram
    {ENTITY_A} ||--o{ {ENTITY_B} : creates
    {ENTITY_A} ||--o{ {ENTITY_C} : owns
    {ENTITY_C} ||--o{ {ENTITY_B} : processes
    {ENTITY_B} ||--o{ AUDIT_LOG : generates

    {ENTITY_A} {
        uuid id PK
        string identifier UK
        string name
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }

    {ENTITY_C} {
        uuid id PK
        uuid entity_a_id FK
        string type
        decimal amount
        enum status
        timestamp created_at
    }

    {ENTITY_B} {
        uuid id PK
        uuid entity_c_id FK
        uuid entity_a_id FK
        decimal amount
        enum type
        enum status
        jsonb context
        timestamp created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid entity_id FK
        string action
        jsonb changes
        timestamp created_at
    }
```

---

## Table Definitions

### Core tables

#### {entity_a}

```sql
CREATE TABLE {entity_a} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_{entity_a}_identifier ON {entity_a}(identifier);
CREATE INDEX idx_{entity_a}_status ON {entity_a}(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_{entity_a}_created_at ON {entity_a}(created_at DESC);
CREATE INDEX idx_{entity_a}_metadata ON {entity_a} USING GIN(metadata);
```

#### {entity_c}

```sql
CREATE TABLE {entity_c} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a_id UUID NOT NULL REFERENCES {entity_a}(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    amount DECIMAL(19,8) DEFAULT 0,
    locked_amount DECIMAL(19,8) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_amount CHECK (amount >= 0),
    CONSTRAINT chk_locked CHECK (locked_amount >= 0)
);

CREATE INDEX idx_{entity_c}_entity_a ON {entity_c}(entity_a_id);
CREATE INDEX idx_{entity_c}_type ON {entity_c}(type);
CREATE INDEX idx_{entity_c}_status ON {entity_c}(status);
```

#### {entity_b}

```sql
CREATE TABLE {entity_b} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hash VARCHAR(255) UNIQUE,
    from_id UUID REFERENCES {entity_c}(id),
    to_id UUID REFERENCES {entity_c}(id),
    amount DECIMAL(19,8) NOT NULL,
    fee DECIMAL(19,8) DEFAULT 0,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    context JSONB DEFAULT '{}',
    error_message TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_amount CHECK (amount > 0),
    CONSTRAINT chk_fee CHECK (fee >= 0)
);

CREATE INDEX idx_{entity_b}_from ON {entity_b}(from_id);
CREATE INDEX idx_{entity_b}_to ON {entity_b}(to_id);
CREATE INDEX idx_{entity_b}_status ON {entity_b}(status);
CREATE INDEX idx_{entity_b}_type ON {entity_b}(type);
CREATE INDEX idx_{entity_b}_created ON {entity_b}(created_at DESC);
```

---

## Security Tables

### audit_logs

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES {entity_a}(id),
    ip_address INET,
    user_agent TEXT,
    changes JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- Partition by month for high-volume audit tables
CREATE TABLE audit_logs_{YYYY}_{MM} PARTITION OF audit_logs
    FOR VALUES FROM ('{YYYY-MM-01}') TO ('{YYYY-MM+1-01}');
```

### sessions

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a_id UUID NOT NULL REFERENCES {entity_a}(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_entity ON sessions(entity_a_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at) WHERE revoked_at IS NULL;
```

---

## Performance Optimization

### Indexing strategy

```yaml
Primary_Keys:
  - UUID for distributed systems
  - BIGSERIAL for single-instance high-throughput writes

Index_Types:
  Foreign_Keys: Always index
  Query_Filters: Index columns in WHERE clauses
  Sort_Columns: Index columns in ORDER BY
  Composite: For multi-column frequent queries
  Partial: For filtered subsets (e.g., WHERE deleted_at IS NULL)
  GIN/GIST: For JSONB and full-text search
```

### Partitioning strategy

```sql
-- Time-based partitioning for large event/log tables
CREATE TABLE {entity_b}_{YYYY} PARTITION OF {entity_b}
    FOR VALUES FROM ('{YYYY-01-01}') TO ('{YYYY+1-01-01}')
    PARTITION BY RANGE (created_at);

-- List partitioning by status
CREATE TABLE {entity_b}_pending PARTITION OF {entity_b}
    FOR VALUES IN ('pending', 'processing');
```

---

## Migration Strategy

### File structure

```
migrations/
├── 001_initial_schema.sql
├── 002_add_{entity_c}.sql
├── 003_add_{entity_b}.sql
├── 004_add_indexes.sql
├── 005_add_audit_logs.sql
└── rollback/
    ├── 001_rollback.sql
    └── ...
```

### Migration template

```sql
-- Migration: {NNN}_{description}.sql
-- Author: {name}
-- Date: {YYYY-MM-DD}
-- Description: {what this migration does}

BEGIN;

CREATE TABLE IF NOT EXISTS {new_table} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_a_id UUID NOT NULL REFERENCES {entity_a}(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_{new_table}_entity UNIQUE (entity_a_id)
);

CREATE INDEX idx_{new_table}_entity ON {new_table}(entity_a_id);

COMMENT ON TABLE {new_table} IS '{human-readable description}';
COMMENT ON COLUMN {new_table}.data IS '{column description}';

COMMIT;

-- Rollback:
-- DROP TABLE IF EXISTS {new_table} CASCADE;
```

---

## NoSQL Schema (MongoDB example)

### Collections design

```javascript
// {entity_a} collection
{
  "_id": ObjectId("..."),
  "identifier": "user@example.com",
  "profile": {
    "name": "{name}",
    "phone": "{phone}"
  },
  "related": [
    {
      "id": "{id}",
      "type": "{type}",
      "amount": NumberDecimal("0.00")
    }
  ],
  "metadata": {},
  "createdAt": ISODate("..."),
  "updatedAt": ISODate("...")
}

// {entity_b} collection
{
  "_id": ObjectId("..."),
  "hash": "{hash}",
  "from": { "entityId": ObjectId("..."), "relatedId": "{id}" },
  "to":   { "entityId": ObjectId("..."), "relatedId": "{id}" },
  "amount": NumberDecimal("0.00"),
  "type": "{type}",
  "status": "pending",
  "context": {},
  "timestamps": {
    "created": ISODate("..."),
    "processed": ISODate("...")
  }
}
```

### MongoDB indexes

```javascript
db.{entity_a}.createIndex({ "identifier": 1 }, { unique: true });
db.{entity_a}.createIndex({ "createdAt": -1 });

db.{entity_b}.createIndex({ "hash": 1 }, { unique: true });
db.{entity_b}.createIndex({ "from.entityId": 1, "createdAt": -1 });
db.{entity_b}.createIndex({ "to.entityId": 1, "createdAt": -1 });
db.{entity_b}.createIndex({ "status": 1, "type": 1 });
```

---

## Common Query Patterns

```sql
-- Entity with related records (avoid N+1)
SELECT
    a.*,
    json_agg(
        json_build_object(
            'id', c.id,
            'type', c.type,
            'amount', c.amount
        )
    ) AS related
FROM {entity_a} a
LEFT JOIN {entity_c} c ON c.entity_a_id = a.id
WHERE a.id = $1
GROUP BY a.id;

-- Paginated history with joins
SELECT
    b.*,
    c1.type AS from_type,
    c2.type AS to_type
FROM {entity_b} b
LEFT JOIN {entity_c} c1 ON c1.id = b.from_id
LEFT JOIN {entity_c} c2 ON c2.id = b.to_id
WHERE b.from_id = $1 OR b.to_id = $1
ORDER BY b.created_at DESC
LIMIT 20 OFFSET $2;
```

---

## Maintenance

### Data cleanup

```sql
-- Archive old records
INSERT INTO {entity_b}_archive
SELECT * FROM {entity_b}
WHERE created_at < NOW() - INTERVAL '{n} months'
AND status = 'completed';

DELETE FROM {entity_b}
WHERE created_at < NOW() - INTERVAL '{n} months'
AND status = 'completed';

VACUUM ANALYZE {entity_b};
```

### Performance monitoring

```sql
-- Slow queries
SELECT query, calls, total_time, mean, max
FROM pg_stat_statements
ORDER BY mean DESC
LIMIT 10;

-- Table sizes and bloat
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup,
    n_dead_tup,
    round(n_dead_tup::numeric / NULLIF(n_live_tup, 0), 2) AS dead_ratio
FROM pg_stat_user_tables
ORDER BY dead_ratio DESC;
```
