# API Endpoints

Complete reference for all [Organization Name] API endpoints.

---

## [Index A] Endpoints

### List Countries

```
GET /v1/[index-a]/countries
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `grade` | string | Filter by grade (A, B+, B-, C+, C, D) |
| `region` | string | Filter by region |

**Response:**

```json
{
  "data": [
    {
      "code": "RW",
      "name": "Rwanda",
      "score": 60,
      "grade": "C+",
      "trend": "up"
    }
  ]
}
```

### Get Country

```
GET /v1/[index-a]/countries/{code}
```

**Response:**

```json
{
  "data": {
    "code": "[COUNTRY_CODE]",
    "name": "[Country Name]",
    "score": 62,
    "grade": "B-",
    "dimensions": {
      "physical": 60,
      "digital": 66,
      "regulatory": 58
    },
    "updated_at": "2025-01-15T00:00:00Z"
  }
}
```

---

## [Index C] Endpoints

### List Countries

```
GET /v1/[index-c]/countries
```

### Get Country

```
GET /v1/[index-c]/countries/{code}
```

---

## Alerts Endpoints

### List Alerts

```
GET /v1/alerts
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `jurisdiction` | string | Filter by country/market code |
| `[domain_filter]` | string | Filter by [domain dimension — e.g., category, type, sector] |
| `since` | datetime | Alerts after this time |
| `limit` | integer | Max results (default 20) |

### Get Alert

```
GET /v1/alerts/{id}
```

---

## [Intelligence Product] Endpoints

### List Regulations

```
GET /v1/[intelligence-product]/regulations
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `jurisdiction` | string | Filter by country |
| `topic` | string | Filter by topic |
| `effective_after` | date | Effective date filter |

### Get Regulation

```
GET /v1/[intelligence-product]/regulations/{id}
```

### List Changes

```
GET /v1/[intelligence-product]/changes
```

---

## Entities Endpoints

### Search Entities

```
GET /v1/entities
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Search query |
| `type` | string | Entity type |
| `jurisdiction` | string | Country filter |

### Get Entity

```
GET /v1/entities/{id}
```

---

## Pagination

All list endpoints support pagination:

```
GET /v1/[index-a]/countries?page=2&per_page=20
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "meta": {
    "page": 2,
    "per_page": 20,
    "total": 54,
    "total_pages": 3
  }
}
```
