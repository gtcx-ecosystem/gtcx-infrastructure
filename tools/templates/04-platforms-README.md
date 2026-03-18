# Platforms

> **Exchange and operations platforms: SGX, CRX, AGX, CaaS**

## Platform Overview

| Platform                | Purpose                           | Layer      |
| ----------------------- | --------------------------------- | ---------- |
| [SGX](./sgx/)           | Sovereign Governance Exchange     | Exchange   |
| [CRX](./crx/)           | Compliance Regulatory Exchange    | Exchange   |
| [AGX](./agx/)           | Africa Gold Exchange (Global)     | Exchange   |
| [CaaS](./caas/)         | Compliance-as-a-Service (VIA/VXA) | Operations |
| [Pathways](./pathways/) | ASM Pathways Protocol             | Operations |

## Architecture Position

```
┌─────────────────────────────────────────────────────────────┐
│                     EXCHANGE LAYER                          │
│                                                             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│   │   SGX   │    │   CRX   │    │   AGX   │                │
│   │Sovereign│    │Regulatory│   │ Global  │                │
│   └─────────┘    └─────────┘    └─────────┘                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    OPERATIONS LAYER                         │
│                                                             │
│   ┌─────────────────────┐    ┌─────────────────────┐       │
│   │        CaaS         │    │      Pathways       │       │
│   │  VIA™ │ VXA™        │    │   ASM Financing     │       │
│   └─────────────────────┘    └─────────────────────┘       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     PROTOCOL LAYER                          │
│           (TradePass™, GCI™, GeoTag™, etc.)                 │
└─────────────────────────────────────────────────────────────┘
```

## Platform Descriptions

### SGX — Sovereign Governance Exchange

National exchange instance under full government control.

- Data sovereignty: all data stays in-country
- Configurable compliance rules
- Government-controlled identity issuance

### CRX — Compliance Regulatory Exchange

Regulatory workflow platform for government agencies.

- Export licensing workflows
- Tax calculation and collection
- Compliance reporting dashboards

### AGX — Africa Gold Exchange

Multi-sovereign global exchange for cross-border trade.

- Federation of SGX instances
- Cross-border proof exchange
- International marketplace

### CaaS — Compliance-as-a-Service

AI-powered field compliance infrastructure.

- **VIA**: Virtual Instructor Agent (education, onboarding)
- **VXA**: Virtual Inspection Agent (verification, evidence capture)

## Development Guide

### Platform Dependencies

```
platforms/
├── sgx/      → depends on: protocols/, packages/
├── crx/      → depends on: protocols/, packages/
├── agx/      → depends on: sgx/, protocols/, packages/
├── caas/     → depends on: protocols/, packages/ai/
└── shared/   → shared platform utilities
```

### Platform Boundaries

- Platforms MAY depend on protocols and packages
- Platforms MUST NOT depend on apps
- Platforms SHOULD share code via `platforms/shared/`

## Related Documentation

- [Protocol Specification §2.3-2.4](../../gtcx-ecosystem-docs/spec/02-architecture.md)
- [VIA/VXA Framework](../../gtcx-ecosystem-docs/addenda/E-ai-native.md)
- [Deployment Guide](../06-deployment/)
