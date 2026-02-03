# System Architecture Specification Template - [PROJECT_NAME]

## Document Information
- Project: [PROJECT_NAME]
- Version: [VERSION]
- Date: [DATE]
- Architect(s): [ARCHITECT_LIST]
- Reviewers: [REVIEWER_LIST]
- Status: [Draft/Review/Approved]
- Classification: [INTERNAL/CONFIDENTIAL/PUBLIC]


## Table of Contents
1. Architectural Overview
2. Security Architecture
3. Cryptographic Specifications
4. Data Model Specifications
5. Network/Protocol Specifications
6. Performance Requirements
7. Compliance Matrix
8. Appendices & Document Control


## 1. Architectural Overview

### 1.1 Principles
- Data Sovereignty: [policy]
- Zero Trust: [policy]
- Consistency Model: [model]
- Offline-First: [strategy]
- Observability-First: [strategy]

### 1.2 Component Architecture
Provide a high-level diagram and list of services/components with responsibilities, dependencies, and interfaces.

### 1.3 Deployment Topology
| Model | Use Case | Min Nodes | Data Residency | Availability |
|------|----------|-----------|----------------|--------------|
| [Model] | [Use case] | [N] | [Residency] | [SLA] |


## 2. Security Architecture

### 2.1 Security Layers
List layered controls (network, application, identity, data, crypto, operational, physical) and their controls.

### 2.2 Threat Model
| Threat Category | Specific Threat | Mitigation | Residual Risk |
|----------------|-----------------|-----------|---------------|
| [Category] | [Threat] | [Mitigation] | [Risk] |

### 2.3 AuthN/AuthZ
- Authentication Methods: [methods]
- Authorization Model: [RBAC/ABAC]
- Session & Token Policies: [timeouts/refresh]


## 3. Cryptographic Specifications
- Digital Signatures: [algorithms, key sizes, padding]
- Hash Functions: [algorithms]
- Key Management: [HSM/rotation]
- Merkle/Proof Systems: [if applicable]
- ZK Proofs: [if applicable]


## 4. Data Model Specifications
Define core entities with DDL or models, constraints, indexes, and integrity rules.


## 5. Network/Protocol Specifications
- Inter-service protocol stack: [serialization, transport, security]
- Message formats (schemas/proto)
- Consensus/coordination protocols (if any)


## 6. Performance Requirements
- Latency targets (P50/P95/P99) per operation
- Throughput targets (TPS) per component
- Scalability targets (records, users, regions)


## 7. Compliance Matrix
Map system controls to standards (e.g., ISO 27001, OWASP Top 10, NIST, GDPR).


## 8. Appendices & Document Control
- Appendices: [Proofs, migration, DR]
- Version history table

### Document Control
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | [DATE] | [AUTHOR] | Initial version |
