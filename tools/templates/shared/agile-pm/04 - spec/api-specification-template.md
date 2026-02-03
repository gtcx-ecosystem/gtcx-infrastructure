# API Specification Template - [PROJECT_NAME]

## Document Information
- **Project**: [PROJECT_NAME]
- **API Version**: [VERSION]
- **Document Version**: [DOC_VERSION]
- **Status**: [DRAFT/REVIEW/RELEASE_CANDIDATE/RELEASED]
- **Last Updated**: [DATE]
- **API Lead**: [API_LEAD_NAME]
- **Reviewers**: [REVIEWER_LIST]
- **Classification**: [INTERNAL/CONFIDENTIAL/PUBLIC]


## How to Use This Template

### Customization Instructions:
1. **Replace all `[PLACEHOLDER]` text** with your project-specific information
2. **Remove sections** that don't apply to your project
3. **Add sections** specific to your project needs
4. **Maintain the structure** for consistency across GTCX projects

### Required Sections:
- **API Overview** - Always include
- **Authentication & Authorization** - Always include
- **Core Endpoints** - Always include
- **Data Models** - Always include
- **Error Handling** - Always include


## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication and Authorization](#2-authentication-and-authorization)
3. [Core Endpoints](#3-core-endpoints)
4. [Data Models](#4-data-models)
5. [Error Handling](#5-error-handling)
6. [Rate Limiting and Quotas](#6-rate-limiting-and-quotas)
7. [Versioning Strategy](#7-versioning-strategy)
8. [Security Requirements](#8-security-requirements)
9. [Testing and Validation](#9-testing-and-validation)
10. [Documentation and Support](#10-documentation-and-support)


## 1. API Overview

### 1.1 Base URLs

| Environment | Base URL | Purpose |
|------------|----------|---------|
| Production | `[PRODUCTION_URL]` | Production deployment |
| Staging | `[STAGING_URL]` | Pre-production validation |
| Development | `[DEVELOPMENT_URL]` | Development testing |

### 1.2 Protocol Requirements

- **Transport**: [HTTPS/TLS requirements]
- **Content Type**: [Request/response content types]
- **Character Encoding**: [Character encoding requirements]
- **Date Format**: [Date format specifications]
- **Coordinate System**: [Coordinate system if applicable]

### 1.3 Request Headers

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Authorization` | [Yes/No] | [Description] | `[Example]` |
| `X-Request-ID` | [Yes/No] | [Description] | `[Example]` |
| `X-Idempotency-Key` | [Yes/No] | [Description] | `[Example]` |
| `[CUSTOM_HEADER]` | [Yes/No] | [Description] | `[Example]` |


## 2. Authentication and Authorization

### 2.1 Authentication Methods

#### 2.1.1 [METHOD_1] (Primary)

```http
[HTTP_METHOD] [ENDPOINT]
Content-Type: [CONTENT_TYPE]

[REQUEST_BODY_OR_PARAMETERS]
```

#### 2.1.2 [METHOD_2] (Alternative)

```http
[HTTP_METHOD] [ENDPOINT]
Content-Type: [CONTENT_TYPE]

[REQUEST_BODY_OR_PARAMETERS]
```

### 2.2 Token Response

```json
{
  "access_token": "[TOKEN_EXAMPLE]",
  "token_type": "[TOKEN_TYPE]",
  "expires_in": [EXPIRY_SECONDS],
  "refresh_token": "[REFRESH_TOKEN_EXAMPLE]",
  "scope": "[SCOPE_DESCRIPTION]",
  "issued_at": "[TIMESTAMP]"
}
```

### 2.3 Authorization Scopes

| Scope | Description | Access Level |
|-------|-------------|--------------|
| `[SCOPE_1]` | [Description] | [Access Level] |
| `[SCOPE_2]` | [Description] | [Access Level] |
| `[SCOPE_3]` | [Description] | [Access Level] |


## 3. Core Endpoints

### 3.1 [RESOURCE_1] Endpoints

#### GET /[RESOURCE_1]
**Description**: [What this endpoint does]

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `[PARAM_1]` | [Type] | [Yes/No] | [Description] |
| `[PARAM_2]` | [Type] | [Yes/No] | [Description] |

**Response**:
```json
{
  "data": [
    {
      "[FIELD_1]": "[TYPE]",
      "[FIELD_2]": "[TYPE]",
      "[FIELD_3]": "[TYPE]"
    }
  ],
  "pagination": {
    "page": "[CURRENT_PAGE]",
    "limit": "[ITEMS_PER_PAGE]",
    "total": "[TOTAL_ITEMS]"
  }
}
```

#### POST /[RESOURCE_1]
**Description**: [What this endpoint does]

**Request Body**:
```json
{
  "[FIELD_1]": "[TYPE]",
  "[FIELD_2]": "[TYPE]",
  "[FIELD_3]": "[TYPE]"
}
```

**Response**:
```json
{
  "data": {
    "[FIELD_1]": "[VALUE]",
    "[FIELD_2]": "[VALUE]",
    "[FIELD_3]": "[VALUE]",
    "id": "[GENERATED_ID]",
    "created_at": "[TIMESTAMP]"
  }
}
```

### 3.2 [RESOURCE_2] Endpoints

#### GET /[RESOURCE_2]/{id}
**Description**: [What this endpoint does]

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | [Type] | Yes | [Description] |

**Response**:
```json
{
  "data": {
    "[FIELD_1]": "[TYPE]",
    "[FIELD_2]": "[TYPE]",
    "[FIELD_3]": "[TYPE]"
  }
}
```


## 4. Data Models

### 4.1 [ENTITY_1] Model

```typescript
interface [ENTITY_1] {
  id: string;
  [FIELD_1]: [TYPE];
  [FIELD_2]: [TYPE];
  [FIELD_3]: [TYPE];
  created_at: Date;
  updated_at: Date;
}
```

**Field Descriptions**:
- **id**: [Description]
- **[FIELD_1]**: [Description]
- **[FIELD_2]**: [Description]
- **[FIELD_3]**: [Description]

### 4.2 [ENTITY_2] Model

```typescript
interface [ENTITY_2] {
  id: string;
  [FIELD_1]: [TYPE];
  [FIELD_2]: [TYPE];
  [FIELD_3]: [TYPE];
  created_at: Date;
  updated_at: Date;
}
```

**Field Descriptions**:
- **id**: [Description]
- **[FIELD_1]**: [Description]
- **[FIELD_2]**: [Description]
- **[FIELD_3]**: [Description]

### 4.3 Common Models

#### Pagination Model
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
```

#### Error Model
```typescript
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


## 5. Error Handling

### 5.1 HTTP Status Codes

| Status Code | Description | When to Use |
|-------------|-------------|-------------|
| `200` | OK | Successful GET requests |
| `201` | Created | Successful POST requests |
| `400` | Bad Request | Invalid request data |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource not found |
| `422` | Unprocessable Entity | Validation errors |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Server-side errors |

### 5.2 Error Response Format

```json
{
  "error": {
    "code": "[ERROR_CODE]",
    "message": "[Human readable error message]",
    "details": {
      "[FIELD_1]": ["[Error detail 1]", "[Error detail 2]"],
      "[FIELD_2]": ["[Error detail 3]"]
    }
  },
  "request_id": "[UUID]",
  "timestamp": "[ISO_8601_TIMESTAMP]"
}
```

### 5.3 Common Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `[ERROR_1]` | [Description] | [Status Code] |
| `[ERROR_2]` | [Description] | [Status Code] |
| `[ERROR_3]` | [Description] | [Status Code] |


## 6. Rate Limiting and Quotas

### 6.1 Rate Limits

| Endpoint | Rate Limit | Window | Description |
|----------|------------|--------|-------------|
| `GET /[RESOURCE_1]` | [LIMIT] requests | [WINDOW] | [Description] |
| `POST /[RESOURCE_1]` | [LIMIT] requests | [WINDOW] | [Description] |
| `[ENDPOINT]` | [LIMIT] requests | [WINDOW] | [Description] |

### 6.2 Quota Management

| Plan | Daily Limit | Monthly Limit | Description |
|------|-------------|---------------|-------------|
| Free | [LIMIT] requests | [LIMIT] requests | [Description] |
| Basic | [LIMIT] requests | [LIMIT] requests | [Description] |
| Premium | [LIMIT] requests | [LIMIT] requests | [Description] |

### 6.3 Rate Limit Headers

| Header | Description | Example |
|--------|-------------|---------|
| `X-RateLimit-Limit` | Requests per window | `100` |
| `X-RateLimit-Remaining` | Remaining requests | `95` |
| `X-RateLimit-Reset` | Window reset time | `1640995200` |


## 7. Versioning Strategy

### 7.1 Versioning Approach

- **URL Versioning**: `/api/v[VERSION]/[RESOURCE]`
- **Header Versioning**: `Accept: application/vnd.[PROJECT].v[VERSION]+json`
- **Query Parameter**: `?version=[VERSION]`

### 7.2 Version Lifecycle

| Version | Status | Release Date | End of Life | Description |
|---------|--------|--------------|-------------|-------------|
| `v1` | [STATUS] | [DATE] | [DATE] | [Description] |
| `v2` | [STATUS] | [DATE] | [DATE] | [Description] |
| `v3` | [STATUS] | [DATE] | [DATE] | [Description] |

### 7.3 Breaking Changes Policy

- **Major Version**: Breaking changes require new major version
- **Minor Version**: New features, backward compatible
- **Patch Version**: Bug fixes, backward compatible


## 8. Security Requirements

### 8.1 Data Protection

- **Encryption at Rest**: [Encryption requirements]
- **Encryption in Transit**: [TLS requirements]
- **Data Classification**: [Data sensitivity levels]
- **Access Controls**: [Access control mechanisms]

### 8.2 Compliance Requirements

- **GDPR**: [GDPR compliance details]
- **SOC 2**: [SOC 2 compliance details]
- **ISO 27001**: [ISO compliance details]
- **Industry Standards**: [Other compliance requirements]

### 8.3 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | [Purpose] |
| `X-Content-Type-Options` | `nosniff` | [Purpose] |
| `X-Frame-Options` | `DENY` | [Purpose] |
| `X-XSS-Protection` | `1; mode=block` | [Purpose] |


## 9. Testing and Validation

### 9.1 Testing Environment

- **Test Base URL**: `[TEST_URL]`
- **Test Data**: [Test data availability]
- **Mock Services**: [Mock service availability]
- **Load Testing**: [Load testing capabilities]

### 9.2 Validation Tools

- **OpenAPI/Swagger**: [Swagger documentation URL]
- **Postman Collection**: [Postman collection URL]
- **Test Suite**: [Automated test suite details]
- **Performance Tests**: [Performance testing details]

### 9.3 Testing Scenarios

| Scenario | Description | Expected Result |
|----------|-------------|-----------------|
| [SCENARIO_1] | [Description] | [Expected Result] |
| [SCENARIO_2] | [Description] | [Expected Result] |
| [SCENARIO_3] | [Description] | [Expected Result] |


## 10. Documentation and Support

### 10.1 API Documentation

- **Interactive Docs**: [Swagger/OpenAPI URL]
- **Code Examples**: [Code example repository]
- **SDK Libraries**: [Available SDKs]
- **Postman Collection**: [Postman collection URL]

### 10.2 Support Channels

- **Developer Portal**: [Portal URL]
- **Documentation**: [Documentation URL]
- **Support Email**: [Support email]
- **Community Forum**: [Forum URL]
- **Status Page**: [Status page URL]

### 10.3 Getting Help

- **API Status**: [Status page URL]
- **Rate Limit Status**: [Rate limit dashboard]
- **Error Logs**: [Error log access]
- **Performance Metrics**: [Performance dashboard]


## Template Completion Checklist

- **Project Name**: Replaced all `[PROJECT_NAME]` placeholders
- **API Version**: Specified API version and status
- **Base URLs**: Defined all environment URLs
- **Authentication**: Specified authentication methods
- **Endpoints**: Defined core API endpoints
- **Data Models**: Created data structure definitions
- **Error Handling**: Defined error codes and responses
- **Rate Limiting**: Specified rate limits and quotas
- **Versioning**: Defined versioning strategy
- **Security**: Specified security requirements
- **Testing**: Defined testing approach
- **Documentation**: Specified support and documentation


## API Specification Best Practices

### Design Principles
1. **RESTful Design** - Follow REST principles consistently
2. **Clear Naming** - Use descriptive, consistent endpoint names
3. **Proper Status Codes** - Use appropriate HTTP status codes
4. **Comprehensive Documentation** - Document everything clearly
5. **Versioning Strategy** - Plan for API evolution

### Common Mistakes to Avoid
- [Missing] **Inconsistent naming** - Use consistent naming conventions
- [Missing] **Poor error handling** - Provide clear, actionable error messages
- [Missing] **Missing documentation** - Document all endpoints and parameters
- [Missing] **No versioning plan** - Plan for API changes and evolution
- [Missing] **Weak security** - Implement proper authentication and authorization


*This template ensures consistent, professional API specification documentation across all GTCX projects. Customize it for your specific needs while maintaining the established structure and quality standards.*
