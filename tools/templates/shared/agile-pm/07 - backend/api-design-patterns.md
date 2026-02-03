# API Design Patterns Template

## API Overview
**Service Name**: [SERVICE_NAME]  
**API Type**: [REST/GraphQL/gRPC/WebSocket]  
**Version**: [v1/v2/etc]  
**Base URL**: [https://api.gtcx.io/v1]


## API Design Principles

### Core Principles
- **Consistency**: Uniform patterns across all endpoints
- **Predictability**: Intuitive resource naming and behavior
- **Versioning**: Clear version strategy for backward compatibility
- **Security**: Authentication and authorization on all endpoints
- **Documentation**: Self-documenting with clear examples

### GTCX-Specific Requirements
- **Offline-First**: Support for queuing and sync
- **Multi-Currency**: Handle multiple payment contexts
- **Audit Trail**: Complete transaction history
- **Compliance**: Regulatory data requirements


## RESTful Patterns

### Resource Naming Conventions
```
# Pattern: /resources/{id}/sub-resources/{id}

GET    /transactions              # List all transactions
GET    /transactions/{id}          # Get specific transaction
POST   /transactions              # Create new transaction
PUT    /transactions/{id}          # Update transaction
PATCH  /transactions/{id}          # Partial update
DELETE /transactions/{id}          # Delete transaction

# Nested Resources
GET    /users/{userId}/transactions
GET    /transactions/{id}/audit-log
POST   /transactions/{id}/confirm
```

### Standard Response Format
```json
{
  "success": true,
  "data": {
    "id": "txn_1234567890",
    "type": "transaction",
    "attributes": {
      "amount": 1000,
      "currency": "USD",
      "status": "pending"
    },
    "relationships": {
      "user": {
        "id": "usr_987654321",
        "type": "user"
      }
    }
  },
  "meta": {
    "timestamp": "2024-09-01T12:00:00Z",
    "version": "1.0.0",
    "request_id": "req_abc123"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid transaction amount",
    "details": [
      {
        "field": "amount",
        "message": "Amount must be greater than 0",
        "code": "MIN_VALUE"
      }
    ]
  },
  "meta": {
    "timestamp": "2024-09-01T12:00:00Z",
    "request_id": "req_xyz789"
  }
}
```


## GraphQL Patterns

### Schema Design
```graphql
type Transaction {
  id: ID!
  amount: Float!
  currency: Currency!
  status: TransactionStatus!
  user: User!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  transaction(id: ID!): Transaction
  transactions(
    filter: TransactionFilter
    pagination: PaginationInput
    sort: SortInput
  ): TransactionConnection!
}

type Mutation {
  createTransaction(input: CreateTransactionInput!): TransactionPayload!
  updateTransaction(id: ID!, input: UpdateTransactionInput!): TransactionPayload!
  confirmTransaction(id: ID!): TransactionPayload!
}

type Subscription {
  transactionStatusChanged(id: ID!): Transaction!
}
```

### Resolver Patterns
```typescript
// Dataloader pattern for N+1 prevention
const transactionLoader = new DataLoader(async (ids) => {
  const transactions = await Transaction.findByIds(ids);
  return ids.map(id => transactions.find(t => t.id === id));
});

// Field resolver with caching
const resolvers = {
  Transaction: {
    user: (parent, args, context) => {
      return context.loaders.user.load(parent.userId);
    }
  }
};
```


## Authentication & Authorization

### Authentication Patterns
```typescript
// JWT Bearer Token
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
}

// API Key
headers: {
  'X-API-Key': 'gtcx_live_1234567890abcdef'
}

// OAuth 2.0 Flow
GET /auth/authorize?client_id=...&redirect_uri=...
POST /auth/token
POST /auth/refresh
```

### Authorization Patterns
```typescript
// Role-Based Access Control (RBAC)
@RequireRole(['admin', 'operator'])
async deleteTransaction(id: string) { }

// Attribute-Based Access Control (ABAC)
@RequirePermission('transaction:delete')
async deleteTransaction(id: string) { }

// Resource-Based Access Control
@RequireOwnership()
async updateTransaction(id: string, userId: string) { }
```


## Pagination Patterns

### Cursor-Based Pagination (Preferred)
```json
GET /transactions?after=cursor_xyz&limit=20

{
  "data": [...],
  "pagination": {
    "hasNext": true,
    "hasPrevious": false,
    "nextCursor": "cursor_abc",
    "previousCursor": null,
    "total": 1250
  }
}
```

### Offset-Based Pagination
```json
GET /transactions?page=2&limit=20

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


## Versioning Strategy

### URL Path Versioning
```
https://api.gtcx.io/v1/transactions
https://api.gtcx.io/v2/transactions
```

### Header Versioning
```
Accept: application/vnd.gtcx.v2+json
X-API-Version: 2
```

### Deprecation Policy
```json
{
  "deprecated": true,
  "deprecation_date": "2024-12-31",
  "sunset_date": "2025-06-30",
  "migration_guide": "https://docs.gtcx.io/migration/v1-to-v2"
}
```


## Performance Patterns

### Caching Strategy
```typescript
// Cache headers
headers: {
  'Cache-Control': 'public, max-age=3600',
  'ETag': '"123456"',
  'Last-Modified': 'Mon, 01 Sep 2024 12:00:00 GMT'
}

// Conditional requests
headers: {
  'If-None-Match': '"123456"',
  'If-Modified-Since': 'Mon, 01 Sep 2024 12:00:00 GMT'
}
```

### Compression
```typescript
// Request compression
headers: {
  'Content-Encoding': 'gzip',
  'Accept-Encoding': 'gzip, deflate, br'
}
```

### Field Filtering
```
GET /transactions?fields=id,amount,status
GET /transactions?include=user,audit_log
GET /transactions?exclude=metadata,internal_notes
```


## Search & Filtering

### Query Parameters
```
GET /transactions?status=pending&amount_gte=1000&currency=USD
GET /transactions?q=search+term
GET /transactions?filter[status]=pending&filter[amount][gte]=1000
```

### Advanced Filtering
```json
POST /transactions/search
{
  "filters": {
    "and": [
      { "status": "pending" },
      { "amount": { "gte": 1000 } },
      {
        "or": [
          { "currency": "USD" },
          { "currency": "EUR" }
        ]
      }
    ]
  },
  "sort": [
    { "field": "created_at", "direction": "desc" }
  ],
  "pagination": {
    "limit": 20,
    "after": "cursor_xyz"
  }
}
```


## Webhook Patterns

### Webhook Registration
```json
POST /webhooks
{
  "url": "https://example.com/webhook",
  "events": ["transaction.created", "transaction.confirmed"],
  "secret": "webhook_secret_key"
}
```

### Webhook Payload
```json
{
  "id": "evt_1234567890",
  "type": "transaction.confirmed",
  "timestamp": "2024-09-01T12:00:00Z",
  "data": {
    "transaction": { ... }
  },
  "signature": "sha256=..."
}
```


## Testing Patterns

### Test Endpoints
```
POST /test/reset                    # Reset test data
POST /test/seed                     # Seed test data
POST /test/simulate/error/{code}    # Simulate errors
POST /test/simulate/delay/{ms}      # Simulate latency
```

### Test Authentication
```typescript
// Test API keys with prefixes
const testApiKey = 'gtcx_test_1234567890';
const liveApiKey = 'gtcx_live_1234567890';
```


## Documentation Requirements

### OpenAPI/Swagger Specification
```yaml
openapi: 3.0.0
info:
  title: GTCX API
  version: 1.0.0
  description: Global Transaction Context Exchange API
paths:
  /transactions:
    get:
      summary: List transactions
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, confirmed, cancelled]
      responses:
        200:
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TransactionList'
```

### API Documentation Standards
- **Every endpoint** must have description
- **Every parameter** must have type and constraints
- **Every response** must have example
- **Every error** must be documented
- **Rate limits** must be specified


## GTCX-Specific Patterns

### Multi-Tenant Support
```typescript
// Header-based tenant identification
headers: {
  'X-Tenant-ID': 'tenant_123',
  'X-Workspace-ID': 'workspace_456'
}
```

### Idempotency
```typescript
// Idempotency key for safe retries
headers: {
  'Idempotency-Key': 'unique_request_id_123'
}
```

### Audit Trail
```json
{
  "audit": {
    "created_by": "usr_123",
    "created_at": "2024-09-01T12:00:00Z",
    "ip_address": "192.168.1.1",
    "user_agent": "GTCX-SDK/1.0.0",
    "request_id": "req_abc123"
  }
}
```


## Metrics & Monitoring

### Required Metrics
- Response time (p50, p95, p99)
- Error rate by endpoint
- Request rate per second
- Active connections
- Cache hit ratio

### Health Check Endpoint
```json
GET /health

{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "kafka": "healthy"
  }
}
```


*This template ensures consistent, scalable, and maintainable API design across the GTCX ecosystem.*
