# GTCX Infrastructure — Documentation

Single source of truth for all infrastructure documentation.

## Directory Map

```
docs/
├── agents/              Agent onboarding, roles, workflows, governance
├── agile/               Roadmap, sprints, backlog, testing, retrospectives
├── architecture/        System design, trust model, network, offline, migrations
├── assessments/         Repo audits, remediation plans, ecosystem integration
├── audit/               QA reviews, audit roadmaps, infrastructure assessments
├── compliance/          Regulatory frameworks, controls, SOC2, accessibility
├── decisions/           Architecture Decision Records (ADRs)
├── devops/              Environments, CI/CD, monitoring, QA, release management
├── engineering/         Backend architecture, API patterns, schemas, deployment
├── external/            Public-facing docs (quickstart, integration, governance)
├── operations/          Production runbooks (deploy, migrate, DR, incidents)
├── principles/          Infrastructure philosophy and values
├── reference/           Glossary, changelog, writing guide, SLOs
├── release/             GA checklist, legal, licenses, versioning
├── research/            Industry landscape, competitors, network concepts
├── scripts/             Doc hygiene automation
├── security/            Architecture, threat model, NIST, CMMC, FIPS, STIG
└── specs/               System specs (CI/CD, observability, resilience, scaling, testing)

---

## Audit

- [Infrastructure Improvement Roadmap](audit/qa-reviews/2026-05-05-infrastructure-improvement-roadmap.md) — 2026-05-05 QA Review findings and roadmap
```

---

## Architecture

- [System Overview](architecture/system-overview.md) — Three-layer stack, deployment model, trust zones
- [Infrastructure Architecture](architecture/infrastructure-architecture-overview.md) — 4-tier deployment, K8s topology, edge mesh
- [Infrastructure Overview](architecture/infrastructure-overview.md) — Same code everywhere, config differs
- [Trust Model](architecture/trust-model.md) — Zero-trust boundaries, Byzantine fault tolerance
- [Network Architecture](architecture/network-architecture.md) — Topology, mesh resilience, peer discovery
- [Offline Architecture](architecture/offline-architecture.md) — Offline-first design, CRDT sync
- [Migrations](architecture/migrations-overview.md) — MABA/KORA/AMANI data transformation stack

## Decisions

- [ADR-001](decisions/ADR-001-monorepo-structure.md) — Monorepo structure
- [ADR-002](decisions/ADR-002-commodity-agnostic-design.md) — Commodity-agnostic design
- [ADR-003](decisions/ADR-003-ai-native-architecture.md) — AI-native architecture
- [ADR-004](decisions/ADR-004-offline-first-mobile.md) — Offline-first mobile
- [ADR-005](decisions/ADR-005-jurisdiction-plugins.md) — Jurisdiction plugins
- [ADR-006](decisions/ADR-006-package-boundaries.md) — Package boundaries
- [ADR-007](decisions/ADR-007-kustomize-over-helm.md) — Kustomize over Helm
- [ADR-008](decisions/ADR-008-dual-database-architecture.md) — Dual database architecture
- [ADR-011](decisions/ADR-011-connectivity-profiles.md) — Connectivity profiles
- [001 Error Taxonomy](decisions/001-error-taxonomy.md)
- [002 In-Memory Stub Guards](decisions/002-in-memory-stub-guards.md)
- [ADR Guide](decisions/adr-guide.md) | [ADR Template](decisions/adr-template.md)

## Engineering

- [Backend Architecture](engineering/backend-architecture.md) — Service topology, build targets
- [Microservices Architecture](engineering/microservices-architecture.md) — Monorepo patterns
- [API Patterns](engineering/api-patterns.md) — Design standards
- [API Specification](engineering/api-specification.md) — Full API spec
- [Database Schema](engineering/database-schema.md) — Schema conventions
- [Content Schema](engineering/content-schema.md) — Content data models
- [System Architecture Spec](engineering/system-architecture-spec.md)
- [Deployment](engineering/deployment/deployment.md) — Deployment procedures
- [Tech Stack](engineering/tech-stack/tech-stack.md) | [Versions](engineering/tech-stack/version-standards.md) | [Dependencies](engineering/tech-stack/dependency-boundaries.md)
- [Connection Pooling](engineering/connection-pooling.md) | [Agentic Guide](engineering/agentic-guide.md)

## Operations

- [Deploy](operations/runbooks/deploy.md) — Canary deployment, approval gates, rollback
- [Migrate](operations/runbooks/migrate.md) — Database migration procedures
- [Release](operations/runbooks/release.md) — Release gate and evidence
- [Disaster Recovery](operations/runbooks/disaster-recovery.md)
- [Incident Response](operations/runbooks/incident-response.md)
- [Monitoring](operations/runbooks/monitoring.md)
- [Database Failover](operations/runbooks/database-failover.md)
- [Terraform State Migration](operations/runbooks/terraform-state-migration.md)
- [Quality Runbook](operations/runbooks/quality-runbook.md) — CI triage order
- [Production Store Integration](operations/runbooks/production-store-integration.md)

