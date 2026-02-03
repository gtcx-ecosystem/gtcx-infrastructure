# Access Control Policy

*Version 1.0 | Aligned with P9 (Security by Design)*


## 1. Overview

This policy defines authentication, authorization, and access control requirements for all GTCX systems and services.

### Scope
- All production systems
- All development environments with production data access
- All API endpoints
- All administrative interfaces


## 2. Authentication Requirements

### 2.1 User Authentication

| System Type | Minimum Requirements |
|-------------|---------------------|
| Production Admin | MFA required + hardware key optional |
| API Access | API key + request signing |
| Mobile Apps | Biometric + PIN fallback |
| Field Operations | Biometric + offline validation (P8) |

### 2.2 Service Authentication

```typescript
// All service-to-service calls MUST be authenticated
interface ServiceCredential {
  serviceId: string;
  certificate: X509Certificate;
  permissions: Permission[];
  expiresAt: Date;
}
```

### 2.3 Offline Authentication (P8)

Field operations must work without network. Requirements:
- Cached credentials with cryptographic validation
- Time-limited offline tokens (max 72 hours)
- Sync required before token expiry
- Local biometric verification


## 3. Authorization Model

### 3.1 Role-Based Access Control (RBAC)

```yaml
Roles:
  system_admin:
    description: Full system access
    permissions: ["*"]
    requires_mfa: true
    audit_level: full
    
  platform_operator:
    description: Platform management
    permissions:
      - "platform:read"
      - "platform:write"
      - "users:read"
    requires_mfa: true
    
  field_inspector:
    description: Field verification operations
    permissions:
      - "verification:create"
      - "verification:read"
      - "geotag:create"
      - "credentials:read"
    offline_capable: true
    
  producer:
    description: Commodity producer
    permissions:
      - "own:read"
      - "own:write"
      - "verification:request"
    
  auditor:
    description: Read-only audit access
    permissions:
      - "*:read"
    audit_level: full
```

### 3.2 Permission Structure

```typescript
// Permission format: resource:action[:scope]
type Permission = 
  | `${Resource}:${Action}`
  | `${Resource}:${Action}:${Scope}`;

type Resource = 
  | 'verification' | 'credential' | 'geotag' 
  | 'platform' | 'users' | 'audit' | 'own';

type Action = 'create' | 'read' | 'write' | 'delete' | '*';

type Scope = 'own' | 'team' | 'org' | 'global';
```


## 4. Implementation Requirements

### 4.1 Type-Safe Authorization (P2)

```typescript
import { z } from 'zod';

// All permission checks MUST be type-safe
const PermissionSchema = z.object({
  userId: z.string().uuid(),
  resource: z.enum(['verification', 'credential', 'geotag']),
  action: z.enum(['create', 'read', 'write', 'delete']),
  resourceId: z.string().optional(),
});

async function checkPermission(
  request: z.infer<typeof PermissionSchema>
): Promise<boolean> {
  const validated = PermissionSchema.parse(request);
  // ... permission logic
}
```

### 4.2 Audit Logging (P12)

All access control decisions MUST be logged:

```typescript
interface AccessAuditLog {
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  decision: 'ALLOW' | 'DENY';
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}
```

### 4.3 Session Management

| Parameter | Production | Development |
|-----------|------------|-------------|
| Session timeout | 30 minutes | 8 hours |
| Refresh token lifetime | 7 days | 30 days |
| Max concurrent sessions | 3 | 10 |
| Session invalidation on password change | Required | Required |


## 5. API Security

### 5.1 API Key Management

- Keys MUST be rotated every 90 days
- Keys MUST have minimal necessary permissions
- Keys MUST be stored in secure vault (never in code)
- Keys MUST be scoped to specific services

### 5.2 Request Signing

All API requests to sensitive endpoints MUST be signed:

```typescript
interface SignedRequest {
  timestamp: string;      // ISO 8601
  nonce: string;          // Unique per request
  signature: string;      // HMAC-SHA256 of canonical request
  keyId: string;          // API key identifier
}
```


## 6. Compliance Checklist

```yaml
Authentication:
  - [ ] MFA enabled for all admin accounts
  - [ ] Service accounts use certificates
  - [ ] Offline auth tokens properly scoped
  - [ ] Biometric fallback to PIN only

Authorization:
  - [ ] RBAC implemented and documented
  - [ ] Permissions follow least privilege
  - [ ] All access decisions logged
  - [ ] Regular permission audits scheduled

API_Security:
  - [ ] All API keys in secure vault
  - [ ] Key rotation automated
  - [ ] Request signing implemented
  - [ ] Rate limiting enabled
```


## 7. Violations

| Severity | Example | Response |
|----------|---------|----------|
| Critical | Hardcoded credentials | Immediate revocation, security review |
| High | Missing MFA on admin | 24-hour remediation |
| Medium | Excessive permissions | 7-day remediation |
| Low | Missing audit log | 30-day remediation |


*Policy Owner: Security Team*  
*Last Updated: January 2025*  
*Next Review: April 2025*
