# Glossary

Definitions for all protocol-specific terms, acronyms, and concepts used across the GTCX Protocol layer. Terms are organized alphabetically within thematic groups.

---

## Core Concepts

**Audit chain**
A hash-linked sequence of audit events where each event includes the SHA-256 hash of the previous event. Enables tamper detection — modifying any event invalidates all subsequent hashes.

**Byzantine fault tolerant (BFT)**
A system property that allows correct operation even when up to 1/3 of participants behave maliciously or arbitrarily. PANX consensus requires a minimum 2/3 quorum of validators to be correct.

**CaaS (Compliance as a Service)**
The model by which GTCX Protocol services are delivered to operators. RCOs are the primary field operators of CaaS services.

**Commodity-agnostic**
The design principle that no commodity type (gold, coffee, cobalt, timber) is hardcoded into protocol logic. All commodity-specific configuration lives in `@gtcx/schemas/config/commodities/`.

**CRDT (Conflict-free Replicated Data Type)**
The data structure approach used for offline conflict resolution. CRDT merges are deterministic and commutative — independent device operations converge to the same canonical state on sync.

**DID (Decentralized Identifier)**
A globally unique identifier that does not require a central registry. GTCX DIDs follow the W3C DID Core 1.0 standard with the `did:gtcx:` method. Format: `did:gtcx:<type_prefix>_<16-32 hex chars>`.

**DID type prefixes**

| Prefix | Entity             |
| ------ | ------------------ |
| `tp`   | TradePass identity |
| `va`   | Validator node     |
| `as`   | Asset              |
| `es`   | Escrow             |
| `cr`   | Credential         |
| `gt`   | GeoTag             |
| `vm`   | VaultMark          |
| `node` | Network node       |

**Ed25519**
The elliptic curve digital signature algorithm used throughout GTCX for signing credentials, envelopes, custody events, and settlements. 256-bit key size; FIPS-approved (NIST SP 800-186).

**Enforced stub guard**
See _stub guard_.

**Hash chain**
See _audit chain_.

**Jurisdiction**
A geographic and regulatory boundary within which specific compliance rules and government validators apply. Jurisdictions are configured per-commodity in `@gtcx/schemas/config/jurisdictions/`.

**Offline-first**
Design principle requiring that all core operations function without network connectivity. The system syncs and resolves conflicts when connectivity returns.

**Operator**
Any participant in the GTCX supply chain who holds a TradePass credential and has been assigned a role. See _operator types_.

**Protocol boundary**
The point at which external input enters a protocol handler. All input must be validated with Zod at the protocol boundary — no unvalidated data enters the system.

**Quorum**
The minimum number of PANX validators required to reach consensus. The required quorum is 2/3 of active validators. PANX is BFT-tolerant up to 1/3 malicious validators.

**RPO (Recovery Point Objective)**
Maximum acceptable data loss in a disaster scenario. Target: 15 minutes.

**RTO (Recovery Time Objective)**
Maximum acceptable downtime in a disaster scenario. Target: 4 hours.

**Self-sovereign identity (SSI)**
The identity model where each participant controls their own identity (DID) and credentials without dependence on a central authority. TradePass implements SSI via W3C Verifiable Credentials.

**Semantic versioning**
The versioning scheme for packages and schemas: `MAJOR.MINOR.PATCH`. MAJOR bumps indicate breaking changes requiring migration. See [data-models.md §6](../2-specs/data-models.md).

**Stub guard**
The `enforceStubGuard()` function that throws `StubNotAllowedError` if an in-memory stub implementation is detected in a non-development environment. Defined in ADR-002.

---

## Protocols

**GCI (Global Compliance Index)**
The continuous compliance scoring protocol. Produces a 0–100 score across 5 weighted factor categories. Market access is gated by score tier: PREMIUM (85+), VERIFIED (70–84), PROVISIONAL (50–69).

**GeoTag**
The cryptographic location verification protocol. Three-layer verification: Device GPS + Network correlation + Satellite. Validates extraction claims against government-issued licensed areas.

**PANX (Price and Network eXchange)**
The oracle consensus and network messaging protocol. Two functions: (1) price data consensus from validator oracles; (2) settlement validation attestations required by PvP.

**PvP (Payment vs Physical)**
The atomic settlement protocol. Custody transfer and payment release occur in the same transaction — neither completes without the other. Requires PANX consensus and GCI score gate.

**TradePass**
The identity and credential foundation protocol. Every other protocol depends on TradePass. Issues W3C Verifiable Credentials to all supply chain participants. Enforces RBAC across all operations.

**VaultMark**
The chain of custody protocol. Tracks every custody transfer from extraction site to final buyer. All events are SHA-256 hash-chained into a tamper-evident history.

---

## Operator Types

**AGGREGATOR**
Operator who consolidates smaller lots into larger shipments. Sub-types: `AGGREGATOR_LOCAL` (village/district level), `AGGREGATOR_REGIONAL` (regional warehouse or hub).

**Authority ID / GOVERNMENT**
National and sub-national regulatory bodies. Can issue/revoke licenses, access jurisdiction compliance data, and participate as PANX government validators.

**Buyer ID / BUYER**
End purchasers of verified commodities. Sub-types: `BUYER_INDUSTRIAL`, `BUYER_RETAIL`, `BUYER_INSTITUTIONAL`.

**Certifier ID / INSPECTOR**
Authorized verifiers who conduct physical assessments via VXA. Cannot trade or hold custody.

**Custody ID / VAULT**
Certified secure storage operators. Can hold long-term custody and attest to physical condition.

**Finance ID / FINANCE**
Financial service providers.

**Logistics ID**
Transportation operators. Sub-types: `LOGISTICS_LOCAL`, `LOGISTICS_SECURE`.

