# Data Protection Policy

_Version 1.0 | Aligned with P8 (Offline-First), P9 (Security by Design)_

## 1. Overview

This policy defines data protection requirements for all GTCX systems, with special consideration for offline-first operations in frontier markets.

### Scope

- All personal data (PII)
- All verification records
- All cryptographic materials
- All audit logs

## 2. Data Classification

### 2.1 Classification Levels

| Level            | Description           | Examples                | Storage             | Transmission      |
| ---------------- | --------------------- | ----------------------- | ------------------- | ----------------- |
| **Critical**     | Cryptographic secrets | Private keys, HSM seeds | HSM only            | Never transmitted |
| **Restricted**   | Authentication data   | Passwords, biometrics   | Encrypted + hashed  | TLS 1.3 only      |
| **Confidential** | Personal data         | Names, IDs, locations   | Encrypted at rest   | TLS 1.3           |
| **Internal**     | Business data         | Verification records    | Encrypted at rest   | TLS 1.2+          |
| **Public**       | Published data        | Compliance scores       | No special handling | Any               |

### 2.2 Data Inventory

```typescript
// Every data field MUST be classified
interface DataField {
  name: string;
  classification: 'CRITICAL' | 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';
  piiType?: 'DIRECT' | 'INDIRECT' | 'SENSITIVE';
  retentionDays: number;
  encryptionRequired: boolean;
  offlineAccessible: boolean; // P8
}
```

## 3. Encryption Requirements

### 3.1 Encryption at Rest

| Data Classification | Algorithm      | Key Length |
| ------------------- | -------------- | ---------- |
| Critical            | N/A (HSM only) | -          |
| Restricted          | AES-256-GCM    | 256-bit    |
| Confidential        | AES-256-GCM    | 256-bit    |
| Internal            | AES-256-GCM    | 256-bit    |

### 3.2 Encryption in Transit

```yaml
TLS_Requirements:
  minimum_version: '1.2'
  preferred_version: '1.3'

  cipher_suites:
    - TLS_AES_256_GCM_SHA384
    - TLS_CHACHA20_POLY1305_SHA256
    - TLS_AES_128_GCM_SHA256

  certificate_pinning:
    mobile_apps: required
    api_clients: recommended
```

### 3.3 Offline Encryption (P8)

Field devices must protect data without network access:

```typescript
// Offline data protection requirements
interface OfflineStorage {
  // Device-bound key derived from hardware + user PIN
  keyDerivation: 'ARGON2ID';
  keyLength: 256;

  // Local database encryption
  databaseEncryption: 'SQLCIPHER';

  // Maximum offline data age before re-auth required
  maxOfflineAgeHours: 72;

  // Secure deletion on too many failed attempts
  maxFailedAttempts: 10;
  wipeOnExceed: true;
}
```

## 4. Data Handling

### 4.1 Collection Minimization

- Collect ONLY data required for the specific purpose
- Document justification for each data field
- Review data collection quarterly

### 4.2 Purpose Limitation

```typescript
// Data use MUST be validated against purpose
const DataPurposeSchema = z.object({
  dataField: z.string(),
  purposes: z.array(
    z.enum([
      'VERIFICATION', // Core verification function
      'COMPLIANCE', // Regulatory compliance
      'ANALYTICS', // Anonymized analytics
      'SUPPORT', // Customer support
      'LEGAL', // Legal requirements
    ])
  ),
  consentRequired: z.boolean(),
  consentObtained: z.boolean().optional(),
});
```

### 4.3 Data Retention

| Data Type            | Retention   | Archive      | Deletion    |
| -------------------- | ----------- | ------------ | ----------- |
| Verification records | 7 years     | After 1 year | Hard delete |
| Audit logs           | 10 years    | After 1 year | Hard delete |
| Personal data        | Per consent | N/A          | On request  |
| Session data         | 30 days     | N/A          | Hard delete |
| Analytics            | 2 years     | Anonymized   | Aggregate   |

## 5. Privacy Requirements

### 5.1 Privacy by Design

- Default to most privacy-preserving option
- Implement data minimization at design phase
- Use zero-knowledge proofs where possible
- Enable user data portability and deletion

### 5.2 User Rights

| Right         | Implementation      | Response Time |
| ------------- | ------------------- | ------------- |
| Access        | Self-service portal | Immediate     |
| Rectification | Support request     | 72 hours      |
| Erasure       | Support request     | 30 days       |
| Portability   | Self-service export | Immediate     |
| Objection     | Support request     | 72 hours      |

### 5.3 Consent Management

```typescript
interface Consent {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  expiresAt?: Date;
  source: 'EXPLICIT' | 'IMPLICIT';
  withdrawable: boolean;
}
```

## 6. Cross-Border Data Transfer

### 6.1 Transfer Requirements

- Assess data protection laws in destination country
- Implement appropriate safeguards (SCCs, BCRs)
- Document transfer justification
- Encrypt all data in transit

### 6.2 Sovereignty Preservation

GTCX is designed to respect data sovereignty:

```yaml
Data_Localization:
  principle: 'Data stays in jurisdiction unless required'

  requirements:
    - Government data: NEVER leaves jurisdiction
    - Producer PII: Stored in producer's country
    - Verification proofs: Can be shared (cryptographic only)
    - Aggregated analytics: Can be shared (anonymized)
```

## 7. Compliance Checklist

```yaml
Encryption:
  - [ ] All data at rest encrypted
  - [ ] TLS 1.2+ for all connections
  - [ ] Certificate pinning in mobile apps
  - [ ] Offline encryption implemented (P8)

Privacy:
  - [ ] Data minimization documented
  - [ ] Consent management implemented
  - [ ] User rights portal available
  - [ ] Retention policies enforced

Cross_Border:
  - [ ] Transfer assessments completed
  - [ ] Safeguards documented
  - [ ] Sovereignty requirements met
```

## 8. Incident Handling

Data protection incidents follow the [Incident Response Policy](./incident-response.md).

Special requirements for data breaches:

- Notify affected users within 72 hours
- Notify regulators as required by jurisdiction
- Document breach scope and response
- Implement preventive measures

_Policy Owner: Security Team_  
_Last Updated: January 2025_  
_Next Review: April 2025_
