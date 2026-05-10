# System Architecture Specification — {system-name}

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> Formal security-focused specification. For the lightweight component design doc, see system-design-template.md (`system-design-template.md`).

---

## 1. Architectural Overview

### 1.1 Principles

- **Data sovereignty**: {policy}
- **Zero trust**: {policy}
- **Consistency model**: {model — eventual / strong / causal}
- **Offline-first**: {strategy — if applicable}
- **Observability-first**: {strategy}

### 1.2 Component Architecture

{High-level diagram or description of services/components with responsibilities, dependencies, and interfaces.}

### 1.3 Deployment Topology

| Model   | Use Case   | Min Nodes | Data Residency  | Availability |
| ------- | ---------- | --------- | --------------- | ------------ |
| {model} | {use case} | {n}       | {region/policy} | {SLA}        |

---

## 2. Security Architecture

### 2.1 Security Layers

| Layer         | Controls                                          |
| ------------- | ------------------------------------------------- |
| Network       | {WAF, DDoS protection, segmentation}              |
| Application   | {input validation, output encoding, CSRF}         |
| Identity      | {AuthN method, MFA, session policy}               |
| Data          | {encryption at rest, classification, masking}     |
| Cryptographic | {algorithms, key management}                      |
| Operational   | {audit logging, incident response, patch cadence} |

### 2.2 Threat Model

| Threat Category | Specific Threat | Mitigation   | Residual Risk |
| --------------- | --------------- | ------------ | ------------- |
| {category}      | {threat}        | {mitigation} | {risk level}  |

### 2.3 Authentication & Authorization

- **Authentication methods**: {JWT / OAuth 2.0 / mTLS / API key}
- **Authorization model**: {RBAC / ABAC / policy-based}
- **Session/token policies**: {timeout, refresh, revocation}

---

## 3. Cryptographic Specifications

- **Digital signatures**: {algorithms, key sizes, padding — e.g. Ed25519, RSA-PSS 4096}
- **Hash functions**: {e.g. SHA-256, SHA-3}
- **Symmetric encryption**: {e.g. AES-256-GCM}
- **Key management**: {HSM / KMS / rotation cadence}
- **Merkle / proof systems**: {if applicable}
- **ZK proofs**: {if applicable}

---

## 4. Data Model Specifications

{Define core entities — include DDL or TypeScript interfaces, constraints, indexes, and integrity rules.}

```sql
-- Example
CREATE TABLE {entity} (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  {field_1}   {type} NOT NULL,
  {field_2}   {type},
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_{entity}_{field} ON {entity} ({field_1});
```

---

## 5. Network & Protocol Specifications

- **Inter-service protocol**: {gRPC / REST / message queue}
- **Serialization**: {Protobuf / JSON / Avro}
- **Transport security**: {mTLS / TLS 1.3}
- **Message formats**: {link to schema definitions}
- **Consensus / coordination**: {if applicable — Raft, Paxos, etc.}

---

## 6. Performance Requirements

| Operation     | P50  | P95  | P99  |
| ------------- | ---- | ---- | ---- |
| {operation-1} | {ms} | {ms} | {ms} |
| {operation-2} | {ms} | {ms} | {ms} |

**Throughput**: {TPS target per component}

**Scalability targets**: {records, concurrent users, regions}

---

## 7. Compliance Matrix

| Control     | Standard        | Requirement   | Implementation   | Status   |
| ----------- | --------------- | ------------- | ---------------- | -------- |
| {control-1} | ISO 27001 A.{x} | {requirement} | {implementation} | {status} |
| {control-2} | OWASP Top 10    | {requirement} | {implementation} | {status} |
| {control-3} | GDPR Art. {x}   | {requirement} | {implementation} | {status} |
| {control-4} | NIST {control}  | {requirement} | {implementation} | {status} |

---

## 8. Document Control

| Version | Date   | Author   | Changes         |
| ------- | ------ | -------- | --------------- |
| 1.0.0   | {date} | {author} | Initial version |

**Appendices**:

- {link to proof systems / crypto library choices}
- {link to migration plan}
- {link to DR runbook}
