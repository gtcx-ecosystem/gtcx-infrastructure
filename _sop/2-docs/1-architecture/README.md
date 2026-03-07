# Architecture

System design, component diagrams, data flows, trust model, offline architecture, and architectural decision records for the GTCX Protocol layer.

## Contents

| Document                                           | Description                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [system-overview.md](system-overview.md)           | Three-layer stack, protocol components, data flow, deployment model, multi-commodity abstraction |
| [trust-model.md](trust-model.md)                   | Trust zones, Byzantine fault tolerance, validator categories, cryptographic standards            |
| [offline-architecture.md](offline-architecture.md) | Offline-first design, CRDT sync, conflict resolution, per-component queue limits                 |
| [network-architecture.md](network-architecture.md) | Network topology, mesh resilience, PANX message transport, peer discovery                        |
| [decisions/](decisions/)                           | Architectural Decision Records (ADRs)                                                            |

## What Belongs Here

- System design and component architecture
- Trust model and security zone definitions
- Offline-first architecture and sync protocols
- Network topology and consensus messaging
- ADRs — decisions that shaped the architecture

## What Does NOT Belong Here

- Protocol technical specifications → `../2-specs/`
- Security implementation details and threat models → `../3-engineering/`
- Runbooks and operational procedures → `../4-operations/`
