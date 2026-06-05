---
title: 'API Design Patterns'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'testing']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# API Design Patterns

Reference patterns and conventions for designing consistent, scalable APIs.

---

## Design Principles

- **Consistency** — uniform patterns across all endpoints and services
- **Predictability** — intuitive resource naming and behavior
- **Versioning** — clear strategy for backward compatibility
- **Security** — authentication and authorization on all non-public endpoints
- **Offline-first** — support for queuing and sync where applicable
- **Audit trail** — complete request history for regulated or transactional systems

---

## RESTful Patterns

### Resource naming conventions

```
# Standard CRUD
GET    /resources              # List
GET    /resources/{id}         # Get one
POST   /resources              # Create
PUT    /resources/{id}         # Full update
PATCH  /resources/{id}         # Partial update
DELETE /resources/{id}         # Delete

# Nested resources
GET    /users/{userId}/transactions
GET    /transactions/{id}/audit-log
POST   /transactions/{id}/confirm
```

### Standard response envelope

```json
{
  "success": true,
  "data": {
    "id": "{id}",
    "type": "{resource-type}",
    "attributes": {
      "{field}": "{value}"
    }
  },
  "meta": {
    "timestamp": "2024-09-01T12:00:00Z",
    "version": "1.0.0",
    "requestId": "{request-id}"
  }
}
```

### Error response format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "{human-readable description}",
    "details": [
      {
        "field": "{field-name}",
        "message": "{field-specific error}",
        "code": "MIN_VALUE"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-09-01T12:00:00Z",
    "requestId": "{request-id}"
  }
}
```

---

## GraphQL Patterns

### Schema design

```graphql
type {Entity} {
  id: ID!
  {field}: {Type}!
  status: {EntityStatus}!
  related: {RelatedEntity}!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  {entity}(id: ID!): {Entity}
  {entities}(
    filter: {Entity}Filter
    pagination: PaginationInput
    sort: SortInput
  ): {Entity}Connection!
}

type Mutation {
  create{Entity}(input: Create{Entity}Input!): {Entity}Payload!
  update{Entity}(id: ID!, input: Update{Entity}Input!): {Entity}Payload!
}

type Subscription {
  {entity}StatusChanged(id: ID!): {Entity}!
}
```

### Resolver patterns

```typescript
// DataLoader to prevent N+1
const entityLoader = new DataLoader(async (ids) => {
  const entities = await Entity.findByIds(ids);
  return ids.map(id => entities.find(e => e.id === id));
});

const resolvers = {
  {ParentType}: {
    related: (parent, args, context) =>
      context.loaders.{entity}.load(parent.relatedId)
  }
};
```

---

## Authentication Patterns

```typescript
// JWT Bearer Token
headers: { 'Authorization': 'Bearer {token}' }

// API Key
headers: { 'X-API-Key': '{prefix}_live_{key}' }

// OAuth 2.0
GET  /auth/authorize?client_id=...&redirect_uri=...&scope=...
POST /auth/token
POST /auth/refresh
```

### Authorization patterns

```typescript
// Role-Based (RBAC)
@RequireRole(['admin', 'operator'])
async deleteResource(id: string) {}

// Permission-Based (ABAC)
@RequirePermission('resource:delete')
async deleteResource(id: string) {}

// Resource ownership
@RequireOwnership()
async updateResource(id: string, userId: string) {}
```

---

## Pagination Patterns

### Cursor-based (preferred for large datasets)

```
GET /resources?after={cursor}&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": "{cursor}",
    "previousCursor": null,
    "total": 1250
  }
}
```

### Offset-based (acceptable for small, stable datasets)

```
GET /resources?page=2&limit=20
```

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 1250,
    "totalPages": 63
  }
}
```

---

## Versioning Strategy

### URL path versioning (default)

```
{base-url}/v1/resources
{base-url}/v2/resources
```

### Header versioning (alternative)

```
Accept: application/vnd.{product}.v2+json
X-API-Version: 2
```

### Deprecation response

