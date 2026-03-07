# ADR-009: Platform Architecture Pattern

## Status

Accepted

## Date

2026-01-26

## Context

[Organization Name] has multiple audience-facing platforms ([Platform A], [Platform B], [Platform C], [Platform D], [Platform E], [Platform F], [Platform G]) that serve different stakeholder groups. We needed to decide how much logic lives in platforms versus shared modules.

Options considered:

1. **Platforms as Full Applications** — Each platform is standalone with significant logic
2. **Platforms as Thin Orchestration Layers** — All logic in shared modules, platforms just compose
3. **Hybrid** — Core logic in shared modules, platform-specific workflows in platforms

## Decision

**Platforms are thin orchestration layers.** They:

1. **Compose shared content** into audience-specific experiences
2. **Define access control rules** for their user segment
3. **Configure distribution** for their channels
4. **Expose unique value propositions** that combine intelligence capabilities

Platforms do NOT:

- Duplicate intelligence logic
- Implement their own editorial standards (use `publishing/editorial/`)
- Define content schemas (use `technology/schemas/`)
- Build independent distribution (use `publishing/distribution/`)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  PLATFORM LAYER (Thin Orchestration)                            │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │[Platform A]│ │[Platform B]│ │ [Platform C]│ │[Platform D]│           │
│  │ Registry │ │   Intel  │ │ Analysis │ │  News    │           │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           │
│       │            │            │            │                  │
│       └────────────┴────────────┴────────────┘                  │
│                          ↓                                      │
│              ┌────────────────────────┐                         │
│              │   Shared Publishing    │                         │
│              │   Editorial, Agentic   │                         │
│              └────────────┬───────────┘                         │
└───────────────────────────┼─────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  INTELLIGENCE LAYER (All Source Data)                           │
│                                                                  │
│  [Index A]™ • [Index B]™ • [Intelligence Product]™ • Research • Knowledge Base          │
└─────────────────────────────────────────────────────────────────┘
```

## Platform Definitions

| Platform         | Audience          | Core Value                         |
| ---------------- | ----------------- | ---------------------------------- |
| **[Platform A]** | Trade principals  | Verified counterparty registry     |
| **[Platform A]** | Subscribers       | Premium intelligence products      |
| **[Platform A]** | Deep readers      | Long-form sector analysis          |
| **[Platform A]** | Real-time users   | Breaking news, market alerts       |
| **[Platform A]** | Government/policy | Policy briefs, regulatory analysis |
| **[Platform A]** | Contributors      | Contributor platform, community    |
| **[Platform D]** | Enterprises       | Data feeds, API access             |

## Consequences

### Positive

- Clear separation of concerns
- Intelligence improvements automatically benefit all platforms
- Audience-specific customization without duplication
- Easier testing (mock intelligence, test platform logic)

### Negative

- Requires discipline to keep logic in shared modules
- Platform developers must understand intelligence APIs
- Cross-platform coordination for shared features

## References

- Adapted from [Protocol Partner] ADR-0010
- [Content-First Architecture](./ADR-007-content-first-architecture.md)
