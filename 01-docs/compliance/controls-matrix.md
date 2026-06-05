---
title: 'Controls Matrix'
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

# Controls Matrix

Unified security control mapping across NIST 800-53 Rev 5, SOC 2 Trust Services Criteria (TSC), and ISO 27001:2022 Annex A. Each entry documents the GTCX implementation and current status.

## Status Definitions

| Status          | Definition                                                |
| --------------- | --------------------------------------------------------- |
| **IMPLEMENTED** | Fully implemented and operational in the current codebase |
| **PARTIAL**     | Partially implemented — specific gaps are noted           |
| **PLANNED**     | Not yet implemented — remediation is scheduled            |
| **GAP**         | Not implemented — no immediate remediation scheduled      |

---

## Access Control

| ID    | NIST 800-53              | SOC 2 | ISO 27001 | Description                       | GTCX Implementation                                                                                                                                                                                                           | Status      |
| ----- | ------------------------ | ----- | --------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-01 | AC-2 Account Management  | CC6.1 | A.9.2     | Identity lifecycle management     | TradePass DID-based identity: `createIdentity()`, `IdentityStore`, `resolveIdentity()`. DID format: `did:gtcx:<jurisdiction>_<sha256_prefix>`. Status lifecycle: `pending → active → suspended → revoked`.                    | IMPLEMENTED |
| AC-02 | AC-3 Access Enforcement  | CC6.1 | A.9.4     | Authorization enforcement         | TradePass RBAC: `hasPermission()`. Role assignments are time-bounded (`expiresAt`) and validated via `isRoleValid()`. Permission matrix: `canPurchaseFrom()`, `canTransferCustody()`, `canCertify()`, `canEnforce()`.         | IMPLEMENTED |
| AC-03 | AC-6 Least Privilege     | CC6.3 | A.9.4     | Minimum necessary access          | `RoleConstraint` supports time, location, volume, and value restrictions. Operator types have distinct permission sets. Docker runs as non-root `gtcx` (UID 1000). Stub guards block in-memory implementations in production. | IMPLEMENTED |
| AC-04 | AC-7 Failed Logon Limits | CC6.1 | A.9.4     | Limits on invalid access attempts | Rate limiting via `03-platform/packages/protocols-domain/rate-limit.ts`. **GAP**: No account lockout for DID-based auth. No failed attempt counter.                                                                           | PARTIAL     |
| AC-05 | AC-17 Remote Access      | CC6.1 | A.13.2    | Remote access controls            | PANX envelope signing via Ed25519 (`signEnvelope()`, `verifyEnvelopeSignature()`). Replay detection via `ReplayCache`. **GAP**: No TLS configuration documented. No VPN/network-level controls.                               | PARTIAL     |

---

## Audit and Accountability

| ID    | NIST 800-53               | SOC 2 | ISO 27001 | Description                  | GTCX Implementation                                                                                                                                                                                                                   | Status      |
| ----- | ------------------------- | ----- | --------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AU-01 | AU-2 Event Logging        | CC7.2 | A.12.4    | Auditable events defined     | `InMemoryAuditLog` records: `message_received`, `message_forwarded`, `message_rejected`. VaultMark custody events: `created`, `verified`, `transferred`, `disputed`, `released`. GCI `createScoreUpdateEvent()` tracks score changes. | IMPLEMENTED |
| AU-02 | AU-3 Audit Record Content | CC7.2 | A.12.4    | Required content in records  | `AuditEvent`: `id`, `type`, `messageId`, `nodeId`, `timestamp`, `reason`, `metadata`. `CustodyEvent`: `id`, `custodyId`, `type`, `actor`, `timestamp`, `previousEventId`, `hash`.                                                     | IMPLEMENTED |
| AU-03 | AU-6 Audit Review         | CC7.2 | A.12.4    | Audit review and analysis    | `InMemoryAuditLog.list()` for read access. **GAP**: No automated review or alerting. No persistent storage (in-memory — lost on restart). No SIEM integration.                                                                        | GAP         |
| AU-04 | AU-8 Timestamps           | CC7.2 | A.12.4    | Reliable time sources        | All events use `Date.now()` with injectable `now` for testability. PANX envelopes use ISO 8601. **GAP**: No NTP enforcement. No clock skew detection between oracle nodes.                                                            | PARTIAL     |
| AU-05 | AU-9 Audit Protection     | CC7.2 | A.12.4    | Protect audit information    | VaultMark custody chain uses SHA-256 hash chaining (`hashCustodyEvent()`). `maxEvents` cap (10,000) prevents unbounded growth. **GAP**: No access controls on audit log. In-memory storage is volatile.                               | PARTIAL     |
| AU-06 | AU-10 Non-repudiation     | CC7.2 | A.18.1    | Denial of actions prevention | PANX envelopes carry Ed25519 signatures binding sender to message. VaultMark challenges require witness signatures via `validateChallengeResponse()`. TradePass credentials use `Ed25519Signature2020`.                               | IMPLEMENTED |

