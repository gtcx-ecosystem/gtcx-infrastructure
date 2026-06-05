---
title: 'Engineering'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['engineering', 'build', 'tech-stack']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Engineering

Engineering documentation for the GTCX compliance substrate — build, integration, cross-repo coordination, and tech-stack conventions specific to this repo. For architecture decisions see [`../decisions/README.md`](../architecture/decisions/README.md); for runbooks see [`../operations/runbooks/README.md`](../operations/runbooks/README.md); for API specs see [`../api/openapi.yaml`](../api/openapi.yaml).

## Contents

| File                                                               | Purpose                                                       |
| ------------------------------------------------------------------ | ------------------------------------------------------------- |
| [`backend-architecture.md`](./backend-architecture.md)             | Substrate-level backend architecture (5-layer stack overview) |
| [`api-patterns.md`](./api-patterns.md)                             | Substrate-wide API design conventions                         |
| [`connection-pooling.md`](./connection-pooling.md)                 | Application-level PostgreSQL pool sizing                      |
| [`k8s-manifest-ownership.md`](./k8s-manifest-ownership.md)         | Manifest ownership between infrastructure + protocols repos   |
| [`llm-routing-strategy.md`](./llm-routing-strategy.md)             | Compliance-gateway LLM routing across providers + tiers       |
| [`low-bandwidth-mode.md`](./low-bandwidth-mode.md)                 | Adaptive low-bandwidth degradation (frontier regions)         |
| [`gtcx-platforms-m3-contract.md`](./gtcx-platforms-m3-contract.md) | Cross-repo M3 deliverables to gtcx-platforms                  |
| [`package-adoption-guide.md`](./package-adoption-guide.md)         | How sibling repos adopt `@gtcx/*` shared packages             |
| [`package-adoption-tracking.md`](./package-adoption-tracking.md)   | Cross-repo package-adoption metric tracking                   |
| [`deployment/deployment.md`](./deployment/deployment.md)           | Deployment procedures + gates                                 |
| [`tech-stack/`](./tech-stack/)                                     | Tech-stack choices, version pinning, dependency boundaries    |

## What was removed (2026-05-24 cleanup)

The following template stubs were deleted as part of the docs cleanup — none had substantive content, all contained literal placeholders (`{Project Name}`, `[Organization Name]`, etc.):

- `agentic-guide.md` — superseded by `gtcx-docs` Protocol 1 v2.0
- `api-specification.md` — superseded by the canonical OpenAPI spec at `../api/openapi.yaml`
- `architecture-docs-protocol.md` — superseded by `gtcx-docs` Protocol 13
- `content-schema.md` — `[Organization Name]` template; not applicable
- `database-schema.md` — `{Project Name}` template; see `../decisions/ADR-008-dual-database-architecture.md` for the canonical dual-DB spec
- `microservices-architecture.md` — `{Service Name}` template; not applicable
- `system-architecture-spec.md` — `{system-name}` template; superseded by `../architecture/system-overview.md`
