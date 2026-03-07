# [Project Name] Backend Architecture

**Document ID**: [DOC-BACKEND-NNN]
**Version**: {version}
**Date**: {YYYY-MM-DD}
**Status**: [Draft / Technical Specification / Approved]

---

## Runtime and Framework

- **Runtime**: [Node.js 20 LTS / Python 3.12 / Go 1.22 / etc.]
- **Language**: [TypeScript 5.x / Python / Go] ([strict mode / type hints / etc.])
- **REST Framework**: [Express.js / Fastify / FastAPI / etc.] with middleware stack
- **GraphQL Framework**: [Apollo Server / Strawberry / etc.] with [framework] integration
- **ORM**: [Prisma / SQLAlchemy / GORM / etc.] for [database] schema management
- **Process Manager**: [PM2 / Kubernetes native / Supervisor]

---

## Project Structure

```
src/
  index.ts                     -- Application bootstrap
  config/
    index.ts                   -- Environment configuration loader
    profiles/                  -- [Requirements / environment] profile files
  middleware/
    auth.ts                    -- JWT validation middleware
    idempotency.ts             -- Idempotency-Key enforcement
    errorHandler.ts            -- Global error handling
    requestId.ts               -- X-Request-Id injection
    rateLimiter.ts             -- Application-level rate limiting
  routes/
    [resource1].ts             -- [Resource] CRUD routes
    [resource2].ts             -- [Resource] routes
    webhooks.ts                -- Webhook subscription routes
    health.ts                  -- Health check endpoints
  graphql/
    schema.ts                  -- GraphQL type definitions
    resolvers/                 -- Query, mutation, subscription resolvers
    dataloaders/               -- DataLoader instances for N+1 prevention
  services/
    [domain1].service.ts       -- [Domain] business logic
    [domain2].service.ts       -- [Domain] business logic
    webhook.service.ts         -- Webhook dispatch and retry
    report.service.ts          -- Report generation
  clients/
    [service1].client.ts       -- [Service] REST client with circuit breaker
    [service2].client.ts       -- [Service] client
    auth.client.ts             -- Auth [REST / gRPC] client
    storage.client.ts          -- Storage client
  events/
    publisher.ts               -- [NATS / Kafka / SQS] event publisher
    subscribers/               -- Event subscription handlers
  crypto/
    signer.ts                  -- [Ed25519 / RSA] credential signing
    verifier.ts                -- Signature verification
  utils/
    circuitBreaker.ts          -- Circuit breaker factory
    retry.ts                   -- Retry with exponential backoff
    cache.ts                   -- [Redis] cache helper
    pagination.ts              -- Cursor-based pagination
  prisma/
    schema.prisma              -- Prisma schema definition
    migrations/                -- Database migration files
  __tests__/
    unit/                      -- Unit tests
    integration/               -- API integration tests
    load/                      -- Load test scripts
```

---

## Middleware Stack

Request processing order:

1. **requestId** -- Inject X-Request-Id (from header or generate UUID)
2. **cors** -- CORS headers (configured for allowed origins)
3. **helmet** -- Security headers (CSP, HSTS, etc.)
4. **compression** -- Response compression (gzip)
5. **bodyParser** -- JSON body parsing (limit: [N]MB)
6. **auth** -- JWT validation (skip for /health/\* and /v1/[public endpoints])
7. **idempotency** -- Check/store idempotency key for mutating operations
8. **rateLimiter** -- Application-level rate limiting
9. **route handlers** -- Business logic
10. **errorHandler** -- Global error catch, structured error response

---

## Database Access Pattern

All database access flows through [ORM] with the following conventions:

- **Transactions**: Multi-table writes use `[transaction method]` for atomicity
- **Soft Deletes**: Records are never hard-deleted; status is set to "archived"
- **Audit Fields**: All tables include created_at, updated_at (auto-managed)
- **Connection Pool**: Default [N] connections per pod, tuned based on replica count
- **Query Logging**: [ORM] query logging enabled in staging, disabled in production

---

## Caching Strategy

| Data                 | Cache Key Pattern    | TTL          | Invalidation             |
| -------------------- | -------------------- | ------------ | ------------------------ |
| [Resource 1] status  | `[resource]:{id}`    | [N]s         | On [event]               |
| [Resource 2] summary | `[resource]:{orgId}` | [N]s         | On any [resource] change |
| [Computed value]     | `[key]:{id}`         | [N]s         | On [event]               |
| [Profile/config]     | `[key]:{id}`         | [N]s         | On profile update        |
| Idempotency key      | `idempotency:{key}`  | 86400s (24h) | Natural expiry           |

---

## Error Handling

All errors return the standard error envelope:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable message
    details?: {
      field: string;
      message: string;
    }[];
    request_id: string; // From X-Request-Id header
  };
}
```

| Code                 | HTTP | Description                           |
| -------------------- | ---- | ------------------------------------- |
| AUTHENTICATION_ERROR | 401  | Invalid or expired token              |
| AUTHORIZATION_ERROR  | 403  | Insufficient permissions              |
| NOT_FOUND            | 404  | Resource not found                    |
| VALIDATION_ERROR     | 400  | Invalid input data                    |
| CONFLICT             | 409  | Invalid state transition or duplicate |
| RATE_LIMIT_EXCEEDED  | 429  | Rate limit hit                        |
| UPSTREAM_UNAVAILABLE | 503  | Downstream service circuit open       |
| INTERNAL_ERROR       | 500  | Unhandled server error                |

---

## Background Jobs

| Job     | Trigger                 | Purpose                              |
| ------- | ----------------------- | ------------------------------------ |
| [Job 1] | Cron ([schedule])       | [Purpose]                            |
| [Job 2] | Queue (failed delivery) | Retry failed [deliveries/operations] |
| [Job 3] | Cron ([schedule])       | [Purpose]                            |
| [Job 4] | Event ([event name])    | [Purpose]                            |

---

**Document Status**: [Status]
**Review Cycle**: [Monthly / Quarterly]
**Owner**: [Backend Team / Platform Team]