---

## System and Communications Protection

| ID    | NIST 800-53                       | SOC 2 | ISO 27001 | Description                 | GTCX Implementation                                                                                                                                                                                                         | Status      |
| ----- | --------------------------------- | ----- | --------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SC-01 | SC-8 Transmission Confidentiality | CC6.1 | A.13.1    | Protect transmitted data    | `@gtcx/protocols-crypto` provides AES-256-GCM with 12-byte random nonces and authentication tags. PANX envelopes support `encrypted: boolean`. **GAP**: No TLS/mTLS for transport-layer encryption. Application-layer only. | PARTIAL     |
| SC-02 | SC-12 Key Management              | CC6.1 | A.10.1    | Cryptographic key lifecycle | `CryptoProvider` interface abstracts key operations. PEM/DER (PKCS8/SPKI) format support. Key IDs tracked in `Signature.keyId`. **GAP**: No HSM integration. No key rotation. No key escrow or recovery.                    | PARTIAL     |
| SC-03 | SC-13 Cryptographic Protection    | CC6.1 | A.10.1    | Cryptography requirements   | Ed25519 (signing), AES-256-GCM (encryption), SHA-256 (hashing). All via `node:crypto`. 12-byte CSPRNG nonces. Auth tags mandatory for decryption. **GAP**: No FIPS 140-2 validated modules.                                 | PARTIAL     |
| SC-04 | SC-23 Session Authenticity        | CC6.1 | A.13.1    | Session authenticity        | PANX `ReplayCache` detects replays within 5-minute window (100K entries). Envelope TTL limits propagation. VaultMark challenges have `expiresAt` and nonce-based replay prevention.                                         | IMPLEMENTED |
| SC-05 | SC-28 Protection at Rest          | CC6.1 | A.8.24    | Encryption of stored data   | AES-256-GCM available via `@gtcx/protocols-crypto`. **GAP**: No automatic encryption of stored data. Identity store, audit logs, custody records stored unencrypted. No disk encryption requirements documented.            | GAP         |

---

## System and Information Integrity

