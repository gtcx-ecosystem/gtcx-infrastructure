# Backend Architecture — {Service Name}

**Service type:** Monolith / Microservice / Serverless
**Primary language:** {TypeScript / Python / Go / Java}
**Framework:** {Express / NestJS / FastAPI / Spring / other}
**Last updated:** {YYYY-MM-DD}

---

## Architecture Overview

### System layers

```
┌─────────────────────────────────────────────────┐
│                   API Gateway                    │
├─────────────────────────────────────────────────┤
│              Business Logic Layer                │
├─────────────────────────────────────────────────┤
│                 Service Layer                    │
├─────────────────────────────────────────────────┤
│            Data Access Layer (DAL)               │
├─────────────────────────────────────────────────┤
│          Database / External Services            │
└─────────────────────────────────────────────────┘
```

---

## Service Architecture

### Microservices map (if applicable)

```yaml
Services:
  { ServiceA }:
    Port: { port }
    Database: { PostgreSQL / MongoDB / Redis }
    Dependencies: []

  { ServiceB }:
    Port: { port }
    Database: { PostgreSQL / MongoDB / Redis }
    Dependencies: [{ ServiceA }]

  { ServiceC }:
    Port: { port }
    Database: { Redis }
    Dependencies: [{ ServiceA }, { ServiceB }]
```

---

## Database Design

**Type:** {PostgreSQL / MongoDB / DynamoDB}
**Version:** {version}
**Hosting:** {managed service / self-hosted}

### Schema design

```sql
CREATE TABLE {entity_a} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    {field_1} VARCHAR(255) UNIQUE NOT NULL,
    {field_2} VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE {entity_b} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    {entity_a}_id UUID REFERENCES {entity_a}(id),
    {amount_field} DECIMAL(19,4) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Index strategy

```sql
CREATE INDEX idx_{entity_a}_{field} ON {entity_a}({field});
CREATE INDEX idx_{entity_b}_{fk} ON {entity_b}({entity_a}_id);
CREATE INDEX idx_{entity_b}_status ON {entity_b}(status);
CREATE INDEX idx_{entity_b}_created ON {entity_b}(created_at DESC);
```

---

## API Design

### RESTful endpoints

| Method | Endpoint                | Description       | Auth     |
| ------ | ----------------------- | ----------------- | -------- |
| GET    | /api/v1/{resource}      | List {resource}   | Required |
| POST   | /api/v1/{resource}      | Create {resource} | Required |
| GET    | /api/v1/{resource}/{id} | Get {resource}    | Required |
| PUT    | /api/v1/{resource}/{id} | Update {resource} | Required |
| DELETE | /api/v1/{resource}/{id} | Delete {resource} | Admin    |

### GraphQL schema (if applicable)

```graphql
type {Entity} {
  id: ID!
  {field}: String!
  related: [{RelatedEntity}!]!
  createdAt: DateTime!
}

type Query {
  {entity}(id: ID!): {Entity}
  {entities}(limit: Int, after: String): {Entity}Connection!
}

type Mutation {
  create{Entity}(input: Create{Entity}Input!): {Entity}!
  update{Entity}(id: ID!, input: Update{Entity}Input!): {Entity}!
}
```

---

## Authentication and Authorization

**Auth type:** {JWT / OAuth 2.0 / API Key / SAML}
**Token expiry:** {access: 24h, refresh: 30d}
**MFA:** {Required / Optional / Not applicable}

### Permission model

```typescript
enum Role {
  ADMIN = 'admin',
  USER = 'user',
  GUEST = 'guest',
}

interface Permission {
  resource: string;
  actions: string[];
  conditions?: Record<string, unknown>;
}
```

---

## Message Queue Architecture

**Technology:** {RabbitMQ / Kafka / AWS SQS / Azure Service Bus}
**Pattern:** {Pub/Sub / Work Queue / Event-Driven}

### Event flow

```yaml
Events:
  { EntityCreated }:
    Publisher: { SourceService }
    Subscribers: [{ ServiceA }, { ServiceB }]

  { ActionCompleted }:
    Publisher: { SourceService }
    Subscribers: [{ NotificationService }, { AuditService }]
```

---

## Caching Strategy

### Cache layers

1. **Application cache:** In-memory (process-level)
2. **Distributed cache:** Redis
3. **CDN cache:** {CloudFront / Cloudflare / other}

### Cache policies

```yaml
CacheRules:
  { EntityProfile }:
    TTL: 3600 # 1 hour
    InvalidateOn: [{ EntityUpdated }, { EntityDeleted }]

  { ListResource }:
    TTL: 300 # 5 minutes
    InvalidateOn: [{ EntityCreated }, { EntityUpdated }]
```

---

## Performance Optimization

### Query optimization

- Use explain plans to diagnose slow queries
- Paginate all list endpoints
- Use connection pooling (min: {n}, max: {n})
- Cache frequent read queries

### Avoid N+1 queries

```typescript
// Avoid: N+1 queries
const items = await getItems();
for (const item of items) {
  item.related = await getRelated(item.id);
}

// Prefer: single query with joins or dataloader
const items = await getItemsWithRelated();
```

---

## Testing Strategy

**Coverage targets:** Unit > {n}%, integration on critical paths
**Load testing:** {n} concurrent users at steady state
**Security testing:** OWASP Top 10

### Test structure

```
tests/
├── unit/
│   ├── services/
│   ├── controllers/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
├── load/
│   └── scenarios/
└── security/
```

---

## Logging and Monitoring

### Structured logging

```typescript
logger.info('Operation completed', {
  operationId: op.id,
  userId: user.id,
  duration: processingTime,
  metadata: {},
});
```

### Monitoring metrics

- Request rate and latency (p50, p95, p99)
- Error rate by type
- Database query performance
- Queue depth and processing lag
- Memory and CPU utilization

---

## Deployment

**Platform:** {AWS / GCP / Azure / on-premise}
**Orchestration:** {Kubernetes / ECS / Docker Compose}
**CI/CD:** {GitHub Actions / GitLab CI / CircleCI}

### Pipeline stages

```yaml
Pipeline:
  lint_and_test:
    - Linting
    - Type check
    - Unit tests
  build:
    - Container image
    - Security scan
  test_integration:
    - Integration tests
    - Load tests
  deploy_staging:
    - Deploy
    - Smoke tests
    - Manual approval gate
  deploy_production:
    - Blue-green or rolling deployment
    - Health checks
```

---

## Configuration Management

### Environment variables

```env
# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DB_HOST={host}
DB_PORT=5432
DB_NAME={db-name}
DB_USER={app_user}
DB_PASSWORD=${DB_PASSWORD}

# Cache
REDIS_URL=redis://{host}:6379

# External services
EXTERNAL_API_KEY=${EXTERNAL_API_KEY}
```

---

## Key Performance Indicators

| Metric                  | Target  | Current | Status |
| ----------------------- | ------- | ------- | ------ |
| API response time (p95) | < {n}ms |         |        |
| Error rate              | < {n}%  |         |        |
| DB query time (avg)     | < {n}ms |         |        |
| Cache hit rate          | > {n}%  |         |        |
| Uptime                  | {n}%    |         |        |

---

## Documentation Checklist

- [ ] API documentation (OpenAPI/Swagger)
- [ ] Database schema documentation
- [ ] Service architecture diagram
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Performance tuning notes
- [ ] Secret rotation runbook