```json
{
  "deprecated": true,
  "deprecationDate": "2024-12-31",
  "sunsetDate": "2025-06-30",
  "migrationGuide": "{docs-url}/migration/v1-to-v2"
}
```

**Lifecycle policy:** announce deprecation ≥ {n} months before sunset; support both versions during transition.

---

## Performance Patterns

### Caching headers

```typescript
headers: {
  'Cache-Control': 'public, max-age=3600',
  'ETag': '"abc123"',
  'Last-Modified': 'Mon, 01 Sep 2024 12:00:00 GMT'
}

// Conditional request
headers: {
  'If-None-Match': '"abc123"',
  'If-Modified-Since': 'Mon, 01 Sep 2024 12:00:00 GMT'
}
```

### Compression

```typescript
headers: {
  'Content-Encoding': 'gzip',
  'Accept-Encoding': 'gzip, deflate, br'
}
```

### Field filtering

```
GET /resources?fields=id,name,status
GET /resources?include=related,metadata
GET /resources?exclude=internalNotes
```

---

## Search and Filtering

### Query parameters

```
GET /resources?status=active&amount_gte=1000&type=transfer
GET /resources?q={search-term}
GET /resources?filter[status]=active&filter[amount][gte]=1000
```

### Advanced filter body

```json
POST /resources/search
{
  "filters": {
    "and": [
      { "status": "active" },
      { "amount": { "gte": 1000 } },
      {
        "or": [
          { "type": "transfer" },
          { "type": "deposit" }
        ]
      }
    ]
  },
  "sort": [{ "field": "created_at", "direction": "desc" }],
  "pagination": { "limit": 20, "after": "{cursor}" }
}
```

---

## Webhook Patterns

### Webhook registration

```json
POST /webhooks
{
  "url": "https://{consumer-domain}/webhook",
  "events": ["{resource}.created", "{resource}.updated"],
  "secret": "{webhook-secret}"
}
```

### Webhook payload

```json
{
  "id": "evt_{id}",
  "type": "{resource}.{action}",
  "timestamp": "2024-09-01T12:00:00Z",
  "data": {},
  "signature": "sha256={hmac}"
}
```

Verify HMAC-SHA256 signature before processing. Reject unverified payloads.

---

## Testing Patterns

### Test environment endpoints

```
POST /test/reset                     # Reset test data
POST /test/seed                      # Seed test data
POST /test/simulate/error/{code}     # Simulate error conditions
POST /test/simulate/delay/{ms}       # Simulate latency
```

### Test vs. live API keys

```typescript
const testApiKey = '{prefix}_test_{key}';
const liveApiKey = '{prefix}_live_{key}';
```

---

## Advanced Patterns

### Idempotency

For safe retries on POST/PATCH operations:

```typescript
headers: { 'Idempotency-Key': '{unique-request-id}' }
```

Store the key and result; replay stored result for duplicate requests within a TTL window.

### Multi-tenant support

```typescript
headers: {
  'X-Tenant-ID': '{tenant-id}',
  'X-Workspace-ID': '{workspace-id}'
}
```

### Audit trail metadata

Include on all state-changing operations:

```json
{
  "audit": {
    "createdBy": "{user-id}",
    "createdAt": "2024-09-01T12:00:00Z",
    "ipAddress": "{ip}",
    "userAgent": "{client}",
    "requestId": "{request-id}"
  }
}
```

---

## Metrics and Monitoring

**Required metrics per endpoint:**

- Response time (p50, p95, p99)
- Error rate by endpoint and error code
- Requests per second
- Active connections
- Cache hit ratio

### Health check standard

```json
GET /health

{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "database": "healthy",
    "cache": "healthy",
    "queue": "healthy"
  }
}
```

---

## Documentation Standards

Every endpoint must include:

- Clear description of purpose and behavior
- All parameters with types and constraints
- Response examples for success and each error case
- Rate limit information
- Authentication requirements

Use OpenAPI 3.0 for machine-readable specs. Keep spec in version control alongside the code.
