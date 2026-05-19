---
title: 'Decisions'
status: 'current'
date: '2026-05-17'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'database', 'network', 'mobile']
review_cycle: 'monthly'
---

# Decisions

Architecture Decision Records (ADRs) capturing key design choices and their rationale.

## ADRs

| ADR                                                   | Title                                               | Status   |
| ----------------------------------------------------- | --------------------------------------------------- | -------- |
| [ADR-001](ADR-001-monorepo-structure.md)              | Monorepo Structure                                  | Accepted |
| [ADR-002](ADR-002-commodity-agnostic-design.md)       | Commodity-Agnostic Design                           | Accepted |
| [ADR-003](ADR-003-ai-native-architecture.md)          | AI-Native Architecture                              | Accepted |
| [ADR-004](ADR-004-offline-first-mobile.md)            | Offline-First Mobile Architecture                   | Accepted |
| [ADR-005](ADR-005-jurisdiction-plugins.md)            | Jurisdiction Plugin Architecture                    | Accepted |
| [ADR-006](ADR-006-package-boundaries.md)              | Package Boundaries and Dependencies                 | Accepted |
| [ADR-007](ADR-007-kustomize-over-helm.md)             | Use Kustomize over Helm for K8s manifest management | Accepted |
| [ADR-008](ADR-008-dual-database-architecture.md)      | Separate operational and audit databases            | Accepted |
| [ADR-009](ADR-009-error-taxonomy.md)                  | Structured Error Taxonomy                           | Accepted |
| [ADR-010](ADR-010-in-memory-stub-guards.md)           | In-Memory Stub Guards                               | Accepted |
| [ADR-011](ADR-011-connectivity-profiles.md)           | Connectivity Profiles                               | Accepted |
| [ADR-012](ADR-012-deprecate-gtcx-core12-gtcx-amis.md) | Deprecate `gtcx-core12` and `gtcx-amis`             | Accepted |
| [ADR-013](ADR-013-mtls-service-mesh.md)               | mTLS and Service Mesh Architecture                  | Accepted |

## Adding a New ADR

1. Use the next sequential ADR number.
2. Name file `ADR-NNN-short-title.md`.
3. Include status, context, decision, and consequences.
4. Update this README.
