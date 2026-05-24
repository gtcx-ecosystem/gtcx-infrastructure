---
title: 'FIPS Readiness — GTCX Compliance Substrate'
status: 'current'
date: '2026-05-24'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['gtm', 'fips', 'cryptography', 'compliance', 'federal']
review_cycle: 'quarterly'
---

# FIPS Readiness — GTCX Compliance Substrate

> **Audience:** Federal-track buyers, security review boards, regulators requiring FIPS 140-3 alignment.
> **Companion doc:** [`../security/fips-assessment.md`](../security/fips-assessment.md) — full assessment with line-level evidence.

## Headline

The substrate is **FIPS-ready by construction** — it uses Node.js `crypto.subtle` Web Crypto API exclusively, with no userspace cryptographic primitives. FIPS 140-3 validation of a specific deployment is therefore gated on the operator choosing a FIPS-validated Node.js LTS build at the container layer, not on substrate code changes.

| Property                                       | Status                                                       |
| ---------------------------------------------- | ------------------------------------------------------------ |
| Substrate code uses validated crypto APIs only | ✅ (no userspace crypto)                                     |
| All algorithms used are FIPS-approved          | ✅ (Ed25519, SHA-256, AES-256-GCM, ECDSA P-256)              |
| Substrate code is FIPS-mode tolerant           | ✅ (no banned primitives)                                    |
| Deployed in FIPS-validated runtime             | ⏳ Operator-controlled (choose FIPS Node.js build)           |
| Formal FIPS 140-3 certificate                  | ❌ Not pursued at substrate layer; achievable per-deployment |

## Algorithms in use

| Use                              | Algorithm                   | FIPS-approved?                                      |
| -------------------------------- | --------------------------- | --------------------------------------------------- |
| Audit record signing             | Ed25519 (RFC 8032)          | Yes (FIPS 186-5)                                    |
| Body / envelope hashing          | SHA-256 (FIPS 180-4)        | Yes                                                 |
| At-rest encryption               | AES-256-GCM (FIPS 197)      | Yes                                                 |
| Transport encryption             | TLS 1.3                     | Yes (per NIST SP 800-52 Rev. 2)                     |
| Key derivation (KMS-managed)     | AWS KMS internal primitives | Yes (AWS KMS is FIPS 140-3 Level 1 validated)       |
| Canonicalization (deterministic) | RFC 8785 JCS                | N/A — not crypto, but the canonical input to crypto |

No userspace cryptographic implementations. No banned algorithms (MD5, SHA-1, DES, RC4, etc.) anywhere in the substrate or its dependencies.

## What full FIPS 140-3 certification would require

| Step                                                                    | Owner                  | Status                                          |
| ----------------------------------------------------------------------- | ---------------------- | ----------------------------------------------- |
| Validate Node.js runtime build is FIPS-mode-enabled                     | Operator (deploy-time) | Each deployment decides                         |
| AWS KMS in FIPS mode for the deployment region                          | Operator               | af-south-1 supports FIPS endpoints              |
| Container image audit (no fallback to non-validated crypto)             | Substrate-side         | ✅ Verified — no fallback paths                 |
| Documented operating environment per FIPS 140-3 Implementation Guidance | Operator + GTCX        | ⏳ Available on request per pilot               |
| Third-party FIPS test lab validation                                    | Operator               | Not pursued by GTCX as a vendor; per-deployment |

## Why GTCX doesn't pursue substrate-level FIPS certification

The substrate is open-source middleware, not a hardware appliance. FIPS 140-3 validation is per-runtime-build, not per-application-code. Pursuing certification at the substrate layer would tie the substrate to a single Node.js build, which contradicts the deployment-flexibility design goal. Pilot deployments that need FIPS validation pair the substrate with a FIPS-validated Node.js LTS build at container-image-time; the substrate code itself imposes no constraint on which build that is.

## Companion evidence

- [`../security/fips-assessment.md`](../security/fips-assessment.md) — full FIPS posture assessment
- [`../security/security-architecture.md`](../security/security-architecture.md) — defense-in-depth
- [`01-security-posture.md`](./01-security-posture.md) — high-level security summary
- [`02-compliance-matrix.md`](./02-compliance-matrix.md) — FIPS row in the multi-framework matrix
