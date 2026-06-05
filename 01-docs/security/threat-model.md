---
title: 'Threat Model — {System Name}'
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

# Threat Model — {System Name}

**Version:** {version}
**Classification:** {Public / Internal / Confidential / Secret}
**Threat model date:** {YYYY-MM-DD}
**Review cycle:** {Quarterly / Bi-annual / Annual}

---

## System Architecture for Threat Analysis

### System components

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
    - { Other systems }
```

### Data flow diagram

```
[User Device] → [CDN/WAF] → [Load Balancer] → [API Gateway]
                                                      ↓
[Cache Layer] ← [Application Services] → [Message Queue]
                            ↓
                    [Database Layer]
                            ↓
                    [Backup Storage]
```

---

## Threat Actors

### Actor profiles

| Actor type      | Motivation            | Capability    | Risk level |
| --------------- | --------------------- | ------------- | ---------- |
| Nation State    | Espionage, Disruption | Very High     | Critical   |
| Organized Crime | Financial Gain        | High          | High       |
| Hacktivist      | Ideological           | Medium        | Medium     |
| Insider Threat  | Various               | High (Access) | High       |
| Script Kiddie   | Recognition           | Low           | Low        |
| Competitor      | Business Intelligence | Medium        | Medium     |

### Insider threat categories

```yaml
Malicious_Insider:
  Description: 'Employee with intent to harm'
  Access_Level: 'Varies'
  Indicators:
    - Unusual access patterns
    - Large data downloads
    - After-hours activity

Negligent_Employee:
  Description: 'Unintentional security violations'
  Access_Level: 'Standard user'
  Common_Issues:
    - Password sharing
    - Clicking phishing links
    - Lost devices

Compromised_Account:
  Description: 'Legitimate account under attacker control'
  Access_Level: 'Varies'
  Detection:
    - Impossible travel
    - Unusual behavior
    - Failed MFA attempts
```

---

## STRIDE Threat Analysis

### Spoofing identity

| Component    | Threat           | Impact | Likelihood | Risk     | Mitigation              |
| ------------ | ---------------- | ------ | ---------- | -------- | ----------------------- |
| Login System | Credential theft | High   | Medium     | High     | MFA, Rate limiting      |
| API          | Token replay     | Medium | Low        | Medium   | Token expiration, Nonce |
| Email        | Phishing         | High   | High       | Critical | SPF/DKIM/DMARC          |

### Tampering with data

| Component | Threat                 | Impact   | Likelihood | Risk   | Mitigation                |
| --------- | ---------------------- | -------- | ---------- | ------ | ------------------------- |
| Database  | SQL Injection          | Critical | Medium     | High   | Parameterized queries     |
| API       | Parameter manipulation | Medium   | Medium     | Medium | Input validation          |
| Files     | Malware upload         | High     | Low        | Medium | File scanning, sandboxing |

### Repudiation

| Component     | Threat               | Impact | Likelihood | Risk   | Mitigation                         |
| ------------- | -------------------- | ------ | ---------- | ------ | ---------------------------------- |
| Transactions  | Denial of action     | High   | Low        | Medium | Audit logs, digital signatures     |
| Admin Actions | Unauthorized changes | High   | Low        | Medium | Change tracking, approval workflow |

### Information disclosure

| Component | Threat                 | Impact   | Likelihood | Risk     | Mitigation                    |
| --------- | ---------------------- | -------- | ---------- | -------- | ----------------------------- |
| Database  | Data breach            | Critical | Medium     | Critical | Encryption, access controls   |
| API       | Information leakage    | Medium   | High       | High     | Error handling, rate limiting |
| Logs      | Sensitive data in logs | High     | Medium     | High     | Log sanitization              |

### Denial of service

| Component | Threat              | Impact | Likelihood | Risk | Mitigation                             |
| --------- | ------------------- | ------ | ---------- | ---- | -------------------------------------- |
| API       | Rate limit abuse    | High   | High       | High | Rate limiting, DDoS protection         |
| Database  | Resource exhaustion | High   | Medium     | High | Query optimization, connection pooling |
| Storage   | Disk filling        | Medium | Low        | Low  | Quotas, monitoring                     |

### Elevation of privilege

| Component   | Threat               | Impact   | Likelihood | Risk | Mitigation                      |
| ----------- | -------------------- | -------- | ---------- | ---- | ------------------------------- |
| Application | Privilege escalation | Critical | Low        | High | RBAC, least privilege           |
| OS          | Container escape     | Critical | Low        | High | Security patches, hardening     |
| Cloud       | IAM misconfiguration | High     | Medium     | High | Regular audits, least privilege |

---

## Attack Trees

### Financial theft attack tree

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

### Data breach attack tree

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

---

## DREAD Risk Assessment

### Risk scoring matrix

| Factor              | Score 1–3         | Description                 |
| ------------------- | ----------------- | --------------------------- |
| **D**amage          | 1=Low, 3=Critical | How bad would an attack be? |
| **R**eproducibility | 1=Hard, 3=Easy    | How easy to reproduce?      |
| **E**xploitability  | 1=Hard, 3=Easy    | How much effort to exploit? |
| **A**ffected Users  | 1=Few, 3=All      | How many users affected?    |
| **D**iscoverability | 1=Hard, 3=Easy    | How easy to discover?       |

### Top risks by DREAD score

| Risk                   | D   | R   | E   | A   | D   | Total | Priority |
| ---------------------- | --- | --- | --- | --- | --- | ----- | -------- |
| SQL Injection          | 3   | 3   | 2   | 3   | 3   | 14    | Critical |
| Weak Authentication    | 3   | 3   | 3   | 3   | 2   | 14    | Critical |
| XSS                    | 2   | 3   | 3   | 2   | 3   | 13    | High     |
| CSRF                   | 2   | 3   | 2   | 2   | 2   | 11    | Medium   |
| Information Disclosure | 2   | 2   | 2   | 2   | 2   | 10    | Medium   |

---

## Attack Scenarios

### Scenario template

```yaml
Attack_Scenario:
  Name: '{Scenario name}'

  Attack_Path: 1. "{Step 1}"
    2. "{Step 2}"
    3. "{Step 3}"
    4. "{Step 4}"
    5. "{Step 5}"

  Impact:
    Financial: '{estimate or range}'
    Reputation: '{High / Medium / Low}'
    Regulatory: '{potential fines or obligations}'

  Current_Controls:
    - '{control 1}'
    - '{control 2}'

  Gaps:
    - '{gap 1}'
    - '{gap 2}'

  Recommendations:
    - '{action 1}'
    - '{action 2}'
