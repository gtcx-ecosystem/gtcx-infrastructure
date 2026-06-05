# Protocols

> **Core verification protocols: TradePass, GCI, GeoTag, VaultMark, PvP, PANX**

## Protocol Overview

| Protocol                  | Purpose                           | Spec Section                                                  |
| ------------------------- | --------------------------------- | ------------------------------------------------------------- |
| [TradePass](./tradepass/) | Digital identity & credentials    | [§3](../../gtcx-ecosystem-docs/spec/03-tradepass.md)          |
| [GCI](./gci/)             | Compliance scoring                | [§4](../../gtcx-ecosystem-docs/spec/04-gci.md)                |
| [GeoTag](./geotag/)       | Location verification             | [§5.1](../../gtcx-ecosystem-docs/spec/05-geotag-vaultmark.md) |
| [VaultMark](./vaultmark/) | Custody chain tracking            | [§5.2](../../gtcx-ecosystem-docs/spec/05-geotag-vaultmark.md) |
| [PvP](./pvp/)             | Payment-versus-Payment settlement | [§6](../../gtcx-ecosystem-docs/spec/06-pvp-settlement.md)     |
| [PANX](./panx-oracle/)    | Multi-stakeholder consensus       | [§9.3](../../gtcx-ecosystem-docs/spec/09-network.md)          |

## Protocol Layer Architecture

```
protocols/                    # Implementation
├── tradepass/               # Identity protocol
├── gci/                     # Compliance scoring
├── geotag/                  # Location verification
├── vaultmark/               # Custody tracking
├── pvp/                     # Settlement
└── panx/                    # Consensus

03-platform/packages/schemas/            # Shared schemas (Zod)
├── identity/                # TradePass schemas
├── compliance/              # GCI schemas
├── location/                # GeoTag schemas
├── custody/                 # VaultMark schemas
└── settlement/              # PvP schemas
```

## Development Guide

### Creating a Protocol Feature

1. **Start with the schema** (`03-platform/packages/schemas/`)
2. **Implement in protocol** (`protocols/<name>/`)
3. **Add tests** (unit + integration)
4. **Document** (update this folder + spec)

### Protocol Boundaries

- Protocols MUST NOT depend on platforms
- Protocols MAY depend on packages
- Protocols MUST use `03-platform/packages/schemas` for data contracts

## Related Documentation

- [Full Protocol Specification](../../gtcx-ecosystem-docs/spec/)
- [Data Models](../../gtcx-ecosystem-docs/spec/07-data-models.md)
- [Test Vectors](../../gtcx-ecosystem-docs/TEST-VECTORS.md)
- [Glossary](../../gtcx-ecosystem-docs/GLOSSARY.md)
