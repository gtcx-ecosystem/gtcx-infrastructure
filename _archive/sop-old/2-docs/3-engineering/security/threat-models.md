# Threat Models

STRIDE threat models for all six GTCX protocols. Each model documents high-value assets, attack surfaces, current mitigations, and open gaps with remediation targets.

---

## Framework

All threat models use the STRIDE methodology:

| Letter | Threat Category        | Protocol Impact                                             |
| ------ | ---------------------- | ----------------------------------------------------------- |
| **S**  | Spoofing               | Identity forgery, fake credentials, oracle impersonation    |
| **T**  | Tampering              | Modification of credentials, custody chains, scores, prices |
| **R**  | Repudiation            | Denial of custody transfers, attestations, settlements      |
| **I**  | Information Disclosure | PII exposure, price data leakage, custody history leakage   |
| **D**  | Denial of Service      | Queue flooding, consensus disruption, rate abuse            |
| **E**  | Elevation of Privilege | RBAC bypass, unauthorized role escalation, scope abuse      |

---

## TradePass — Identity and Authorization

**Scope:** DIDs, verifiable credentials, role assignments, trust scores, identity documents (PII), permission matrix

**Attack surface:** `createIdentity()`, `resolveIdentity()`, `issueCredential()`, `verifyCredential()`, `assignRole()`, `hasPermission()`, `canPurchaseFrom()`, `applyTrustEvent()`

### Key Threats and Mitigations

**S — Spoofing (Critical)**
Threat: Attacker creates a fake DID to impersonate a legitimate operator.

Mitigations:

- DID format validated against `GTCX_DID_PATTERN` (`/^did:gtcx:[a-z]{2,6}_[a-zA-Z0-9_]{1,64}$/`) at `assertValidDid()`
- DID generation uses SHA-256 over `jurisdiction:timestamp:seed` where seed is `randomBytes(16)` (16 bytes entropy)
- All credentials include `CredentialProof` with `Ed25519Signature2020`; `verifyCredentialSignature()` verifies against public key on canonical payload

Open gaps:

- No DID revocation or rotation — a compromised DID cannot be invalidated at protocol level. **Sprint 3.**
- `MemoryIdentityStore.set()` has no write authentication — any caller can insert/overwrite identities. **Sprint 3.**

**T — Tampering (Critical)**
Threat: Attacker modifies credential subject data after issuance.

Mitigations:

- `canonicalizeCredentialPayload()` produces deterministic JSON (sorted keys) covering: `id`, `type`, `issuer`, `subject`, `issuanceDate`, `expirationDate`, `credentialSubject`, `status`, `metadata`
- Four verification levels: `basic`, `standard` (0.6 threshold), `enhanced` (0.8), `full` (1.0)
- Schema validation on identity creation via `validateById()`

Open gaps:

- `updateCredentialStatus()` has no authorization check — only validates that `status` is a non-empty string. **Sprint 3.**
- No hash chain linking credentials; retroactive insertion is undetectable. **Sprint 4.**

---

## GeoTag — Location Verification

**Scope:** Location coordinates, geofence definitions, GeoTag proof hashes, chain hashes, spoof detection results, OriginMark certificates

**Attack surface:** `createGeoTag()`, `verifyGeoTag()`, `isWithinGeofence()`, `detectSpoof()`, `computeChainHash()`

### Key Threats and Mitigations

**S — Spoofing (Critical)**
Threat: Attacker submits fabricated GPS coordinates to falsely claim asset origin.

Mitigations:

- Teleportation detection: `detectSpoof()` flags sequences where speed exceeds `maxSpeedMps` (default 1000 m/s) or timestamps are non-increasing
- Proof hash covers `latitude:longitude:accuracy:source:timestamp` — coordinate modification invalidates the hash
- Chain hash links sequential geotags via `computeChainHash()` — breaks in the chain are detected

Open gaps:

- No hardware attestation — all location claims are software-generated; device attestation (Android SafetyNet, iOS DeviceCheck) is not integrated. **Sprint 4.**
- `maxSpeedMps` default (1000 m/s) is too permissive for ground-level spoofing. **Sprint 3** — per-operator speed limits by transport mode.
- Single-claim spoofing is undetectable without prior location history. **Sprint 4** — multi-source corroboration.

