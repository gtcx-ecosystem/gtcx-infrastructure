# Decisions

Architecture Decision Records (ADRs) capturing key design choices and their rationale.

## ADRs

| ADR                                                 | Title                               | Status   |
| --------------------------------------------------- | ----------------------------------- | -------- |
| [ADR-001](ADR-001-monorepo-structure.md)            | Monorepo Structure                  | Accepted |
| [ADR-002](ADR-002-commodity-agnostic-design.md)     | Commodity-Agnostic Design           | Accepted |
| [ADR-003](ADR-003-ai-native-architecture.md)        | AI-Native Architecture              | Accepted |
| [ADR-004](ADR-004-offline-first-mobile.md)          | Offline-First Mobile Architecture   | Accepted |
| [ADR-005](ADR-005-jurisdiction-plugins.md)          | Jurisdiction Plugin Architecture    | Accepted |
| [ADR-006](ADR-006-package-boundaries.md)            | Package Boundaries and Dependencies | Accepted |
| [ADR-007](ADR-007-content-first-architecture.md)    | Content-First Architecture          | Accepted |
| [ADR-008](ADR-008-multi-channel-distribution.md)    | Multi-Channel Distribution          | Accepted |
| [ADR-009](ADR-009-platform-architecture-pattern.md) | Platform Architecture Pattern       | Accepted |
| [ADR-010](ADR-010-service-taxonomy.md)              | Service Taxonomy — Four-Tier Model  | Accepted |
| [ADR-011](ADR-011-connectivity-profiles.md)         | Connectivity Profiles               | Accepted |

> Note: ADR-007 and ADR-008 have title/filename number mismatches (internal titles say ADR-004 and ADR-006 respectively). The filenames are canonical.

## Adding a New ADR

Use the template at [`repo/2-docs/3-engineering/6-decisions/adr-template.md`](../../2-docs/engineering/6-decisions/adr-template.md).

ADRs follow the format: `ADR-{NNN}-{kebab-case-title}.md`