```

### Scenario 1: Account takeover (phishing)

```yaml
Attack_Scenario:
  Name: 'Phishing-based Account Takeover'

  Attack_Path: 1. Attacker sends phishing email
    2. User clicks link and enters credentials
    3. Attacker captures credentials
    4. Attacker logs into account
    5. Attacker initiates fund transfer

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

### Scenario 2: Data breach (SQL injection)

```yaml
Attack_Scenario:
  Name: 'SQL Injection Data Breach'

  Attack_Path: 1. Attacker finds vulnerable input field
    2. Crafts SQL injection payload
    3. Extracts database schema
    4. Dumps user table
    5. Exfiltrates data

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

---

## Security Controls Mapping

### Preventive controls

| Threat        | Control           | Implementation   | Effectiveness |
| ------------- | ----------------- | ---------------- | ------------- |
| Injection     | Input Validation  | WAF + App Layer  | High          |
| Broken Auth   | MFA               | TOTP/WebAuthn    | High          |
| XSS           | CSP Headers       | Strict Policy    | Medium        |
| XXE           | XML Parser Config | Disable Entities | High          |
| Broken Access | RBAC              | Fine-grained     | High          |

### Detective controls

| Threat     | Control | Implementation      | Coverage |
| ---------- | ------- | ------------------- | -------- |
| Intrusion  | IDS/IPS | Network + Host      | {n}%     |
| Data Exfil | DLP     | Network + Endpoint  | {n}%     |
| Anomalies  | SIEM    | Centralized Logging | {n}%     |
| Malware    | EDR     | All Endpoints       | {n}%     |

### Corrective controls

| Incident   | Control           | RTO         | RPO         |
| ---------- | ----------------- | ----------- | ----------- |
| Ransomware | Backups           | {n} hours   | {n} hours   |
| DDoS       | Auto-scaling      | {n} minutes | 0           |
| Breach     | Incident Response | {n} hours   | N/A         |
| Corruption | Data Recovery     | {n} hours   | {n} minutes |

---

## Action Items

### Critical priority (immediate)

- [ ] {Critical action 1}
- [ ] {Critical action 2}
- [ ] {Critical action 3}

### High priority (30 days)

- [ ] {High action 1}
- [ ] {High action 2}
- [ ] {High action 3}

### Medium priority (90 days)

- [ ] {Medium action 1}
- [ ] {Medium action 2}

### Ongoing

- [ ] Monthly vulnerability scanning
- [ ] Quarterly penetration testing
- [ ] Annual threat model review
- [ ] Continuous security training

---

## Risk Heat Map

```
Impact ↑
  HIGH │ [ ][█][█]
   MED │ [ ][█][ ]
   LOW │ [ ][ ][ ]
       └───────────→
         L  M  H
       Likelihood

Legend: █ = Risk present  [ ] = No significant risk
```

---

## Threat Model Maintenance

### Review triggers

- Major architecture changes
- New feature deployment
- Security incident
- Regulatory changes
- Annual review cycle

### Update process

1. Identify system changes
2. Assess new threats
3. Evaluate control effectiveness
4. Update risk ratings
5. Define new mitigations
6. Get stakeholder approval
7. Implement controls
8. Verify effectiveness

---

## References and Standards

### Frameworks used

- STRIDE (Microsoft)
- DREAD (Microsoft)
- PASTA (Process for Attack Simulation)
- MITRE ATT&CK Framework
- OWASP Top 10

### Compliance alignment

- ISO 27001/27002
- NIST Cybersecurity Framework
- CIS Controls
- PCI DSS (where applicable)
- GDPR Article 32
