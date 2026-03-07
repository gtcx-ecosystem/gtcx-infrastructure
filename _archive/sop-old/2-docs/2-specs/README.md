# Specs

Technical specifications, data models, API contracts, and schema definitions for the GTCX Protocol layer.

## Contents

| Document                               | Description                                                                             |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| [protocol-index.md](protocol-index.md) | All 6 protocols — overview, relationships, integration contracts, implementation status |
| [data-models.md](data-models.md)       | Shared schemas, `@gtcx/schemas` package structure, cross-protocol types, versioning     |
| [operator-types.md](operator-types.md) | 12 operator types, permissions matrix, market access tiers, role lifecycle              |

## Canonical Protocol Specs

Each protocol has its own full specification in the codebase:

| Protocol  | Spec                                                                  | Package                    |
| --------- | --------------------------------------------------------------------- | -------------------------- |
| TradePass | [`protocols/tradepass/SPEC.md`](../../../protocols/tradepass/SPEC.md) | `@gtcx/protocol-tradepass` |
| GeoTag    | [`protocols/geotag/SPEC.md`](../../../protocols/geotag/SPEC.md)       | `@gtcx/protocol-geotag`    |
| GCI       | [`protocols/gci/SPEC.md`](../../../protocols/gci/SPEC.md)             | `@gtcx/protocol-gci`       |
| VaultMark | [`protocols/vaultmark/SPEC.md`](../../../protocols/vaultmark/SPEC.md) | `@gtcx/protocol-vaultmark` |
| PvP       | [`protocols/pvp/SPEC.md`](../../../protocols/pvp/SPEC.md)             | `@gtcx/protocol-pvp`       |
| PANX      | [`protocols/panx/SPEC.md`](../../../protocols/panx/SPEC.md)           | `@gtcx/protocol-panx`      |

## What Belongs Here

- Cross-protocol specifications that span multiple protocols
- Shared data models and schema definitions
- Operator types, roles, and permissions
- Integration contracts between protocols
- Schema versioning and migration policy

## What Does NOT Belong Here

- Per-protocol technical specs → `protocols/*/SPEC.md`
- Security and threat models → `../3-engineering/`
- Implementation guides → `../3-engineering/`
