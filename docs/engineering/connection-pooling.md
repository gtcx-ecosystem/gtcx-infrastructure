# Connection Pooling

## Overview

Application-level connection pooling is required for all services connecting to PostgreSQL. RDS `max_connections` is not explicitly set in the parameter group, so applications must manage their own pool sizes to avoid exhausting database connections.

## Why application-level pooling

- RDS default `max_connections` scales with instance memory but is not tuned per workload
- Without pooling, each request opens a new connection, risking connection exhaustion under load
- Connection setup has non-trivial latency (TLS handshake, auth) that pooling amortizes

## Configuration

### TypeORM (NestJS / Node.js services)

```typescript
{
  type: 'postgres',
  extra: {
    max: 20,          // pool size — adjust per service tier
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
}
```

### pg Pool (direct Node.js)

```typescript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

## Recommended pool sizes by service tier

| Tier               | Service examples        | Pool size (`max`) |
| ------------------ | ----------------------- | ----------------- |
| API gateway        | api                     | 20                |
| Protocol services  | tradepass, geotag, gci  | 10                |
| Platform layers    | agx, crx, sgx           | 15                |
| Intelligence       | anisa, intelligence-sdk | 5                 |
| Background workers | queue processors        | 5                 |

## Calculating total connections

Sum all pool sizes across all service replicas. Ensure the total stays below the RDS instance `max_connections` limit (typically ~80% of the RDS default to leave headroom for admin connections and monitoring).

Formula: `total = sum(pool_size * replica_count)` for each service.

For a `db.t3.medium` (default ~100 max_connections), keep total pool allocations under 80.

## Monitoring

- Track `pg_stat_activity` for active/idle connections
- Alert when active connections exceed 70% of `max_connections`
- Monitor pool wait times in application metrics