**Producer ID / PRODUCER**
Individuals or organizations engaged in primary commodity extraction. Sub-types: `PRODUCER_INDIVIDUAL`, `PRODUCER_GROUP`, `PRODUCER_OPERATION`, `PRODUCER_INDUSTRIAL`.

**Processor ID / REFINER**
Operators who transform raw commodities. Sub-types: `PROCESSOR_PRIMARY`, `PROCESSOR_REFINER`.

**RCO (Regional Compliance Operator)**
Licensed operators who aggregate production, support producers, and connect them to formal markets. Primary field operators of CaaS services.

**Site ID**
Physical location identity for extraction sites, processing facilities, vaults, and ports.

**Trader ID**
Trading and export operators. Sub-types: `TRADER_DEALER`, `TRADER_EXPORTER`, `TRADER_HOUSE`.

**TradePass (credential type)**
The base identity credential required by all participants. All other credential types are additive on top of TradePass.

**VALIDATOR**
PANX consensus participants — institutional entities (government bodies, buyer consortia, community organizations). Vote on consensus requests. Cannot trade or hold custody.

---

## Credential and Score Concepts

**Credential lifecycle**
The state machine for a TradePass verifiable credential: `UNREGISTERED → PENDING → ACTIVE → SUSPENDED → REVOKED`.

**Ed25519Signature2020**
The proof type used for all TradePass verifiable credentials. Covers the canonical payload including: `id`, `type`, `issuer`, `subject`, `issuanceDate`, `expirationDate`, `credentialSubject`, `status`, `metadata`.

**GCI factor categories**
The five weighted domains that contribute to a GCI score. Weights vary per commodity configuration. Categories include: Environmental, Social, Governance, Legal/Regulatory, Operational.

**GCI tiers**

| Tier        | Score  | Market Access                        |
| ----------- | ------ | ------------------------------------ |
| PREMIUM     | 85–100 | Full access; up to 22% price premium |
| VERIFIED    | 70–84  | Full access                          |
| PROVISIONAL | 50–69  | Restricted access                    |
| BLOCKED     | < 50   | No market access                     |

**OriginMark certificate**
A GeoTag-issued certificate binding an extraction location to a specific asset lot. Required by VaultMark as the origin anchor on asset creation.

**Trust score**
A TradePass-computed reputation value for each operator, updated by trust events (positive: successful verifications; negative: spoof detection, compliance failures). Affects minimum thresholds for high-value operations.

**Verifiable credential (VC)**
A W3C-standard data structure encoding a claim made by an issuer about a subject, with a cryptographic proof. All GTCX credentials are VCs.

**Verifiable presentation (VP)**
A W3C-standard wrapper that packages one or more verifiable credentials for selective disclosure to a verifier.

---

## Asset and Custody Concepts

**Custody challenge**
A nonce-based challenge issued to a vault operator to prove they physically hold an asset. Response must include Ed25519 witness signatures covering the challenge ID, proof, timestamp, and nonce.

**Dual-signature transfer**
The VaultMark requirement that both the sending and receiving party sign a custody transfer before it is accepted. Prevents unilateral asset movement.

**Lot ID**
The human-readable identifier for a commodity lot. Format: `lot:{country_code}-{commodity}-{yyyymmdd}-{sequence}`. Example: `lot:gh-gold-20260115-001`.

**Merkle root**
A SHA-256 hash over all custody events in a VaultMark record. Provides a single tamper-evident summary of the entire custody history.

**NFC seal**
A chip-level binding between a physical asset and its VaultMark digital record. Used for high-value commodities to detect tampering with physical seals.

---

## Settlement and Consensus Concepts

**Atomic settlement**
The PvP property that custody transfer and payment release are a single indivisible operation — if either leg fails, neither completes.

**Consensus attestation**
The PANX output confirming that a required quorum of validators approved a specific operation (high-value transfer or settlement). Stored on both the VaultMark custody event and the PvP settlement record.

**Escrow**
A PvP-managed holding state where buyer funds are locked pending custody transfer confirmation. Funds are only released after PANX consensus confirms the physical handoff.

**Fee distribution**
PvP settlement fees are split: 40% Treasury, 30% Sovereign (government), 20% Operator (RCO/exchange), 10% PANX validators.

**Lock commitment**
A PvP signed commitment by a settlement party confirming their leg of the transaction is ready to execute. Ed25519-signed over `legId`, `settlementId`, `party`, `commitment`, `timestamp`.

**Oracle**
A PANX network participant that submits signed price data for a commodity. Oracles are identified by public key. Consensus uses outlier rejection (IQR-based) and reputation weighting.

**Replay attack**
An attack where a valid signed message is captured and re-submitted to cause unintended effects. Prevented by the `ReplayCache` (PANX) and nonce-based challenge-response (VaultMark).

---

## Packages

**`@gtcx/crypto`**
Shared cryptographic primitives: Ed25519 sign/verify, AES-256-GCM encrypt/decrypt, SHA-256 hash. All operations go through the `CryptoProvider` interface.

**`@gtcx/domain`**
Shared domain logic: rate limiting, replay cache, stub guard, metrics interface.

**`@gtcx/schemas`**
Zod schemas for all protocol types. All external input is validated here at protocol boundaries.

**`@gtcx/sdk`**
TypeScript SDK exposing all six protocols behind a unified `GTCXClient` interface.

**`@gtcx/validators`**
Input validation utilities: `assertNonEmptyString()`, `assertValidDid()`, `assertFiniteNumber()`, `assertFutureTimestamp()`, etc.

---

## Reference

- [operator-types.md](../2-specs/operator-types.md)
- [protocol-index.md](../2-specs/protocol-index.md)
