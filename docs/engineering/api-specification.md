# API Specification — {api-name}

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> Full API specification. For a lightweight architecture-level overview, see api-design-template.md (`api-design-template.md`).

## 1. Overview

### Base URLs

| Environment | URL                 | Purpose                   |
| ----------- | ------------------- | ------------------------- |
| Production  | `{production-url}`  | Production                |
| Staging     | `{staging-url}`     | Pre-production validation |
| Development | `{development-url}` | Local/dev testing         |

### Protocol

- **Transport**: HTTPS / TLS {version}
- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Date format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)

### Request Headers

| Header              | Required    | Description           | Example          |
| ------------------- | ----------- | --------------------- | ---------------- |
| `Authorization`     | Yes         | Bearer token          | `Bearer {token}` |
| `X-Request-ID`      | Recommended | Idempotency / tracing | `{uuid}`         |
| `X-Idempotency-Key` | Conditional | Mutation safety       | `{uuid}`         |

---

## 2. Authentication & Authorization

### Authentication methods

#### Primary — {method, e.g. JWT}

```http
POST /auth/token
Content-Type: application/json

{request body or parameters}
```

#### Token response

```json
{
  "access_token": "{token}",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "{token}",
  "scope": "{scopes}"
}
```

### Authorization scopes

| Scope       | Description   | Access Level |
| ----------- | ------------- | ------------ |
| `{scope-1}` | {description} | {level}      |
| `{scope-2}` | {description} | {level}      |

---

## 3. Endpoints

### {Resource 1}

#### GET /{resource}

List all {resource} records.

**Query parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `{param-1}` | {type} | No | {description} |
| `page` | integer | No | Page number |
| `limit` | integer | No | Items per page (max: {max}) |

**Response**:

```json
{
  "data": [
    {
      "{field-1}": "{type}",
      "{field-2}": "{type}"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### POST /{resource}

Create a {resource}.

**Request**:

```json
{
  "{field-1}": "{type}",
  "{field-2}": "{type}"
}
```

**Response** (`201 Created`):

```json
{
  "data": {
    "id": "{uuid}",
    "{field-1}": "{value}",
    "created_at": "{timestamp}"
  }
}
```

#### GET /{resource}/{id}

Get a single {resource} by ID.

**Path parameters**: `id` — {type}, required

**Response**: same shape as single item in list response above.

---

## 4. Data Models

### {Entity} model

```typescript
interface {Entity} {
  id: string;
  {field_1}: {type};
  {field_2}: {type};
  created_at: Date;
  updated_at: Date;
}
```

### Common models

```typescript
interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

interface APIError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  request_id: string;
  timestamp: string;
}
```

---

## 5. Error Handling

### HTTP status codes

| Code | Meaning               | When                     |
| ---- | --------------------- | ------------------------ |
| 200  | OK                    | Successful GET           |
| 201  | Created               | Successful POST          |
| 400  | Bad Request           | Invalid input            |
| 401  | Unauthorized          | Missing or invalid auth  |
| 403  | Forbidden             | Insufficient permissions |
| 404  | Not Found             | Resource does not exist  |
| 422  | Unprocessable Entity  | Validation failure       |
| 429  | Too Many Requests     | Rate limit exceeded      |
| 500  | Internal Server Error | Server fault             |

### Error response format

```json
{
  "error": {
    "code": "{ERROR_CODE}",
    "message": "{human-readable message}",
    "details": {
      "{field}": ["{validation message}"]
    }
  },
  "request_id": "{uuid}",
  "timestamp": "{iso-8601}"
}
```

---

## 6. Rate Limiting

| Endpoint           | Limit        | Window   |
| ------------------ | ------------ | -------- |
| `GET /{resource}`  | {n} requests | {window} |
| `POST /{resource}` | {n} requests | {window} |

**Response headers**:

- `X-RateLimit-Limit` — requests allowed in window
- `X-RateLimit-Remaining` — requests remaining
- `X-RateLimit-Reset` — Unix timestamp of window reset

---

## 7. Versioning

- **Strategy**: URL path versioning — `/api/v{n}/{resource}`
- **Breaking changes**: require new major version
- **Deprecation notice**: minimum {n} days before end-of-life

| Version | Status   | EOL    |
| ------- | -------- | ------ |
| v1      | {status} | {date} |

---

## 8. Security

- **Encryption in transit**: TLS 1.2 minimum, TLS 1.3 preferred
- **Encryption at rest**: {standard}
- **Data classification**: {levels}

**Required security headers**:
| Header | Value |
|--------|-------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |

**Compliance**: {GDPR / SOC 2 / ISO 27001 — applicable standards}

---

## 9. Testing

- **Test base URL**: `{test-url}`
- **OpenAPI / Swagger**: {link}
- **Postman collection**: {link}
- **Mock services**: {availability}

---

## 10. Support

- Developer portal: {link}
- API status: {link}
- Support: {contact}

---

## Completion Checklist

- [ ] Base URLs defined for all environments
- [ ] Authentication flow documented with examples
- [ ] All endpoints documented with request/response schemas
- [ ] Data models defined
- [ ] Error codes catalogued
- [ ] Rate limits specified
- [ ] Versioning strategy defined
- [ ] Security requirements documented
- [ ] Testing resources linked
