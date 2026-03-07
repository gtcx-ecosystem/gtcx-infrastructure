# Security

Security architecture, cryptographic inventory, and per-protocol threat models for the GTCX Protocol layer.

## Contents

| Document                                                 | Description                                                                               |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [cryptographic-inventory.md](cryptographic-inventory.md) | Algorithms, key formats, FIPS 140-2 status, FIPS migration plan                           |
| [threat-models.md](threat-models.md)                     | STRIDE threat models for all six protocols — TradePass, GeoTag, GCI, VaultMark, PvP, PANX |

## What Belongs Here

- Cryptographic algorithm inventory and compliance status
- STRIDE threat models per protocol
- Security audit findings and remediation tracking
- Incident response procedures (link to `../../../4-operations/`)

## What Does NOT Belong Here

- Infrastructure security → `../../../4-operations/`
- Access control and role permissions → `../../2-specs/operator-types.md`
- Trust model → `../../1-architecture/trust-model.md`