**T — Tampering (High)**
Threat: Attacker modifies coordinates or geofence definitions to bypass geographic restrictions.

Mitigations:

- `validateLocation()` enforces `latitude ∈ [-90, 90]`, `longitude ∈ [-180, 180]`, non-negative `accuracy`
- `assertFiniteNumber()` used throughout; rejects `NaN`, `Infinity`, non-numeric inputs
- Proof hash covers all location fields — any field modification invalidates proof

---

## GCI — Compliance Intelligence

**Scope:** Overall compliance scores, domain weights, factor values, tier assignments, score change history

**Attack surface:** `calculateDomainScore()`, `calculateOverallScore()`, `createGCIScore()`, `determineTier()`, `meetsTierRequirement()`, `recordScoreChange()`

### Key Threats and Mitigations

**S — Spoofing (High)**
Threat: Attacker submits compliance data under false identity to inflate a non-compliant operator's score.

Mitigations:

- `GCIScore.operatorId` is expected to be a TradePass DID — cross-protocol identity anchor
- `ScoreFactor.evidence` references and `ScoreFactor.verifiedAt` timestamps record the basis for each factor value

Open gaps:

- `createGCIScore()` does not validate `operatorId` against `GTCX_DID_PATTERN` — accepts any string. **Sprint 3.**
- No authentication on scoring API — any caller can compute scores for any operator. **Sprint 3** — restrict to `CERTIFICATION` or `GOVERNMENT` credential holders.

**T — Tampering (Critical)**
Threat: Attacker manipulates domain weights or factor values to inflate/deflate scores.

Mitigations:

- Domain weight validation enforces sum to 100% in `calculateOverallScore()`
- Score factor values constrained to `[0, 100]`
- Score change events record previous and new values with timestamps

---

## VaultMark — Custody Chain

**Scope:** Custody records, custody transfers, verification challenges, challenge responses, custody event chain, witness signatures

**Attack surface:** `createCustodyRecord()`, `initiateCustodyTransfer()`, `createCustodyChallenge()`, `validateChallengeResponse()`, `updateCustodyStatus()`, `createCustodyEvent()`, `hashCustodyEvent()`

### Key Threats and Mitigations

**S — Spoofing (Critical)**
Threat: Attacker forges custody challenges or challenge responses to falsely prove or disprove custody.

Mitigations:

- `createCustodyChallenge()` generates cryptographic nonce with `randomBytes(16).toString('hex')`
- `validateChallengeResponse()` verifies all witness signatures against provided public key via Ed25519; signed payload covers `challengeId`, `proof`, `timestamp`, `nonce`
- Response timestamps must fall within `challenge.issuedAt` to `challenge.expiresAt` — outside-window responses rejected
- `response.challengeId` must match `challenge.id`

Open gaps:

- Challenge creation is unauthenticated — any caller can create challenges for any vault and asset. **Sprint 3** — restrict challenge issuance to authorized verifiers with TradePass credentials.
- All witness signatures verified against a single public key — no multi-party witness support. **Sprint 3** — per-witness public key registry.

**T — Tampering (Critical)**
Threat: Attacker modifies custody event chain to hide unauthorized asset movement.

Mitigations:

- `hashCustodyEvent()` computes SHA-256 over JSON of all event fields; output format `sha256:{hex_digest}`
- Merkle root over all custody events provides a tamper-evident summary of the full history
- Dual-signature requirement for transfers: both sender and receiver must sign

---

## PvP — Atomic Settlement

**Scope:** Settlement instructions, settlement legs, lock commitments, escrow records, escrow signatures, payments, disputes

**Attack surface:** `createSettlement()`, `lockLeg()`, `executeSettlement()`, `createEscrow()`, `lockEscrow()`, `executeEscrow()`, `createDispute()`

### Key Threats and Mitigations

**S — Spoofing (Critical)**
Threat: Attacker impersonates a settlement party to lock a leg or sign an escrow, redirecting assets or payments.

Mitigations:

