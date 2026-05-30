---
title: 'Decisions'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'database', 'network', 'mobile']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Decisions

Architecture Decision Records (ADRs) capturing key design choices and their rationale.

## ADRs

| ADR                                                        | Title                                               | Status   |
| ---------------------------------------------------------- | --------------------------------------------------- | -------- |
| [ADR-001](ADR-001-monorepo-structure.md)                   | Monorepo Structure                                  | Accepted |
| [ADR-002](ADR-002-commodity-agnostic-design.md)            | Commodity-Agnostic Design                           | Accepted |
| [ADR-003](ADR-003-ai-native-architecture.md)               | AI-Native Architecture                              | Accepted |
| [ADR-004](ADR-004-offline-first-mobile.md)                 | Offline-First Mobile Architecture                   | Accepted |
| [ADR-005](ADR-005-jurisdiction-plugins.md)                 | Jurisdiction Plugin Architecture                    | Accepted |
| [ADR-006](ADR-006-package-boundaries.md)                   | Package Boundaries and Dependencies                 | Accepted |
| [ADR-007](ADR-007-kustomize-over-helm.md)                  | Use Kustomize over Helm for K8s manifest management | Accepted |
| [ADR-008](ADR-008-dual-database-architecture.md)           | Separate operational and audit databases            | Accepted |
| [ADR-009](ADR-009-error-taxonomy.md)                       | Structured Error Taxonomy                           | Accepted |
| [ADR-010](ADR-010-in-memory-stub-guards.md)                | In-Memory Stub Guards                               | Accepted |
| [ADR-011](ADR-011-connectivity-profiles.md)                | Connectivity Profiles                               | Accepted |
| [ADR-012](ADR-012-deprecate-gtcx-core12-gtcx-amis.md)      | Deprecate `gtcx-core12` and `gtcx-amis`             | Accepted |
| [ADR-013](ADR-013-mtls-service-mesh.md)                    | mTLS and Service Mesh Architecture                  | Accepted |
| [ADR-014](ADR-014-nats-jetstream-audit-transport.md)       | NATS JetStream as the Audit Record Transport        | Accepted |
| [ADR-015](ADR-015-per-tenant-jetstream-subject-routing.md) | Per-Tenant JetStream Subject Routing                | Accepted |
| [ADR-016](ADR-016-fail-closed-audit-signing.md)            | Fail-Closed Audit Signing in Production             | Accepted |
| [ADR-017](ADR-017-adaptive-policy-tuning.md)               | Adaptive Policy Tuning with Signed Transitions      | Accepted |
| [ADR-018](ADR-018-pen-test-contained-overlay.md)           | Pen-Test Contained-Blast-Radius Kubernetes Overlay  | Accepted |
| [ADR-019](ADR-019-workspace-boundary-discipline.md)        | Workspace Package Boundary Discipline               | Accepted |
| [ADR-020](ADR-020-per-package-coverage-thresholds.md)      | Per-Package Coverage Thresholds                     | Accepted |
| [ADR-021](ADR-021-npm-publish-discipline.md)               | npm Publish Discipline + Supply-Chain Roadmap       | Accepted |
| [ADR-022](ADR-022-pluggable-audit-query-store.md)          | Pluggable Audit-Query Store with Three Backends     | Accepted |

## Adding a New ADR

1. Use the next sequential ADR number.
2. Name file `ADR-NNN-short-title.md`.
3. Include status, context, decision, and consequences.
4. Update this README.
