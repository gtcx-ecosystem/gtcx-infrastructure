# Protocol Index

Six protocols comprise the GTCX Protocol Layer. Each is independently deployable and versioned. Together they form the complete verification and settlement stack.

---

## Protocol Summary

| Protocol      | Purpose                                              | Package                    | Layer | Status |
| ------------- | ---------------------------------------------------- | -------------------------- | ----- | ------ |
| **TradePass** | Identity, credentials, roles, trust scoring          | `@gtcx/protocol-tradepass` | L1    | Active |
| **GeoTag**    | Cryptographic location verification and origin proof | `@gtcx/protocol-geotag`    | L1    | Active |
| **GCI**       | Continuous compliance scoring (0–100)                | `@gtcx/protocol-gci`       | L1    | Active |
| **VaultMark** | Chain of custody from extraction to buyer            | `@gtcx/protocol-vaultmark` | L1    | Active |
| **PvP**       | Atomic payment-versus-physical settlement            | `@gtcx/protocol-pvp`       | L1    | Active |
| **PANX**      | Multi-stakeholder oracle consensus and price data    | `@gtcx/protocol-panx`      | L1    | Active |

---

## Protocol Relationships

TradePass is the identity foundation. Every other protocol depends on it.

```
TradePass (identity anchor)
  ├──▶ GeoTag         (location proof; requires producer TradePass DID)
  ├──▶ GCI            (compliance score; requires identity + verifications)
  └──▶ VaultMark      (custody chain; every custodian needs TradePass DID)
            └──▶ PvP  (settlement; requires VaultMark custody proof + GCI score)
                  └──▶ PANX (consensus for all high-value operations)
```

GeoTag is the origin anchor for VaultMark — every VaultMark asset creation must reference a GeoTag credential from the extraction site. PANX is invoked by VaultMark and PvP for high-value transfer attestation and settlement authorization.

---

## Protocol Integration Contracts

### TradePass → All Protocols

Every inter-protocol call requires a valid TradePass DID for the acting party. Protocols verify:

1. DID format: `did:gtcx:tp_[a-f0-9]{16}`
2. Credential is active (not suspended or revoked)
3. Role assignment is valid for the requested operation
4. Trust score meets the minimum threshold for the operation

### GeoTag → VaultMark

VaultMark asset creation requires a GeoTag credential as the origin anchor:

```
VaultMark.createAsset({
  origin: {
    geoTag: <GeoTag credential ID>,   // Required
    producer: <TradePass DID>,
    extractedAt: <timestamp>,
  }
})
```

The GeoTag credential must be within the producer's licensed area. VaultMark validates this on asset creation.

### GCI → PvP

PvP settlement conditions include a minimum GCI score for the seller:

```
PvP.createEscrow({
  conditions: {
    minGciScore: 50,   // Default; buyer configures per transaction
    ...
  }
})
```

GCI scores are cached and re-evaluated at settlement time. If the score drops below the threshold between escrow creation and settlement, settlement is blocked pending appeal or renegotiation.

### VaultMark → PvP

PvP requires a VaultMark custody proof to confirm physical asset control before releasing payment:

```
PvP.createEscrow({
  asset: {
    vaultMarkId: <VaultMark asset ID>,
    ...
  }
})
```

Settlement is atomic — VaultMark custody transfer and payment release occur in the same transaction. Neither completes without the other.

### PANX → VaultMark + PvP

PANX provides consensus attestation for:

- High-value VaultMark transfers (threshold configurable per commodity)
- All PvP settlements (required, minimum 2/3 validator quorum)

The PANX consensus hash is stored on both the VaultMark custody event and the PvP settlement record as an immutable attestation reference.

---

## Per-Protocol Highlights

### TradePass

- W3C DID Core 1.0 — `did:gtcx:tp_<hash>`
- W3C Verifiable Credentials — Ed25519 signed, offline-cacheable for 45 days
- 12 operator types with fine-grained RBAC
- Predicate-based claim model — new verification types added via registry, no code deployment
- Biometric binding — keys generated from biometric seed, never exported from device
- **Spec:** `protocols/tradepass/SPEC.md`

### GeoTag

- Three-layer verification: Device GPS + Network correlation + Satellite (premium)
- Spoofing detection: multi-constellation GPS, network cross-check, replay detection
- Licensed area validation against government-issued mining/agricultural licenses
- Offline capture for 30 days; 1,000 location queue
- **Spec:** `protocols/geotag/SPEC.md`

### GCI

- Continuous 0–100 score across 5 weighted factor categories
- Market access gated by score tier: PREMIUM (85+), VERIFIED (70–84), PROVISIONAL (50–69)
- Price premium of up to 22% for PREMIUM-tier producers
- Three-tier appeal process: administrative → technical → arbitration
- Per-commodity weight calibration (gold, coffee, cobalt, timber configs differ)
- **Spec:** `protocols/gci/SPEC.md`

### VaultMark

- Dual-signature transfers: both sender and receiver must sign
- SHA-256 merkle root over all custody events — tamper-evident history
- NFC seal integration: chip-level binding between physical asset and digital record
- Supports asset split, merge, and adjustment events
- Offline for 30 days; 500 transfer queue with ordered replay on sync
- **Spec:** `protocols/vaultmark/SPEC.md`

### PvP

- Atomic settlement: custody transfer and payment release in one transaction
- PANX consensus required before any funds are released
- Multi-currency: USD/EUR/GBP/GHS/KES + MTN MoMo/M-Pesa + USDC/USDT
- Three-tier dispute resolution: automatic (24h) → mediation (72h) → arbitration (7 days)
- Fee distribution: 40% Treasury, 30% Sovereign, 20% Operator, 10% PANX validators
- **Spec:** `protocols/pvp/SPEC.md`

### PANX

- Two functions: oracle consensus (price data) + settlement validation (attestations)
- Node types: gateway, regional_hub, validator, relay, mesh_anchor, edge
- Six transport protocols: wss, https, mqtt, ble, lora, meshtastic
- Byzantine fault tolerant — tolerates up to 1/3 malicious validators
- Cached attestations valid for offline verification; pending ops queue
- **Spec:** `protocols/panx/SPEC.md`

---

## Implementation Status

| Component                           | TradePass | GeoTag | GCI | VaultMark | PvP     | PANX |
| ----------------------------------- | --------- | ------ | --- | --------- | ------- | ---- |
| Core state machine                  | ✅        | ✅     | ✅  | ✅        | ✅      | ✅   |
| Dual-signature / multi-sig          | ✅        | —      | —   | ✅        | ✅      | ✅   |
| Offline queue + conflict resolution | ✅        | ✅     | ✅  | ✅        | Partial | —    |
| PANX attestation integration        | ✅        | ✅     | ✅  | ✅        | ✅      | —    |
| NFC / hardware binding              | —         | ✅     | —   | ✅        | —       | —    |
| Multi-commodity configuration       | ✅        | ✅     | ✅  | ✅        | ✅      | —    |
| SDK (TypeScript + Python)           | ✅        | ✅     | ✅  | ✅        | ✅      | ✅   |

---

## Reference

- [system-overview.md](../1-architecture/system-overview.md)
- `protocols/*/SPEC.md` — individual protocol technical detail
