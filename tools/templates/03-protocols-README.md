# Protocols

> **Core verification protocols: TradePass, GCI, GeoTag, VaultMark, PvP, PANX**


## Protocol Overview

| Protocol | Purpose | Spec Section |
|----------|---------|--------------|
| [TradePass](./tradepass/) | Digital identity & credentials | [§3](../../gtcx-protocol-docs/spec/03-tradepass.md) |
| [GCI](./gci/) | Compliance scoring | [§4](../../gtcx-protocol-docs/spec/04-gci.md) |
| [GeoTag](./geotag/) | Location verification | [§5.1](../../gtcx-protocol-docs/spec/05-geotag-vaultmark.md) |
| [VaultMark](./vaultmark/) | Custody chain tracking | [§5.2](../../gtcx-protocol-docs/spec/05-geotag-vaultmark.md) |
| [PvP](./pvp/) | Payment-versus-Payment settlement | [§6](../../gtcx-protocol-docs/spec/06-pvp-settlement.md) |
| [PANX](./panx-oracle/) | Multi-stakeholder consensus | [§9.3](../../gtcx-protocol-docs/spec/09-network.md) |


## Protocol Layer Architecture

```
protocols/                    # Implementation
├── tradepass/               # Identity protocol
├── gci/                     # Compliance scoring
├── geotag/                  # Location verification
├── vaultmark/               # Custody tracking
├── pvp/                     # Settlement
└── panx/                    # Consensus

packages/schemas/            # Shared schemas (Zod)
├── identity/                # TradePass schemas
├── compliance/              # GCI schemas
├── location/                # GeoTag schemas
├── custody/                 # VaultMark schemas
└── settlement/              # PvP schemas
```


## Development Guide

### Creating a Protocol Feature

1. **Start with the schema** (`packages/schemas/`)
2. **Implement in protocol** (`protocols/<name>/`)
3. **Add tests** (unit + integration)
4. **Document** (update this folder + spec)

### Protocol Boundaries

- Protocols MUST NOT depend on platforms
- Protocols MAY depend on packages
- Protocols MUST use `packages/schemas` for data contracts


## Related Documentation

- [Full Protocol Specification](../../gtcx-protocol-docs/spec/)
- [Data Models](../../gtcx-protocol-docs/spec/07-data-models.md)
- [Test Vectors](../../gtcx-protocol-docs/TEST-VECTORS.md)
- [Glossary](../../gtcx-protocol-docs/GLOSSARY.md)
