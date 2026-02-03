# Architecture

> **System design, architectural decisions, and technical diagrams**


## Contents

| Section | Description |
|---------|-------------|
| [decisions/](./decisions/) | Architecture Decision Records (ADRs) |
| [diagrams/](./diagrams/) | System diagrams and visualizations |
| [TECH-STACK.md](./TECH-STACK.md) | Technology choices and rationale |


## System Overview

GTCX uses a **three-layer architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     EXCHANGE LAYER                          │
│         SGX (Sovereign) │ CRX (Regulatory) │ AGX (Global)   │
├─────────────────────────────────────────────────────────────┤
│                    OPERATIONS LAYER                         │
│              CaaS │ VIA™ │ VXA™ │ Field Ops                 │
├─────────────────────────────────────────────────────────────┤
│                     PROTOCOL LAYER                          │
│   TradePass™ │ GCI™ │ GeoTag™ │ VaultMark™ │ PvP™ │ PANX™  │
└─────────────────────────────────────────────────────────────┘
```

See [Protocol Spec §2](../../gtcx-protocol-docs/spec/02-architecture.md) for full details.


## Key Architectural Decisions

| ADR | Decision | Status |
|-----|----------|--------|
| [ADR-001](./decisions/ADR-001-monorepo-structure.md) | Monorepo structure | [Done] Accepted |
| [ADR-002](./decisions/ADR-002-commodity-agnostic-design.md) | Commodity-agnostic design | [Done] Accepted |
| [ADR-003](./decisions/ADR-003-ai-native-architecture.md) | AI-native architecture | [Done] Accepted |
| [ADR-004](./decisions/ADR-004-offline-first-mobile.md) | Offline-first mobile | [Done] Accepted |
| [ADR-005](./decisions/ADR-005-cryptographic-primitives.md) | Cryptographic primitives | [Done] Accepted |
| [ADR-006](./decisions/ADR-006-package-boundaries.md) | Package boundaries | [Done] Accepted |
| [ADR-007](./decisions/ADR-007-rust-foundational-layer.md) | Rust foundational layer | [Done] Accepted |


## Guiding Principles

Architecture decisions must align with the [30 Engineering Principles](../05-engineering/PRINCIPLES.md):

1. **PROOF** — Mathematical certainty over institutional trust
2. **SOVEREIGN** — Each nation controls its infrastructure
3. **OFFLINE** — 30+ days autonomous operation
4. **MODULAR** — Composable, replaceable components
5. **SECURE** — All crypto in Rust, defense in depth


## Related Documentation

- [Full Protocol Specification](../../gtcx-protocol-docs/spec/)
- [Spec-to-Code Map](../../gtcx-protocol-docs/SPEC-TO-CODE-MAP.md)
- [Deployment Architecture](../06-deployment/)