| ID    | NIST 800-53             | SOC 2 | ISO 27001 | Description                 | GTCX Implementation                                                                                                                                                                                                                                                                                                           | Status      |
| ----- | ----------------------- | ----- | --------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| SI-01 | SI-2 Flaw Remediation   | CC7.1 | A.12.6    | Software flaw correction    | Dependabot automated dependency updates. `eslint-plugin-security` for static security analysis. `pnpm audit` for vulnerability scanning. Trivy container scanning in CI. Frozen lockfile prevents unvetted dependency changes.                                                                                                | IMPLEMENTED |
| SI-02 | SI-10 Input Validation  | CC7.2 | A.14.2    | Input validation            | `@gtcx/validators`: `assertNonEmptyString()`, `assertFiniteNumber()`, `assertValidDid()`, `assertValidJurisdiction()`, `assertFutureTimestamp()`. `@gtcx/protocols-schemas`: domain-specific schema validation via `validateById()`. TypeScript `strict: true` with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`. | IMPLEMENTED |
| SI-03 | SI-11 Error Handling    | CC7.2 | A.12.1    | Secure error messages       | `GtcxError` with typed `ErrorCode` taxonomy: `INVALID_ARGUMENT`, `UNAUTHORIZED`, `SIGNATURE_INVALID`, `REPLAY_DETECTED`, `RATE_LIMITED`, and others. Structured error details without raw stack traces. `StubNotAllowedError` prevents production use of stubs.                                                               | IMPLEMENTED |
| SI-04 | SI-4 System Monitoring  | CC7.2 | A.12.4    | Attack detection            | `IMetricsCollector` interface with `increment()`, `histogram()`, `gauge()`. Metrics instrumented across protocols. **GAP**: No concrete metrics backend (Prometheus, CloudWatch). No alerting rules. Metrics interface is a contract only.                                                                                    | PARTIAL     |
| SI-05 | SI-7 Software Integrity | CC7.2 | A.14.2    | Detect unauthorized changes | VaultMark SHA-256 custody event chain (`hashCustodyEvent()`). Pinned Docker base image digest. Frozen `pnpm-lock.yaml`. Git version control tracks all source changes.                                                                                                                                                        | IMPLEMENTED |

---

## Configuration Management

| ID    | NIST 800-53                 | SOC 2 | ISO 27001 | Description                        | GTCX Implementation                                                                                                                                                                                                                 | Status      |
| ----- | --------------------------- | ----- | --------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| CM-01 | CM-2 Baseline Configuration | CC8.1 | A.12.1    | Maintain baseline configs          | `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. ESLint with security plugin. Prettier. Shared `03-platform/packages/typescript-config/`.                       | IMPLEMENTED |
| CM-02 | CM-3 Change Control         | CC8.1 | A.12.1    | Control configuration changes      | Git for all configuration changes. Husky pre-commit hooks. lint-staged applies ESLint + Prettier on commit. Turborepo ensures consistent build order.                                                                               | IMPLEMENTED |
| CM-03 | CM-6 Configuration Settings | CC8.1 | A.12.1    | Secure configuration settings      | Docker: non-root `gtcx` (UID 1000), Alpine minimal image, multi-stage build removes source/tests from production image, `NODE_ENV=production`, health check. Node.js ≥ 20.18.0 required. pnpm version pinned. Docker digest pinned. | IMPLEMENTED |
| CM-04 | CM-7 Least Functionality    | CC8.1 | A.12.1    | Restrict to essential capabilities | Production image removes `*.ts`, test files, `__tests__`, coverage, node_modules cache. `pnpm prune --prod` removes devDependencies. Stub guards prevent non-production code paths.                                                 | IMPLEMENTED |
| CM-05 | CM-8 Component Inventory    | CC8.1 | A.8.1     | System component inventory         | `pnpm-workspace.yaml` enumerates all workspace packages. `Dockerfile` COPY statements enumerate packages explicitly. **GAP**: No formal SBOM generation in current CI.                                                              | PARTIAL     |

---

## Identification and Authentication

| ID    | NIST 800-53                            | SOC 2 | ISO 27001 | Description                  | GTCX Implementation                                                                                                                                                                                                            | Status      |
| ----- | -------------------------------------- | ----- | --------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| IA-01 | IA-2 Identification and Authentication | CC6.1 | A.9.2     | Unique user identification   | DID-based identity in TradePass. DID format: `did:gtcx:<jurisdiction>_<sha256_prefix>`. Types: `individual`, `organization`, `cooperative`. Ed25519 for credential verification.                                               | IMPLEMENTED |
| IA-02 | IA-4 Identifier Management             | CC6.1 | A.9.2     | Identifier lifecycle         | DID generation via `issueTradePassDid()`: SHA-256 over `jurisdiction:timestamp:randomBytes(16)`. Jurisdiction validation: 2-6 uppercase alphanumerics. **GAP**: No DID deactivation/revocation beyond status changes.          | PARTIAL     |
| IA-03 | IA-5 Authenticator Management          | CC6.1 | A.9.4     | Credential lifecycle         | TradePass: `issueCredential()` with `Ed25519Signature2020`, `revokeCredential()` with reason tracking, `updateCredentialStatus()`. `expirationDate` for time-bounded validity. `presentCredential()` for selective disclosure. | IMPLEMENTED |
| IA-04 | IA-8 External User Authentication      | CC6.1 | A.9.2     | Non-organizational user auth | PANX oracle: unique `OracleNode.id` + `publicKey`. Oracle lifecycle: `active`, `inactive`, `suspended`, `probation`. Reputation scoring on a 0 to 100 scale. **GAP**: No federated identity or external IdP integration.       | PARTIAL     |

