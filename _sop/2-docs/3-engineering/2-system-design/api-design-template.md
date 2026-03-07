# API Design — {api-name}

## Overview

{Describe what this API provides, who consumes it, and its primary use cases.}

## Base URL

```
{base-url}/api/v{version}
```

## Authentication

| Method | Header  | Format     |
| ------ | ------- | ---------- | ------------- | ---------------- |
| {JWT   | API Key | OAuth 2.0} | Authorization | `Bearer {token}` |

{Additional authentication details — token acquisition, refresh flow, scopes.}

## Conventions

- **Format**: JSON ({JSON:API | custom})
- **Pagination**: {cursor-based | offset-based} — `?cursor={cursor}&limit={limit}` or `?page={page}&per_page={per_page}`
- **Sorting**: `?sort={field}&order={asc|desc}`
- **Filtering**: `?filter[{field}]={value}`
- **Date Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`)
- **Versioning**: {URL path | header | query param}
- **Envelope**: All responses wrapped in `{ "data": ..., "meta": ... }` or `{ "error": ... }`

## Endpoints

### {Resource Group 1}

| Method | Path             | Description             | Auth       |
| ------ | ---------------- | ----------------------- | ---------- | -------- | ----- |
| GET    | /{resource}      | List all {resource}     | {required  | optional | none} |
| GET    | /{resource}/{id} | Get a single {resource} | {required  | optional | none} |
| POST   | /{resource}      | Create a {resource}     | {required} |
| PUT    | /{resource}/{id} | Update a {resource}     | {required} |
| DELETE | /{resource}/{id} | Delete a {resource}     | {required} |

### {Resource Group 2}

| Method | Path        | Description         | Auth       |
| ------ | ----------- | ------------------- | ---------- | -------- | ----- |
| GET    | /{resource} | List all {resource} | {required  | optional | none} |
| POST   | /{resource} | Create a {resource} | {required} |

## Request/Response Examples

### Create {resource}

**Request:**

```http
POST /api/v{version}/{resource}
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "{field-1}": "{value-1}",
  "{field-2}": "{value-2}"
}
```

**Response (201 Created):**

```json
{
  "data": {
    "id": "{id}",
    "{field-1}": "{value-1}",
    "{field-2}": "{value-2}",
    "createdAt": "{ISO-8601-timestamp}",
    "updatedAt": "{ISO-8601-timestamp}"
  }
}
```

### List {resource}

**Request:**

```http
GET /api/v{version}/{resource}?limit=20&cursor={cursor}
Authorization: Bearer {token}
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "{id}",
      "{field-1}": "{value-1}"
    }
  ],
  "meta": {
    "total": {total-count},
    "nextCursor": "{next-cursor}"
  }
}
```

## Error Codes

| Code | Message               | Description                                       |
| ---- | --------------------- | ------------------------------------------------- |
| 400  | Bad Request           | {The request body or parameters are invalid.}     |
| 401  | Unauthorized          | {Missing or invalid authentication credentials.}  |
| 403  | Forbidden             | {Valid credentials but insufficient permissions.} |
| 404  | Not Found             | {The requested resource does not exist.}          |
| 409  | Conflict              | {The request conflicts with the current state.}   |
| 422  | Unprocessable Entity  | {Validation failed on the request payload.}       |
| 429  | Too Many Requests     | {Rate limit exceeded.}                            |
| 500  | Internal Server Error | {An unexpected error occurred on the server.}     |

**Error Response Format:**

```json
{
  "error": {
    "code": "{error-code}",
    "message": "{human-readable-message}",
    "details": [
      {
        "field": "{field-name}",
        "message": "{field-specific-error}"
      }
    ],
    "requestId": "{request-id}"
  }
}
```

## Rate Limiting

- **Default Limit**: {requests} requests per {window}
- **Authenticated Limit**: {requests} requests per {window}
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Unix timestamp when the window resets
- **Retry Strategy**: Respect `Retry-After` header. Implement exponential backoff.

## Webhooks

### Events

| Event              | Trigger                     | Payload                             |
| ------------------ | --------------------------- | ----------------------------------- |
| {resource}.created | A new {resource} is created | Full {resource} object              |
| {resource}.updated | A {resource} is modified    | Full {resource} object with changes |
| {resource}.deleted | A {resource} is removed     | `{ "id": "{id}" }`                  |

### Webhook Payload Format

```json
{
  "event": "{resource}.{action}",
  "timestamp": "{ISO-8601-timestamp}",
  "data": {}
}
```

### Security

- Payloads are signed with HMAC-SHA256 via the `X-Webhook-Signature` header.
- Verify the signature before processing. Reject unverified payloads.

## Changelog

| Version    | Date         | Changes         |
| ---------- | ------------ | --------------- |
| v{version} | {YYYY-MM-DD} | Initial release |