## Security

- [Security Framework](security/security-framework.md) — Zero-trust, crypto standards
- [Security Architecture](security/security-architecture.md)
- [Threat Model](security/threat-model.md)
- [Security Policy](security/security-policy.md)
- [Secrets Management](security/secrets-management.md)
- [Defense Readiness](security/defense-readiness.md) — CMMC L2
- [NIST 800-53](security/nist-800-53-mapping.md)
- [FIPS Assessment](security/fips-assessment.md)
- [STIG Compliance](security/stig-compliance.md)

## Compliance

- [Requirements](compliance/compliance-requirements.md)
- [Controls Matrix](compliance/controls-matrix.md)
- [Regulatory Framework](compliance/regulatory-framework.md)
- [SOC2 Evidence Pipeline](compliance/soc2-evidence-pipeline.md)
- [Compliance Templates](compliance/compliance-templates-overview.md) — Per-jurisdiction configs
- [Accessibility Checklist](compliance/accessibility-checklist.md)

## Specs

- [CI/CD Pipeline](specs/cicd-pipeline.md) — Stages, quality gates, security scanning
- [Data Governance](specs/data-governance.md) — Classification, PII, sovereignty
- [Observability](specs/observability-framework.md) — Metrics, logging, tracing, SLOs
- [Resilience](specs/resilience-framework.md) — RTO/RPO, SPOF, degradation tiers
- [Scalability](specs/scalability-framework.md) — HPA, caching, load testing
- [Testing](specs/testing-framework.md) — Taxonomy, coverage targets, CI gates
- [specs/design/](specs/design/) — Design system, UX research, personas, journeys
- [specs/frontend/](specs/frontend/) — Frontend PRD, epics, architecture, screens
- [specs/data/](specs/data/) — Data specifications
- [specs/testing/](specs/testing/) — Test plans

## DevOps

- [Environments](devops/environments/environment-config.md)
- [CI/CD](devops/ci-cd/ci-cd.md)
- [Monitoring](devops/monitoring/monitoring-setup.md)
- [QA](devops/qa/qa-process.md)
- [Release Checklist](devops/release/release-checklist.md) | [Legal Sign-off](devops/release/legal-sign-off.md)

## Agents

- [Orientation](agents/onboarding/orientation.md) — Start here
- [Service Overview](agents/onboarding/service-overview.md)
- [Developer Quickstart](agents/onboarding/developer-quickstart.md)
- [Developer Setup](agents/onboarding/developer-setup.md)
- [Agent Guide](agents/onboarding/agent-guide.md)
- [Safety Rules](agents/workflows/agent-safety-rules.md)
- [Agent Checklist](agents/workflows/agent-checklist.md)
- [Approval Flows](agents/workflows/approval-flows.md)
- [Roles](agents/roles/) — Platform, DevOps, Security, Database engineers
- [Governance](agents/governance/) — Editorial independence, conflict of interest

## Assessments

- [Implementation Truth](assessments/implementation-truth.md) — What exists vs. what's missing
- [Remediation Plan](assessments/remediation-plan-10x10.md) — 10-point fix list
- [Ecosystem Integration](assessments/ecosystem-integration.md) — Cross-repo dependencies
- [GTM Q2 Africa](assessments/gtm-q2-africa.md) — Ghana pilot infrastructure needs

## Agile

- [Phased Roadmap](agile/phased-roadmap.md) | [Sprint Roadmap](agile/sprint-roadmap.md)
- [Sprint Planning](agile/sprint-planning.md) | [Definition of Done](agile/definition-of-done.md)
- [Backlog](agile/backlog.md) | [Feature Backlog](agile/feature-backlog.md)
- [QA Test Plan](agile/qa-test-plan.md) | [UAT Test Plan](agile/uat-test-plan.md)

## Release

- [GA Checklist](release/ga-release-checklist.md)
- [Legal Review](release/legal-review.md)
- [License Compliance](release/license-compliance.md)
- [Versioning Policy](release/versioning-policy.md)

## Principles

- [Open Infrastructure](principles/open-infrastructure.md)
- [Regenerative Economics](principles/regenerative-economics.md)
- [Sovereign Accessibility](principles/sovereign-accessibility.md)

## Reference

- [Glossary](reference/glossary.md)
- [Docs Writing Guide](reference/docs-writing-guide.md)
- [Performance SLOs](reference/performance-slos.md)
- [Changelog](reference/changelog.md)
