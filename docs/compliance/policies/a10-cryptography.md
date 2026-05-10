# POL-10: Cryptography

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Annex A Reference:** A.10 — Cryptographic Controls
**Effective Date:** 2026-05-08
**Review Cycle:** Annual
**Owner:** CISO
**Approved By:** Board Security Committee

## 1. Purpose

Ensure proper and effective use of cryptography to protect the confidentiality, integrity, and authenticity of GTCX information.

## 2. Scope

All cryptographic operations across the GTCX ecosystem including data encryption, digital signatures, key management, TLS, and protocol-level cryptography (TradePass, GeoTag, GCI, VaultMark, PvP, PANX).

## 3. Policy Statement

1. **Approved algorithms.** Only NIST-approved algorithms are permitted: AES-256-GCM for symmetric encryption, Ed25519 or ECDSA P-256 for digital signatures, SHA-256 minimum for hashing, X25519 or ECDH P-256 for key exchange. Deprecated algorithms (MD5, SHA-1, 3DES, RSA < 2048-bit) are prohibited.

2. **Encryption requirements.** Data at rest classified as Confidential or Restricted must be encrypted with AES-256. Data in transit must use TLS 1.2 minimum (TLS 1.3 preferred). Database connections require TLS. Inter-service communication within the cluster uses mTLS.

3. **Key management.** Cryptographic keys are generated using cryptographically secure random number generators. Keys are stored in a dedicated key management service (KMS) — never in source code, config files, or local storage. Key rotation: symmetric keys every 12 months, asymmetric keys every 24 months, TLS certificates every 90 days.

4. **Digital signatures.** All protocol attestations (TradePass, GeoTag, etc.) use Ed25519 signatures with DID-based verification. Signature verification is mandatory before processing any signed payload. Replay protection is enforced via nonce and timestamp validation.

5. **Crypto inventory.** A cryptographic inventory is maintained listing all algorithms, key lengths, purposes, and rotation schedules in use across the ecosystem. The inventory is reviewed semi-annually.

## 4. Responsibilities

| Role              | Responsibility                                             |
| ----------------- | ---------------------------------------------------------- |
| CISO              | Approve cryptographic standards, maintain crypto inventory |
| Security Engineer | Implement key management, monitor certificate expiry       |
| Engineering Leads | Ensure code uses approved algorithms only                  |
| DevOps            | Automate certificate rotation, enforce TLS                 |

## 5. Exceptions

Use of non-standard algorithms requires written CISO approval, a documented threat model, and a migration plan to an approved algorithm within 12 months.

## 6. Review

Reviewed annually. Crypto inventory reviewed semi-annually. Algorithm suitability reassessed against NIST post-quantum guidance.