- `lockLeg()` verifies `LockCommitment.signature` against party's public key via `@gtcx/crypto.verifySignature()` when `publicKeyBase64` is provided; signed payload covers `legId`, `settlementId`, `party`, `commitment`, `timestamp`
- `lockEscrow()` records per-party signatures in `escrow.signatures[partyId]` — all parties must sign before escrow reaches `locked` state

Open gaps:

- Signature verification in `lockLeg()` is optional — `publicKeyBase64` is an optional parameter. **Sprint 2** — make mandatory.
- `EscrowLockRecord.signature` is optional — an escrow can be locked without cryptographic proof of consent. **Sprint 3.**
- No TradePass DID validation on party identifiers — parties are string IDs only. **Sprint 3.**

**E — Elevation of Privilege (Critical)**
Threat: Attacker executes settlement without proper authorization (PANX quorum not met, GCI threshold not satisfied).

Mitigations:

- `executeSettlement()` checks that all legs are in `locked` state before execution
- GCI score gate checked at escrow creation and re-evaluated at settlement time
- PANX quorum (minimum 2/3 validators) required before payment release

---

## PANX — Oracle Consensus

**Scope:** Price feeds, oracle reputation scores, consensus results, message envelopes, oracle private keys

**Attack surface:** `validateSubmission()`, `buildConsensus()`, `signEnvelope()`, `verifyEnvelopeSignature()`, `ReplayCache.isReplay()`, `attestConsensus()`, `checkQuorum()`

### Key Threats and Mitigations

**S — Spoofing (Critical)**
Threat: Fake oracle node or replayed submission injects false price data into consensus.

Mitigations:

- Every `MessageEnvelope` signed via Ed25519 over canonicalized payload (`canonicalizeEnvelope()`)
- `validateSubmission()` verifies submission signature against oracle's registered public key
- Only oracles with `status === 'active'` pass validation
- `ReplayCache` rejects duplicate `messageId` values within 5-minute window (up to 100K entries)

Open gaps:

- No oracle registration authority — oracles are pre-registered with no protocol-level deregistration. **Sprint 3** — oracle registry with key rotation.
- Replay cache is in-memory; process restart clears cache, opening a replay window. **Sprint 4** — persistent replay cache.

**T — Tampering (High)**
Threat: Systematic bias injection via crafted prices within the deviation threshold.

Mitigations:

- `buildConsensus()` uses outlier rejection (removes prices outside the inter-quartile range before computing the median)
- BFT consensus tolerates up to 1/3 malicious validators — Byzantine fault tolerance holds if quorum is maintained
- Oracle reputation scores (`OracleNode.reputation`, 0–100) weight submissions; low-reputation oracles have reduced influence

---

## Open Gaps Summary

All open gaps tracked here are remediation targets. Sprints reference the 3-protocols roadmap.

| Protocol  | Gap                                       | Sprint Target | Severity |
| --------- | ----------------------------------------- | ------------- | -------- |
| TradePass | No DID revocation mechanism               | Sprint 3      | Critical |
| TradePass | No write auth on MemoryIdentityStore      | Sprint 3      | Critical |
| TradePass | No auth on credential status updates      | Sprint 3      | High     |
| GeoTag    | No hardware device attestation            | Sprint 4      | Critical |
| GeoTag    | Speed threshold too permissive            | Sprint 3      | High     |
| GCI       | operatorId not validated as DID           | Sprint 3      | High     |
| GCI       | No auth on scoring API                    | Sprint 3      | High     |
| VaultMark | Challenge creation unauthenticated        | Sprint 3      | Critical |
| VaultMark | Single public key for all witnesses       | Sprint 3      | High     |
| PvP       | lockLeg() signature verification optional | Sprint 2      | Critical |
| PvP       | No TradePass DID validation on parties    | Sprint 3      | High     |
| PANX      | No oracle registration authority          | Sprint 3      | High     |
| PANX      | In-memory replay cache lost on restart    | Sprint 4      | High     |

---

## Reference

- [cryptographic-inventory.md](cryptographic-inventory.md)
- [trust-model.md](../../1-architecture/trust-model.md)
