---
title: 'Security Architecture — {Project Name}'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Security Architecture — {Project Name}

**Security level:** {Critical / High / Medium / Standard}
**Compliance requirements:** {GDPR / SOC2 / PCI-DSS / HIPAA / other}
**Risk tolerance:** {Zero / Low / Medium}
**Last security review:** {YYYY-MM-DD}

---

## Security Architecture Layers

### Defense in depth model

```
┌──────────────────────────────────────────────────────┐
│                    Perimeter Security                 │
│  WAF, DDoS Protection, Rate Limiting, Geo-blocking   │
├──────────────────────────────────────────────────────┤
│                    Network Security                   │
│     VPC, Subnets, Security Groups, NACLs, VPN       │
├──────────────────────────────────────────────────────┤
│                  Application Security                 │
│   Authentication, Authorization, Input Validation     │
├──────────────────────────────────────────────────────┤
│                     Data Security                     │
│    Encryption at Rest, Encryption in Transit, DLP    │
├──────────────────────────────────────────────────────┤
│                    Identity & Access                  │
│      IAM, MFA, SSO, RBAC, Least Privilege           │
└──────────────────────────────────────────────────────┘
```

---

## Authentication and Authorization

### Authentication architecture

```yaml
Authentication_Methods:
  Primary:
    Type: 'OAuth 2.0 / OpenID Connect'
    Provider: '{Auth0 / Cognito / Custom}'
    MFA:
      Required: true
      Methods: ['TOTP', 'SMS', 'WebAuthn']

  Service_to_Service:
    Type: 'mTLS / API Keys / JWT'
    Rotation: '90 days'

  Session_Management:
    Storage: '{Redis / JWT}'
    Duration: '{n} minutes'
    Refresh: '{n} days'
    Concurrent_Sessions: { n }
```

### Authorization model

```typescript
// Role-Based Access Control (RBAC)
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
  conditions?: Condition[];
}

// Attribute-Based Access Control (ABAC)
interface Policy {
  id: string;
  effect: 'allow' | 'deny';
  principal: Principal;
  action: string[];
  resource: string[];
  condition?: {
    ipAddress?: string[];
    timeRange?: { start: Date; end: Date };
    mfaRequired?: boolean;
  };
}

class AuthorizationService {
  async authorize(user: User, resource: string, action: string): Promise<boolean> {
    const hasRolePermission = user.roles.some((role) =>
      role.permissions.some(
        (permission) => permission.resource === resource && permission.actions.includes(action)
      )
    );

    const policies = await this.getPolicies(user, resource, action);
    const hasPolicy = this.evaluatePolicies(policies, {
      user,
      resource,
      action,
      context: this.getContext(),
    });

    return hasRolePermission && hasPolicy;
  }
}
```

---

## Data Security

### Encryption standards

```yaml
Encryption_at_Rest:
  Algorithm: 'AES-256-GCM'
  Key_Management: '{AWS KMS / HashiCorp Vault}'
  Key_Rotation: 'Yearly'

  Database:
    Type: 'Transparent Data Encryption'
    Backup_Encryption: true

  File_Storage:
    Type: 'Server-Side Encryption'
    Customer_Managed_Keys: true

Encryption_in_Transit:
  TLS_Version: '1.3 minimum'
  Cipher_Suites:
    - 'TLS_AES_256_GCM_SHA384'
    - 'TLS_AES_128_GCM_SHA256'

  Certificate_Management:
    Provider: "{Let's Encrypt / DigiCert}"
    Renewal: 'Automated'
    Validation: '{Domain / Organization}'
```

### Data classification

```yaml
Data_Classifications:
  Critical:
    Description: 'Payment info, credentials, keys'
    Encryption: 'Required'
    Access: 'Need-to-know only'
    Retention: 'As required by law'

  Sensitive:
    Description: 'PII, health records, financial data'
    Encryption: 'Required'
    Access: 'Role-based'
    Retention: '{n} years'

  Internal:
    Description: 'Business data, strategies'
    Encryption: 'Recommended'
    Access: 'Employee only'
    Retention: '{n} years'

  Public:
    Description: 'Marketing, public docs'
    Encryption: 'Optional'
    Access: 'Unrestricted'
    Retention: 'Indefinite'
```

### Data Loss Prevention (DLP)

