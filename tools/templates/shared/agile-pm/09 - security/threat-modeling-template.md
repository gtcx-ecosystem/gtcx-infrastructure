# Threat Modeling Template

## System Overview
**System Name**: [SYSTEM_NAME]  
**Version**: [VERSION]  
**Classification**: [Public/Internal/Confidential/Secret]  
**Threat Model Date**: [DATE]  
**Review Cycle**: [Quarterly/Bi-annual/Annual]


## System Architecture for Threat Analysis

### System Components
```yaml
Components:
  Frontend:
    - Web Application
    - Mobile Apps (iOS/Android)
    - Admin Portal
    
  Backend:
    - API Gateway
    - Microservices
    - Message Queue
    - Cache Layer
    
  Data_Stores:
    - Primary Database
    - Document Store
    - Object Storage
    - Analytics Database
    
  External_Integrations:
    - Payment Processors
    - Identity Providers
    - Third-party APIs
    - Government Systems
```

### Data Flow Diagram
```
[User Device] → [CDN/WAF] → [Load Balancer] → [API Gateway]
                                                      ↓
[Cache Layer] ← [Application Services] → [Message Queue]
                            ↓
                    [Database Layer]
                            ↓
                    [Backup Storage]
```


## Threat Actors

### Actor Profiles
| Actor Type | Motivation | Capability | Risk Level |
|------------|------------|------------|------------|
| **Nation State** | Espionage, Disruption | Very High | Critical |
| **Organized Crime** | Financial Gain | High | High |
| **Hacktivist** | Ideological | Medium | Medium |
| **Insider Threat** | Various | High (Access) | High |
| **Script Kiddie** | Recognition | Low | Low |
| **Competitor** | Business Intelligence | Medium | Medium |

### Insider Threat Categories
```yaml
Malicious_Insider:
  Description: "Employee with intent to harm"
  Access_Level: "Varies"
  Indicators:
    - Unusual access patterns
    - Large data downloads
    - After-hours activity
    
Negligent_Employee:
  Description: "Unintentional security violations"
  Access_Level: "Standard user"
  Common_Issues:
    - Password sharing
    - Clicking phishing links
    - Lost devices
    
Compromised_Account:
  Description: "Legitimate account under attacker control"
  Access_Level: "Varies"
  Detection:
    - Impossible travel
    - Unusual behavior
    - Failed MFA attempts
```


## STRIDE Threat Analysis

### Spoofing Identity
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| Login System | Credential theft | High | Medium | High | MFA, Rate limiting |
| API | Token replay | Medium | Low | Medium | Token expiration, Nonce |
| Email | Phishing | High | High | Critical | SPF/DKIM/DMARC |

### Tampering with Data
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| Database | SQL Injection | Critical | Medium | High | Parameterized queries |
| API | Parameter manipulation | Medium | Medium | Medium | Input validation |
| Files | Malware upload | High | Low | Medium | File scanning, sandboxing |

### Repudiation
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| Transactions | Denial of action | High | Low | Medium | Audit logs, digital signatures |
| Admin Actions | Unauthorized changes | High | Low | Medium | Change tracking, approval workflow |

### Information Disclosure
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| Database | Data breach | Critical | Medium | Critical | Encryption, access controls |
| API | Information leakage | Medium | High | High | Error handling, rate limiting |
| Logs | Sensitive data in logs | High | Medium | High | Log sanitization |

### Denial of Service
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| API | Rate limit abuse | High | High | High | Rate limiting, DDoS protection |
| Database | Resource exhaustion | High | Medium | High | Query optimization, connection pooling |
| Storage | Disk filling | Medium | Low | Low | Quotas, monitoring |

### Elevation of Privilege
| Component | Threat | Impact | Likelihood | Risk | Mitigation |
|-----------|--------|--------|------------|------|------------|
| Application | Privilege escalation | Critical | Low | High | RBAC, least privilege |
| OS | Container escape | Critical | Low | High | Security patches, hardening |
| Cloud | IAM misconfiguration | High | Medium | High | Regular audits, principle of least privilege |


## Attack Trees

### Financial Theft Attack Tree
```
Goal: Steal Funds
├── Compromise User Account
│   ├── Phishing Attack
│   │   ├── Email Phishing
│   │   └── SMS Phishing
│   ├── Credential Stuffing
│   └── Social Engineering
├── Exploit Application Vulnerability
│   ├── SQL Injection
│   ├── XSS for Session Hijacking
│   └── CSRF Attack
└── Insider Threat
    ├── Rogue Employee
    └── Compromised Admin
```

### Data Breach Attack Tree
```
Goal: Exfiltrate Sensitive Data
├── Direct Database Access
│   ├── SQL Injection
│   ├── Backup Theft
│   └── Database Misconfiguration
├── Application Layer Attack
│   ├── API Abuse
│   ├── Broken Access Control
│   └── Information Disclosure
└── Supply Chain Attack
    ├── Compromised Dependency
    └── Third-party Integration
```


## DREAD Risk Assessment

### Risk Scoring Matrix
| Factor | Score 1-3 | Description |
|--------|-----------|-------------|
| **D**amage | 1=Low, 3=Critical | How bad would an attack be? |
| **R**eproducibility | 1=Hard, 3=Easy | How easy to reproduce? |
| **E**xploitability | 1=Hard, 3=Easy | How much effort to exploit? |
| **A**ffected Users | 1=Few, 3=All | How many users affected? |
| **D**iscoverability | 1=Hard, 3=Easy | How easy to discover? |