---

## Risk Assessment

| ID    | NIST 800-53                 | SOC 2 | ISO 27001 | Description              | GTCX Implementation                                                                                                                                                                                                                                                | Status  |
| ----- | --------------------------- | ----- | --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| RA-01 | RA-3 Risk Assessment        | CC3.2 | A.8.2     | Conduct risk assessments | STRIDE threat model reference: [threat-model.md](../security/threat-model.md). GCI provides risk quantification on a 0 to 100 scale across 5 weighted factor categories with tier classification. **GAP**: No formal organizational risk assessment document.      | PLANNED |
| RA-02 | RA-5 Vulnerability Scanning | CC7.1 | A.12.6    | Vulnerability scanning   | Trivy container scanning in CI. `pnpm audit` for dependencies. `eslint-plugin-security` static analysis. TypeScript strict mode catches type-related vulnerabilities. Pinned Docker digest for reproducibility. **GAP**: No DAST. No penetration testing schedule. | PARTIAL |

---

## Incident Response

| ID    | NIST 800-53                   | SOC 2 | ISO 27001 | Description                  | GTCX Implementation                                                                                                                                                                                                                                       | Status |
| ----- | ----------------------------- | ----- | --------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| IR-01 | IR-1 Incident Response Policy | CC7.3 | A.16.1    | Incident response capability | **GAP**: No formal incident response plan. No incident classification scheme. No communication templates. No escalation procedures.                                                                                                                       | GAP    |
| IR-02 | IR-4 Incident Handling        | CC7.4 | A.16.1    | Handle security incidents    | PANX audit log records `message_rejected` events. VaultMark `disputed` status represents contested custody. PvP `disputeEscrow()` handles settlement disputes. **GAP**: No centralized incident tracking. No automated detection. No forensic capability. | GAP    |
| IR-03 | IR-6 Incident Reporting       | CC7.4 | A.16.1    | Report security incidents    | **GAP**: No incident reporting mechanism. No notification procedures. No regulatory reporting workflows.                                                                                                                                                  | GAP    |

---

## Summary

| Status      | Count  | %   |
| ----------- | ------ | --- |
| IMPLEMENTED | 15     | 48% |
| PARTIAL     | 11     | 35% |
| PLANNED     | 1      | 3%  |
| GAP         | 4      | 13% |
| **Total**   | **32** |     |

---

## Priority Remediation Items

| Priority    | Control             | Gap                       | Action                                                                                      |
| ----------- | ------------------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| P1 Critical | IR-01, IR-02, IR-03 | No incident response plan | Author IR plan, define classification scheme, establish communication procedures            |
| P1 Critical | AU-03               | No persistent audit log   | Implement persistent audit storage; add automated anomaly detection                         |
| P2 High     | SC-02               | No HSM, no key rotation   | Integrate HSM provider (AWS CloudHSM, Azure Key Vault); implement key rotation              |
| P2 High     | SC-05               | No encryption at rest     | Define data classification policy; implement automatic encryption for sensitive stored data |
| P3 Medium   | SC-03               | No FIPS-validated crypto  | Evaluate Node.js OpenSSL FIPS provider; document algorithm selection rationale              |
| P3 Medium   | RA-01               | No formal risk assessment | Complete STRIDE threat models; conduct organizational risk assessment                       |
| P3 Medium   | CM-05               | No SBOM generation        | Add SBOM (CycloneDX or SPDX) to CI pipeline — partially addressed in release runbook        |
| P4 Low      | SI-04               | No metrics backend        | Implement Prometheus exporter; define alerting rules                                        |

---

## Reference

- [threat-models.md](../security/threat-model.md)
- [cryptographic-inventory.md](../security/security-architecture.md)
