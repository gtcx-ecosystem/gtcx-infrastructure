# KORA - Universal Verification Oracle

**Verify any claim through multi-source consensus → trust score**


## Overview

KORA is the verification layer that creates tamper-proof validation through multi-source consensus. It cross-references claims against authoritative sources and generates cryptographic proofs.

## Core Capabilities

- **Multi-Source Validation**: Cross-reference claims against multiple authoritative sources
- **Trust Scoring**: Generate confidence scores based on evidence strength
- **Cryptographic Proofs**: Create verifiable, tamper-proof attestations
- **Dispute Detection**: Identify conflicting claims before they become problems
- **Federation**: Connect trust networks across organizations and jurisdictions

## Performance

| Metric | Target |
|--------|--------|
| Verification throughput | 100K+ claims/hour |
| Fraud detection rate | 99.9% |
| Proof generation | <500ms |
| Uptime | 99.95% SLA |

## Tech Stack

- **Language**: Rust (core), Python (orchestration)
- **Database**: PostgreSQL (relational), Neo4j (graph)
- **Cryptography**: Ed25519, SHA-256, Merkle trees
- **Consensus**: Byzantine fault-tolerant protocols
- **APIs**: gRPC, REST

## Plugin Architecture

### Validators (Pluggable)

```
kora/validators/
├── government/
│   ├── registry-lookup/      # Query government registries
│   ├── license-verification/ # Validate licenses/permits
│   ├── sanctions-screening/  # OFAC, UN, EU sanctions
│   └── tax-status/           # Tax compliance verification
├── geospatial/
│   ├── satellite-imagery/    # Verify location claims
│   ├── boundary-validation/  # Check against cadastre
│   ├── coordinate-verify/    # GPS authenticity
│   └── change-detection/     # Monitor for changes
├── community/
│   ├── attestation/          # Community witness validation
│   ├── reputation/           # Historical trust scoring
│   ├── consensus/            # Multi-party agreement
│   └── dispute-resolution/   # Conflict mediation
├── third-party/
│   ├── credit-bureaus/       # Financial history
│   ├── identity-providers/   # KYC verification
│   ├── certification-bodies/ # Standards compliance
│   └── audit-firms/          # Third-party audits
└── domain/
    ├── gtcx-gci/             # GTCX compliance scoring
    ├── land-ownership/       # Title verification
    └── custom/               # Your domain validators
```

### Trust Scoring

KORA generates trust scores based on evidence from multiple validators:

```rust
use kora::{Verification, TrustScore};

// Configure validators for your domain
let verification = Verification::new()
    .add_validator("government/registry-lookup")
    .add_validator("geospatial/satellite-imagery")
    .add_validator("community/attestation")
    .set_consensus_threshold(0.67);

// Verify a claim
let result = verification.verify(claim).await?;

// Get trust score and proof
let trust_score: TrustScore = result.score;        // 0.0 - 1.0
let proof: CryptographicProof = result.proof;      // Verifiable attestation
let evidence: Vec<Evidence> = result.evidence;     // Supporting data
```

### Cryptographic Proofs

KORA generates proofs that can be independently verified:

```rust
// Generate proof
let proof = kora::generate_proof(
    claim_id,
    evidence_set,
    validator_signatures
)?;

// Proof can be verified by anyone
let is_valid = kora::verify_proof(proof, public_keys)?;
```

## Integration

### Upstream
- **MABA**: Receives transformed data for verification

### Downstream
- **PANX Oracle**: Proofs feed consensus mechanism
- **GCI**: Trust scores feed compliance scoring
- **AMANI**: Verification status supports user guidance

## Documentation

Full agile-pm documentation in `agile-pm/` folder:
- Technical architecture: `04 - spec/`
- Security requirements: `09 - security/`
- Sprint planning: `06 - planning/`


*Source: Migrated from gtcx-ecosystem-migration/kora with domain abstraction*