```typescript
interface DLPPolicy {
  name: string;
  patterns: RegExp[];
  actions: DLPAction[];
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const dlpPolicies: DLPPolicy[] = [
  {
    name: 'Credit Card Detection',
    patterns: [/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/],
    actions: ['block', 'alert', 'log'],
    severity: 'critical',
  },
  {
    name: 'API Key Detection',
    // Pattern: match your key format — e.g. {prefix}_[env]_[random-32]
    patterns: [/{prefix}_[a-zA-Z]+_[a-zA-Z0-9]{32}/],
    actions: ['redact', 'alert', 'log'],
    severity: 'high',
  },
];
```

---

## Network Security

### Network architecture

```yaml
VPC_Configuration:
  CIDR: '{10.0.0.0/16}'

  Subnets:
    Public:
      - '{10.0.1.0/24}' # Load Balancers
      - '{10.0.2.0/24}' # NAT Gateways

    Private:
      - '{10.0.10.0/24}' # Application Servers
      - '{10.0.11.0/24}' # Application Servers

    Database:
      - '{10.0.20.0/24}' # Database Primary
      - '{10.0.21.0/24}' # Database Replica

  Security_Groups:
    Web_Tier:
      Inbound:
        - Protocol: 'HTTPS'
          Port: 443
          Source: '0.0.0.0/0'
      Outbound:
        - Protocol: 'ALL'
          Destination: 'Application_Tier_SG'

    App_Tier:
      Inbound:
        - Protocol: 'HTTP'
          Port: 8080
          Source: 'Web_Tier_SG'
      Outbound:
        - Protocol: 'PostgreSQL'
          Port: 5432
          Destination: 'Database_Tier_SG'
```

### Web Application Firewall (WAF)

```yaml
WAF_Rules:
  Core_Rule_Set: 'OWASP CRS 3.3'

  Custom_Rules:
    - Name: 'Block SQL Injection'
      Pattern: '(?i)(union|select|insert|update|delete|drop)'
      Action: 'Block'

    - Name: 'Rate Limiting'
      Condition: 'Requests > {n}/minute from same IP'
      Action: 'Throttle'

    - Name: 'Geo Blocking'
      Condition: 'Country not in allowed list'
      Action: 'Block'

  IP_Reputation:
    Provider: '{AWS / Cloudflare}'
    Block_Threshold: 'High Risk'
```

---

## Threat Detection and Response

### Security monitoring

```yaml
SIEM_Configuration:
  Platform: '{Splunk / ELK / Datadog}'

  Log_Sources:
    - Application logs
    - Infrastructure logs
    - Security service logs
    - Database audit logs
    - Network flow logs

  Alert_Rules:
    Critical:
      - 'Multiple failed authentication attempts'
      - 'Privilege escalation detected'
      - 'Data exfiltration patterns'
      - 'Known malware signatures'

    High:
      - 'Unusual API usage patterns'
      - 'Configuration changes'
      - 'New admin account created'
      - 'Large data transfers'
```

### Incident response plan

```yaml
Incident_Response_Phases:
  1_Detection:
    - Automated alerting
    - Security monitoring
    - User reports

  2_Containment:
    - Isolate affected systems
    - Disable compromised accounts
    - Block malicious IPs

  3_Eradication:
    - Remove malware
    - Patch vulnerabilities
    - Reset credentials

  4_Recovery:
    - Restore from backups
    - Verify system integrity
    - Resume normal operations

  5_Lessons_Learned:
    - Post-incident review
    - Update security controls
    - Improve detection rules

Response_Team:
  Security_Lead: '{name / role}'
  Technical_Lead: '{name / role}'
  Communications: '{name / role}'
  Legal_Compliance: '{name / role}'
```

### Security automation

```typescript
class SecurityOrchestrator {
  async handleThreat(threat: ThreatIndicator): Promise<void> {
    const severity = await this.assessSeverity(threat);

    switch (severity) {
      case 'CRITICAL':
        await this.blockIP(threat.sourceIP);
        await this.disableAccount(threat.userId);
        await this.alertSecurityTeam(threat);
        await this.createIncident(threat);
        break;

      case 'HIGH':
        await this.increasedMonitoring(threat.userId);
        await this.requireMFA(threat.userId);
        await this.alertSecurityTeam(threat);
        break;

      case 'MEDIUM':
        await this.logSecurityEvent(threat);
        await this.notifyUser(threat.userId);
        break;
    }
  }
}
```

---

## Vulnerability Management

### Vulnerability scanning