### Top Risks by DREAD Score
| Risk | D | R | E | A | D | Total | Priority |
|------|---|---|---|---|---|-------|----------|
| SQL Injection | 3 | 3 | 2 | 3 | 3 | 14 | Critical |
| Weak Authentication | 3 | 3 | 3 | 3 | 2 | 14 | Critical |
| XSS | 2 | 3 | 3 | 2 | 3 | 13 | High |
| CSRF | 2 | 3 | 2 | 2 | 2 | 11 | Medium |
| Information Disclosure | 2 | 2 | 2 | 2 | 2 | 10 | Medium |


## Attack Scenarios

### Scenario 1: Account Takeover
```yaml
Attack_Scenario:
  Name: "Phishing-based Account Takeover"
  
  Attack_Path:
    1. Attacker sends phishing email
    2. User clicks link and enters credentials
    3. Attacker captures credentials
    4. Attacker logs into account
    5. Attacker initiates fund transfer
  
  Impact:
    Financial: "$10,000 average loss"
    Reputation: "High - customer trust"
    Regulatory: "Potential fines"
  
  Current_Controls:
    - Email filtering
    - MFA (optional)
    - Fraud detection
  
  Gaps:
    - MFA not mandatory
    - Limited user training
    - No behavioral analytics
  
  Recommendations:
    - Mandatory MFA
    - Security awareness training
    - Implement UEBA
    - Transaction verification
```

### Scenario 2: Data Breach
```yaml
Attack_Scenario:
  Name: "SQL Injection Data Breach"
  
  Attack_Path:
    1. Attacker finds vulnerable input field
    2. Crafts SQL injection payload
    3. Extracts database schema
    4. Dumps user table
    5. Exfiltrates data
  
  Impact:
    Records: "1M+ user records"
    Financial: "$4M in fines and remediation"
    Reputation: "Critical damage"
  
  Current_Controls:
    - WAF rules
    - Some parameterized queries
    - Database monitoring
  
  Gaps:
    - Inconsistent input validation
    - Not all queries parameterized
    - Limited database encryption
  
  Recommendations:
    - Complete parameterization
    - Input validation framework
    - Database activity monitoring
    - Field-level encryption
```


## Security Controls Mapping

### Preventive Controls
| Threat | Control | Implementation | Effectiveness |
|--------|---------|----------------|---------------|
| Injection | Input Validation | WAF + App Layer | High |
| Broken Auth | MFA | TOTP/WebAuthn | High |
| XSS | CSP Headers | Strict Policy | Medium |
| XXE | XML Parser Config | Disable Entities | High |
| Broken Access | RBAC | Fine-grained | High |

### Detective Controls
| Threat | Control | Implementation | Coverage |
|--------|---------|----------------|----------|
| Intrusion | IDS/IPS | Network + Host | 85% |
| Data Exfil | DLP | Network + Endpoint | 70% |
| Anomalies | SIEM | Centralized Logging | 90% |
| Malware | EDR | All Endpoints | 100% |

### Corrective Controls
| Incident | Control | RTO | RPO |
|----------|---------|-----|-----|
| Ransomware | Backups | 4 hours | 1 hour |
| DDoS | Auto-scaling | 5 minutes | 0 |
| Breach | Incident Response | 1 hour | N/A |
| Corruption | Data Recovery | 2 hours | 15 minutes |


## Threat Model Action Items

### Critical Priority (Immediate)
- Implement mandatory MFA for all users
- Complete SQL injection remediation
- Deploy comprehensive WAF rules
- Enable database encryption

### High Priority (30 days)
- Implement SIEM solution
- Complete security training program
- Deploy DLP policies
- Implement behavioral analytics

### Medium Priority (90 days)
- Zero-trust architecture planning
- Enhanced monitoring capabilities
- Third-party risk assessment
- Disaster recovery testing

### Ongoing Activities
- Monthly vulnerability scanning
- Quarterly penetration testing
- Annual threat model review
- Continuous security training


## Risk Heat Map

```
Impact ↑
  HIGH │ [ ][█][█]
   MED │ [ ][█][ ]
   LOW │ [ ][ ][ ]
       └───────────→
         L  M  H
       Likelihood
       
Legend: █ = Risk Present
        [ ] = No significant risk
```


## Threat Model Maintenance

### Review Triggers
- Major architecture changes
- New feature deployment
- Security incident
- Regulatory changes
- Annual review cycle

### Update Process
1. Identify system changes
2. Assess new threats
3. Evaluate control effectiveness
4. Update risk ratings
5. Define new mitigations
6. Get stakeholder approval
7. Implement controls
8. Verify effectiveness


## References & Standards

### Frameworks Used
- STRIDE (Microsoft)
- DREAD (Microsoft)
- PASTA (Process for Attack Simulation)
- MITRE ATT&CK Framework
- OWASP Top 10

### Compliance Alignment
- ISO 27001/27002
- NIST Cybersecurity Framework
- CIS Controls
- PCI DSS (where applicable)
- GDPR Article 32


*This threat model is a living document and should be updated regularly to reflect the evolving threat landscape and system changes.*
