# Security Policies

Core security policies for the GTCX monorepo. All policies are aligned with the 12 Architectural Principles.

## Policy Documents

### Core Policies
- [Access Control](./access-control.md) - Authentication, authorization, and RBAC
- [Data Protection](./data-protection.md) - Encryption, privacy, and data handling
- [Incident Response](./incident-response.md) - Security incident procedures

### Principle Alignment

| Policy | Primary Principles |
|--------|-------------------|
| Access Control | P9 (Security), P5 (AI-Native logging) |
| Data Protection | P9 (Security), P8 (Offline-First) |
| Incident Response | P12 (Observability), P9 (Security) |

## Policy Compliance

All code contributions must comply with these policies. Security review is required for:
- Any changes to authentication/authorization
- Any changes to data handling
- Any new external integrations
- Any changes to cryptographic functions

## Updates

Policies are reviewed quarterly. Last review: January 2025.