```yaml
Scanning_Strategy:
  SAST:
    Tool: '{SonarQube / Checkmarx}'
    Frequency: 'Every commit'
    Quality_Gate: 'No critical/high vulnerabilities'

  DAST:
    Tool: '{OWASP ZAP / Burp Suite}'
    Frequency: 'Weekly'
    Environments: ['Staging', 'Production']

  Dependency_Scanning:
    Tool: '{Snyk / Dependabot}'
    Frequency: 'Daily'
    Auto_Update: 'Minor versions only'

  Container_Scanning:
    Tool: '{Trivy / Clair}'
    Frequency: 'Every build'
    Registry_Scan: 'Continuous'
```

### Penetration testing

```yaml
Penetration_Testing:
  Frequency: '{Quarterly / Bi-annual}'
  Scope:
    - External network
    - Web applications
    - Mobile applications
    - Social engineering

  Methodology: 'OWASP / PTES'

  Remediation_SLA:
    Critical: '24 hours'
    High: '7 days'
    Medium: '30 days'
    Low: '90 days'
```

---

## Application Security

### Secure coding standards

```typescript
// Input Validation
class InputValidator {
  sanitize(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/[<>'"]/g, '');
  }

  validateEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 1_000_000;
  }
}

// SQL Injection Prevention
class SecureDatabase {
  async query(sql: string, params: unknown[]): Promise<unknown> {
    // Always use parameterized queries — never concatenate user input
    return this.db.query(sql, params);
  }
}

// CSRF Protection
app.use(
  csrf({
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    },
  })
);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

---

## Secrets Management

### Secret storage

```yaml
Secret_Management:
  Solution: '{HashiCorp Vault / AWS Secrets Manager}'

  Secret_Types:
    API_Keys:
      Rotation: '90 days'
      Format: '{env}_{service}_{random}'

    Database_Credentials:
      Rotation: '30 days'
      Dynamic: true

    Encryption_Keys:
      Rotation: 'Yearly'
      Algorithm: 'AES-256'

    Certificates:
      Renewal: '30 days before expiry'
      Storage: '{Hardware Security Module}'
```

### Secret rotation

```typescript
class SecretRotator {
  async rotateSecret(secretName: string): Promise<void> {
    const newSecret = await this.generateSecret();

    await this.vault.update(secretName, newSecret, {
      version: 'AWSPENDING',
    });

    await this.testSecret(secretName, newSecret);

    await this.vault.promote(secretName, 'AWSPENDING', 'AWSCURRENT');

    await this.vault.deprecate(secretName, 'AWSPREVIOUS');
  }
}
```

---

## Security Metrics

| Metric                        | Target |
| ----------------------------- | ------ |
| Vulnerability scan coverage   | 100%   |
| Critical vulnerabilities open | 0      |
| Mean time to patch (critical) | < 24h  |
| Security training completion  | 100%   |
| Incident response time        | < 1h   |
| Failed authentication rate    | < {n}% |
| Encryption coverage           | 100%   |

### Compliance tracking

```yaml
Compliance_Status:
  { Framework_1 }:
    Status: '{Compliant / In Progress / Not Started}'
    Last_Audit: '{YYYY-MM-DD}'
    Next_Audit: '{YYYY-MM-DD}'

  { Framework_2 }:
    Status: '{Compliant / In Progress / Not Started}'
    Completion: '{n}%'
    Target_Date: '{YYYY-MM-DD}'
```

---

## Security Training

```yaml
Security_Training:
  Onboarding:
    - Security fundamentals
    - '{Product} security policies'
    - Secure coding practices
    - Incident reporting

  Annual_Training:
    - OWASP Top 10
    - Social engineering
    - Data handling
    - Compliance requirements

  Role_Specific:
    Developers:
      - Secure SDLC
      - Code review practices
      - Vulnerability remediation

    Operations:
      - Infrastructure security
      - Incident response
      - Security monitoring
```

---

## Checklist

- [ ] Defense in depth layers defined
- [ ] Authentication architecture documented
- [ ] RBAC and ABAC models implemented
- [ ] Data classification scheme applied
- [ ] Encryption standards documented (at-rest and in-transit)
- [ ] Network segmentation and security groups defined
- [ ] WAF rules configured
- [ ] SIEM configured with alert rules
- [ ] Incident response team and phases defined
- [ ] Vulnerability scanning pipeline active
- [ ] Pen testing scheduled
- [ ] Secrets management solution deployed with rotation
- [ ] Secure coding standards documented and enforced
- [ ] Security metrics tracked
- [ ] Compliance frameworks mapped and tracked
- [ ] Security training program active
