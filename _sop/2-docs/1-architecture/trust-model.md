# Trust Model

**Protocol:** GTCX Protocol Layer
**Version:** 3.0.0

---

## 1. Overview

The GTCX trust model defines four concentric security zones, a three-category validator structure, and Byzantine fault tolerance parameters. Trust is earned through cryptographic proof — not assumed from institutional affiliation.

---

## 2. Trust Zones

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ZONE 1: UNTRUSTED (External)                                                │
│  • Public internet · Unknown devices · External APIs                         │
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────────┐ │
│   │  ZONE 2: AUTHENTICATED (Verified Participants)                         │ │
│   │  • TradePass™ holders · Validated devices · API consumers              │ │
│   │                                                                        │ │
│   │   ┌──────────────────────────────────────────────────────────────────┐ │ │
│   │   │  ZONE 3: TRUSTED (Validators)                                    │ │ │
│   │   │  • Government validators · Certified operators (RCOs)            │ │ │
│   │   │  • PANX consensus participants                                   │ │ │
│   │   │                                                                  │ │ │
│   │   │   ┌────────────────────────────────────────────────────────────┐ │ │ │
│   │   │   │  ZONE 4: PRIVILEGED (Infrastructure)                       │ │ │ │
│   │   │   │  • HSM key management · Core protocol services             │ │ │ │
│   │   │   │  • Database servers                                        │ │ │ │
│   │   │   └────────────────────────────────────────────────────────────┘ │ │ │
│   │   └──────────────────────────────────────────────────────────────────┘ │ │
│   └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Zone Specifications

| Zone                      | Authentication                       | Authorization             | Data Access                  |
| ------------------------- | ------------------------------------ | ------------------------- | ---------------------------- |
| **Zone 1: Untrusted**     | None                                 | Public endpoints only     | Read-only public data        |
| **Zone 2: Authenticated** | TradePass™ + device attestation      | Role-based (RBAC)         | Own data + permitted queries |
| **Zone 3: Trusted**       | Multi-factor + institutional binding | Validator permissions     | Validation scope             |
| **Zone 4: Privileged**    | HSM + multi-party approval           | Infrastructure operations | Full system access           |

---

## 3. Validator Categories

PANX consensus requires representation across three stakeholder categories. This prevents any single party from controlling verification outcomes.

| Category       | Who                                            | Role in Consensus                               | Bias                   |
| -------------- | ---------------------------------------------- | ----------------------------------------------- | ---------------------- |
| **Government** | National mining/trade authorities              | Validate regulatory compliance, export licenses | Regulatory correctness |
| **Buyer**      | Institutional purchasers, certification bodies | Validate commercial legitimacy, quality claims  | Commercial integrity   |
| **Community**  | Local cooperatives, NGOs, civil society        | Validate labor practices, ESG claims            | Producer protection    |

**Consensus Rule:** A claim is finalized when attestations from ≥2/3 of validators are aggregated, with at least one attestation from each available validator category. This structure ensures no single interest class can unilaterally validate or block a claim.

---

## 4. Byzantine Fault Tolerance

PANX™ consensus is designed to tolerate up to 1/3 malicious or unavailable validators.

| Parameter                  | Value                        | Rationale                                |
| -------------------------- | ---------------------------- | ---------------------------------------- |
| **Minimum validators**     | 3                            | Minimum for BFT                          |
| **Recommended validators** | 5–7                          | Balance between security and performance |
| **Quorum threshold**       | 2/3 (67%)                    | Tolerates up to 1/3 malicious nodes      |
| **Validator categories**   | Government, Buyer, Community | Multi-stakeholder representation         |

---

## 5. Cryptographic Standards

| Purpose                | Algorithm           | Key Size | Notes                                                   |
| ---------------------- | ------------------- | -------- | ------------------------------------------------------- |
| **Identity signing**   | Ed25519             | 256-bit  | TradePass™ DID signing; fast verification, compact keys |
| **Custody chain**      | SHA-256 merkle tree | 256-bit  | Tamper-evident history (VaultMark)                      |
| **Transfer proofs**    | SHA-256 + multi-sig | 256-bit  | Both parties attest to transfer                         |
| **Transit encryption** | TLS 1.3             | 256-bit  | All API communication                                   |
| **Data at rest**       | AES-256-GCM         | 256-bit  | Database, evidence store                                |
| **Key derivation**     | HKDF-SHA256         | Variable | Hierarchical key structure                              |
| **NFC seal binding**   | ECDSA (chip-native) | —        | Physical-digital link                                   |

---

## 6. Key Hierarchy

```
ROOT KEY (HSM, FIPS 140-2 Level 3, never exported)
    │
    ├──▶ Platform Master
    │         ├──▶ Signing Service (per-region keys: GH, RW, CD)
    │         │         └──▶ Per-device keys (VIA™, VXA™, User)
    │         └──▶ Encryption Service
    │
    ├──▶ Validator Master
    │         ├──▶ Government Validator Keys
    │         └──▶ Buyer Validator Keys
    │
    └──▶ Recovery Master

TradePass™ Keys (User-controlled, self-sovereign)
  Generated from biometric seed on user device
  Never exported to GTCX infrastructure
```

### Key Protection by Classification

| Key Type               | Classification | Protection                                    |
| ---------------------- | -------------- | --------------------------------------------- |
| Root key               | CRITICAL       | HSM, FIPS 140-2 Level 3, multi-party ceremony |
| Platform master        | CRITICAL       | HSM, multi-sig                                |
| Validator signing keys | CRITICAL       | HSM per validator node                        |
| TradePass user keys    | CRITICAL       | Device secure enclave, biometric-bound        |
| Custody signing keys   | CRITICAL       | HSM, Ed25519                                  |
| NFC seal keys          | CRITICAL       | Chip-level secure enclave                     |
| Asset attributes       | RESTRICTED     | Signed, encrypted at rest                     |
| Transfer evidence      | RESTRICTED     | Hash-anchored                                 |

---

## 7. Self-Sovereign Identity

TradePass™ implements a self-sovereign identity model:

- User keys are generated from a biometric seed on the user's device
- Keys never leave the device — GTCX infrastructure holds no private keys for users
- DIDs follow the format `did:gtcx:<jurisdiction>_<id>`
- Credential proofs use Ed25519 signatures with the user's device key
- Key rotation is supported without losing credential history

This design means GTCX cannot revoke a producer's access by compromising a central key store. Only the participant controls their identity.

---

## Reference

- [system-overview.md](system-overview.md)
- [cryptographic-inventory.md](../3-engineering/security/cryptographic-inventory.md)
