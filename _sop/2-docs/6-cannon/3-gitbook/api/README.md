# API Overview

The [Organization Name] API ([Platform G]) provides programmatic access to all intelligence data.

---

## Base URL

```
https://api.[organization-url]/v1
```

---

## Authentication

All requests require a Bearer token:

```bash
curl -X GET "https://api.[organization-url]/v1/[index-a]/countries" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

→ [Authentication details](authentication.md)

---

## Endpoints

| Endpoint                              | Description           | Methods               |
| ------------------------------------- | --------------------- | --------------------- |
| `/alerts`                             | Breaking alerts       | GET, POST (subscribe) |
| `/[index-a]/countries`                | [Index A] scores      | GET                   |
| `/[index-a]/countries/{code}`         | Single country        | GET                   |
| `/[index-c]/countries`                | [Index C] scores      | GET                   |
| `/[intelligence-product]/regulations` | Regulatory database   | GET                   |
| `/[intelligence-product]/changes`     | Recent changes        | GET                   |
| `/entities`                           | [Platform E] profiles | GET                   |
| `/corridors`                          | Trade route data      | GET                   |

→ [Full endpoint documentation](endpoints.md)

---

→ [Integrations overview](integrations.md)

---

## Response Format

All responses are JSON:

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-01-27T12:00:00Z"
  }
}
```

### Error Responses

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retry_after": 60
  }
}
```

---

## Rate Limits

| Tier         | Requests/Hour | Burst  |
| ------------ | ------------- | ------ |
| Standard     | 1,000         | 50     |
| Professional | 5,000         | 200    |
| Enterprise   | Custom        | Custom |

→ [Rate limit details](rate-limits.md)

---

## Webhooks

Receive real-time notifications:

```json
POST https://your-server.com/webhook
Content-Type: application/json

{
  "event": "alert.created",
  "data": { ... },
  "timestamp": "2025-01-27T12:00:00Z"
}
```

→ [Webhook documentation](webhooks.md)

---

## SDKs

| Language   | Install                  |
| ---------- | ------------------------ |
| Python     | `pip install [org]-sdk`  |
| JavaScript | `npm install @[org]/sdk` |

→ [SDK documentation](sdks.md)

---

## Quick Start

### 1. Get API Key

Go to **Settings → API** in your [Platform B] dashboard.

### 2. Test Connection

```bash
curl -X GET "https://api.[organization-url]/v1/status" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Fetch [Index A] Data

```bash
curl -X GET "https://api.[organization-url]/v1/[index-a]/countries/[COUNTRY_CODE]" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## Support

- **API Status**: status.[organization-url]
- **Documentation Issues**: api@[organization-url]
- **Enterprise Support**: enterprise@[organization-url]
