---
title: 'GTCX Infrastructure — Documentation Index'
status: 'draft'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — Documentation Index

Single source of truth for all infrastructure documentation.

> **Doc-site architecture.** This repo has ONE public doc-site, not three.
>
> - **Source of truth** (markdown): [`docs/gitbook/docs-site/`](gitbook/docs-site/README.md) — what gets published at `gtcx.io/compliance`.
> - **Build pipeline**: [`tools/docs-site/`](../tools/docs-site/README.md) — Astro Starlight static site generator. Its `scripts/sync-content.mjs` mirrors the source above into `src/content/docs/` (gitignored) before each build.
> - **Internal docs** (this tree, `docs/`): for the engineering team, agents, and operators — not published to gtcx.io.
>
> The "three doc-site implementations" finding in the 2026-05-30 audit was a misreading of the directory layout. The build pipeline and the source are intentionally separated; the internal docs are a different surface entirely.

---

## 0. Start Here

- [Documentation Governance](governance/documentation-deviations.md) — Repo-local documentation rules and approved taxonomy deviations
- [Orientation](agents/onboarding/orientation.md) — **canonical onboarding entry point** (other onboarding files are deprecated; see [agents/onboarding/README.md](agents/onboarding/README.md))
- [Agent Safety Rules](agents/workflows/agent-safety-rules.md) — Three-tier authority structure

---

## 1. GTM / Sandbox Application

### Plans

- [Bank-Grade 10x Remediation Plan](gtm/plans/bank-grade-10x-remediation-plan.md) — Institutional-grade hardening roadmap
- [Global South 10x Plan](gtm/plans/global-south-10x-plan.md) — Africa-first market entry strategy
- [Moat Execution Plan](gtm/plans/moat-execution-plan.md) — Competitive differentiation execution

### Regulatory

- [Incident Response Plan v1](gtm/regulatory/incident-response-plan-v1.md) — Regulatory incident handling
- [ISO 27001 ISMS Scope](gtm/regulatory/iso27001-isms-scope.md) — ISMS boundary definition
- [PCI DSS Scoping](gtm/regulatory/pci-dss-scoping.md) — Cardholder data environment scope
- [Pentest Scope RFP](gtm/regulatory/pentest-scope-rfp.md) — Penetration testing request for proposal
- [Regulatory Notification Templates](gtm/regulatory/regulatory-notification-templates.md) — Breach and incident notification templates
- [RTO/RPO Resolution](gtm/regulatory/rto-rpo-resolution.md) — Recovery time and point objectives
- [SOC2 Readiness Checklist](gtm/regulatory/soc2-readiness-checklist.md) — SOC2 Type II readiness tracker

### Sandbox Application

- [Architecture Overview](gtm/sandbox-application/architecture-overview.md) — Sandbox deployment architecture
- [Data Residency Proof](gtm/sandbox-application/data-residency-proof.md) — Jurisdictional data sovereignty evidence
- [Encryption Statement](gtm/sandbox-application/encryption-statement.md) — Cryptographic controls statement
- [Internal Security Assessment](gtm/sandbox-application/internal-security-assessment.md) — Pre-submission security review
- [KYC Retention Schedule](gtm/sandbox-application/kyc-retention-schedule.md) — Identity data lifecycle policy
- [Pre-Submission Agenda](gtm/sandbox-application/pre-submission-agenda.md) — Regulatory meeting preparation

---

## 2. Plans & Roadmaps

**Canonical execution plan:** [`audit/execution-roadmap.md`](audit/execution-roadmap.md) — reconciled 3-sprint plan with every open audit finding as a story.
**Machine-readable status:** [`audit/latest.json`](audit/latest.json).
**Strategic milestones:** [`roadmap/roadmap-2026-07-13.md`](roadmap/roadmap-2026-07-13.md).

Other:

- [Sprint: Production Readiness](agile/sprints/sprint-2026-05-production-readiness.md) — May 2026 production readiness sprint
- [Executive Summary](agile/executive-summary.md) — High-level project status
- [Priority Framework](agile/priority-framework.md) — Task prioritization methodology

> Files under `agile/` named `phased-roadmap.md`, `sprint-roadmap.md`,
> `execution-roadmap-2026-05-22.md`, `roadmap-2026-05-25.md`,
> `internal-completion-roadmap-2026-05-22.md`, and
> `sprints/sprint-2026-05-phase2-9plus-roadmap.md` are superseded
> or are templates. Do not consult them for current planning.

---

## 3. Architecture

- [System Overview](architecture/system-overview.md) — Three-layer stack, deployment model, trust zones
- [Infrastructure Architecture](architecture/infrastructure-architecture-overview.md) — 4-tier deployment, K8s topology, edge mesh
- [Infrastructure Overview](architecture/infrastructure-overview.md) — Same code everywhere, config differs
- [Trust Model](architecture/trust-model.md) — Zero-trust boundaries, Byzantine fault tolerance
- [Network Architecture](architecture/network-architecture.md) — Topology, mesh resilience, peer discovery
- [Offline Architecture](architecture/offline-architecture.md) — Offline-first design, CRDT sync
- [Migrations Overview](architecture/migrations-overview.md) — MABA/KORA/AMANI data transformation stack
- [K8s Probes Rationale](architecture/k8s-probes-rationale.md) — Liveness, readiness, and startup probe design

---

## 4. Decisions (ADRs)

- [ADR-001](architecture/decisions/ADR-001-monorepo-structure.md) — Monorepo structure
- [ADR-002](architecture/decisions/ADR-002-commodity-agnostic-design.md) — Commodity-agnostic design
- [ADR-003](architecture/decisions/ADR-003-ai-native-architecture.md) — AI-native architecture
- [ADR-004](architecture/decisions/ADR-004-offline-first-mobile.md) — Offline-first mobile
- [ADR-005](architecture/decisions/ADR-005-jurisdiction-plugins.md) — Jurisdiction plugins
- [ADR-006](architecture/decisions/ADR-006-package-boundaries.md) — Package boundaries
- [ADR-007](architecture/decisions/ADR-007-kustomize-over-helm.md) — Kustomize over Helm
- [ADR-008](architecture/decisions/ADR-008-dual-database-architecture.md) — Dual database architecture
- [ADR-011](architecture/decisions/ADR-011-connectivity-profiles.md) — Connectivity profiles
- [ADR-013 mTLS Service Mesh](architecture/decisions/ADR-013-mtls-service-mesh.md) — mTLS service mesh decision
- [ADR-009 Error Taxonomy](architecture/decisions/ADR-009-error-taxonomy.md) — Standardized error classification
- [ADR-010 In-Memory Stub Guards](architecture/decisions/ADR-010-in-memory-stub-guards.md) — Test double safety boundaries
- [ADR Guide](architecture/decisions/adr-guide.md) — How to write an ADR
- [ADR Template](architecture/decisions/adr-template.md) — Blank ADR scaffold

---

## 5. Engineering

- [Backend Architecture](engineering/backend-architecture.md) — Service topology, build targets
- [API Patterns](engineering/api-patterns.md) — Design standards and conventions
- [API Specification (OpenAPI)](api/openapi.yaml) — Canonical machine-readable spec
- [Connection Pooling](engineering/connection-pooling.md) — Database connection management
- [K8s Manifest Ownership](engineering/k8s-manifest-ownership.md) — Manifest ownership and review policy
- [LLM Routing Strategy](engineering/llm-routing-strategy.md) — Model selection and routing logic
- [Low-Bandwidth Mode](engineering/low-bandwidth-mode.md) — Adaptive degradation for frontier regions
- [Package Adoption Guide](engineering/package-adoption-guide.md) — Cross-repo `@gtcx/*` package adoption
- [GTCX Platforms M3 Contract](engineering/gtcx-platforms-m3-contract.md) — Cross-repo M3 deliverables
- [Deployment](engineering/deployment/deployment.md) — Deployment procedures and gates

### Tech Stack

- [Tech Stack](engineering/tech-stack/tech-stack.md) — Technology choices and rationale
- [Version Standards](engineering/tech-stack/version-standards.md) — Pinned dependency versions
- [Dependency Boundaries](engineering/tech-stack/dependency-boundaries.md) — Package boundary rules

---

## 6. Operations (Runbooks)

- [Deploy](operations/runbooks/deploy.md) — Canary deployment, approval gates, rollback
- [Deployment Runbook](operations/runbooks/deployment-runbook.md) — Step-by-step deployment procedure
- [Migrate](operations/runbooks/migrate.md) — Database migration procedures
- [Release](operations/runbooks/release.md) — Release gate and evidence
- [Release Evidence](operations/runbooks/release-evidence.md) — Release evidence collection
- [Rollback Evidence](operations/runbooks/rollback-evidence.md) — Rollback evidence collection
- [Disaster Recovery](operations/runbooks/disaster-recovery.md) — DR failover and restore
- [Incident Response](operations/runbooks/incident-response.md) — Incident handling procedure
- [Monitoring](operations/runbooks/monitoring.md) — Observability and alerting
- [Database Failover](operations/runbooks/database-failover.md) — Database failover procedure
- [Automated Rollback](operations/runbooks/automated-rollback.md) — Automatic rollback triggers and flow
- [Terraform State Migration](operations/runbooks/terraform-state-migration.md) — Terraform state move procedure
- [Quality Runbook](operations/runbooks/quality-runbook.md) — CI triage order
- [Production Store Integration](operations/runbooks/production-store-integration.md) — Store integration procedure
- [Replay Guard Failure](operations/runbooks/replay-guard-failure.md) — Replay protection failure response
- [Fine-Tune Workflow Enablement](operations/runbooks/fine-tune-workflow-enablement.md) — ML fine-tune workflow setup
- [Fine-Tune Workflow Operations](operations/runbooks/fine-tune-workflow-operations.md) — ML fine-tune workflow day-2 ops
- [Intelligence Evidence](operations/runbooks/intelligence-evidence.md) — AI/ML evidence collection
- [Intelligence Error Rate](operations/runbooks/intelligence-error-rate.md) — AI/ML error rate monitoring
- [Latency SLO Breach](operations/runbooks/latency-slo-breach.md) — Latency SLO violation response
- [AGX Error Budget](operations/runbooks/agx-error-budget.md) — AGX error budget tracking
- [ANISA Error Budget](operations/runbooks/anisa-error-budget.md) — ANISA error budget tracking
- [Protocols Error Budget](operations/runbooks/protocols-error-budget.md) — Protocols error budget tracking
- [Runbook Template](operations/runbooks/runbook-template.md) — Blank runbook scaffold

---

## 7. Security

- [Security Framework](security/security-framework.md) — Zero-trust, crypto standards
- [Security Architecture](security/security-architecture.md) — Defense-in-depth architecture
- [Security Policy](security/security-policy.md) — Organizational security policy
- [Threat Model](security/threat-model.md) — System-wide threat analysis
- [Threat Model Template](security/threat-model-template.md) — Blank threat model scaffold
- [Secrets Management](security/secrets-management.md) — Secret storage and rotation
- [Defense Readiness](security/defense-readiness.md) — CMMC L2 readiness
- [NIST 800-53 Mapping](security/nist-800-53-mapping.md) — NIST control mapping
- [FIPS Assessment](security/fips-assessment.md) — FIPS 140-2/3 compliance assessment
- [STIG Compliance](security/stig-compliance.md) — DISA STIG compliance status
- [Zero Trust Assessment](security/zero-trust-assessment.md) — Zero-trust maturity evaluation
- [Data Flow](security/data-flow.md) — Data flow diagrams and classification
- [Tokenization Architecture](security/tokenization-architecture.md) — Token vault and PCI tokenization
- [Key Ceremony Runbook](security/key-ceremony-runbook.md) — HSM key generation ceremony
- [Signed Commits Policy](security/signed-commits-policy.md) — Git commit signing enforcement
- [Cosign CI Integration](security/cosign-ci-integration.md) — Container image signing in CI
- [Audit Integrity Verification](security/audit-integrity-verification.md) — Audit log tamper detection
- [Break Glass Procedure](security/break-glass-procedure.md) — Emergency access escalation
- [Bug Bounty Policy](security/bug-bounty-policy.md) — Vulnerability disclosure program
- [Forensic Readiness](security/forensic-readiness.md) — Digital forensics preparation
- [Red Team Playbook](security/red-team-playbook.md) — Adversary simulation scenarios
- [RASP Integration Guide](security/rasp-integration-guide.md) — Runtime application self-protection
- [Security Training Program](security/security-training-program.md) — Security awareness and training
- [SOC Requirements](security/soc-requirements.md) — Security operations center requirements

---

## 8. Compliance

- [Compliance Requirements](compliance/compliance-requirements.md) — Regulatory requirements matrix
- [Controls Matrix](compliance/controls-matrix.md) — Security controls mapping
- [Regulatory Framework](compliance/regulatory-framework.md) — Multi-jurisdiction regulatory map
- [SOC2 Evidence Pipeline](compliance/soc2-evidence-pipeline.md) — Automated SOC2 evidence collection
- [Compliance Templates Overview](compliance/compliance-templates-overview.md) — Per-jurisdiction config templates
- [Accessibility Checklist](compliance/accessibility-checklist.md) — WCAG compliance checklist
- [Board Security Committee Charter](compliance/board-security-committee-charter.md) — Board oversight charter
- [Data Classification Policy](compliance/data-classification-policy.md) — Data sensitivity classification
- [Data Retention Policy](compliance/data-retention-policy.md) — Data lifecycle and retention rules
- [Risk Register](compliance/risk-register.md) — Enterprise risk register
- [Separation of Duties Matrix](compliance/separation-of-duties-matrix.md) — SoD control matrix
- [Vendor Risk Program](compliance/vendor-risk-program.md) — Third-party risk management

### ISO 27001 Annex A Policies

- [A05 Information Security Policy](compliance/policies/A05-information-security-policy.md) — Top-level security policy
- [A06 Organization of Information Security](compliance/policies/A06-organization-of-information-security.md) — Security roles and responsibilities
- [A07 Human Resource Security](compliance/policies/A07-human-resource-security.md) — Personnel security controls
- [A08 Asset Management](compliance/policies/A08-asset-management.md) — Asset inventory and handling
- [A09 Access Control](compliance/policies/A09-access-control.md) — Access management policy
- [A10 Cryptography](compliance/policies/A10-cryptography.md) — Cryptographic controls policy
- [A11 Physical Security](compliance/policies/A11-physical-security.md) — Physical and environmental security
- [A12 Operations Security](compliance/policies/A12-operations-security.md) — Operational security procedures
- [A13 Communications Security](compliance/policies/A13-communications-security.md) — Network and transfer security
- [A14 System Acquisition](compliance/policies/A14-system-acquisition.md) — Secure development and procurement
- [A15 Supplier Relationships](compliance/policies/A15-supplier-relationships.md) — Supply chain security
- [A16 Incident Management](compliance/policies/A16-incident-management.md) — Security incident procedures
- [A17 Business Continuity](compliance/policies/A17-business-continuity.md) — BCM and disaster recovery
- [A18 Compliance](compliance/policies/A18-compliance.md) — Legal and regulatory compliance

---

## 9. Specs

### Substrate specifications

- [CI/CD Pipeline](specs/cicd-pipeline.md) — Stages, quality gates, security scanning
- [Data Governance](specs/data-governance.md) — Classification, PII, sovereignty
- [Observability Framework](specs/observability-framework.md) — Metrics, logging, tracing, SLOs
- [Resilience Framework](specs/resilience-framework.md) — RTO/RPO, SPOF, degradation tiers
- [Scalability Framework](specs/scalability-framework.md) — HPA, caching, load testing
- [Testing Framework](specs/testing-framework.md) — Taxonomy, coverage targets, CI gates
- [USSD Protocol](specs/ussd-protocol.md) — USSD-mode interaction specification
- [Vault Dynamic Credentials](specs/vault-dynamic-credentials.md) — HashiCorp Vault credential rotation

---

## 10. DevOps

- [CI/CD](operations/ci-cd/ci-cd.md) — Pipeline configuration and stages
- [Environment Config](operations/environments/environment-config.md) — Environment topology and variables
- [Monitoring Setup](operations/monitoring/monitoring-setup.md) — Monitoring stack configuration
- [QA Process](operations/qa/qa-process.md) — Quality assurance workflow
- [Release Checklist](operations/release/release-checklist.md) — Pre-release verification steps
- [Legal Sign-off](operations/release/legal-sign-off.md) — Legal review gate
- [Analytics Setup](operations/analytics-setup.md) — Analytics instrumentation
- [Terraform History Purge Runbook](operations/runbooks/terraform-history-purge.md) — Terraform state history cleanup

---

## 11. Assessments & Audit

### Assessments

- [Implementation Truth](audit/implementation-truth.md) — What exists vs. what is missing
- [Remediation Plan 10x10](audit/remediation/remediation-plan-10x10.md) — 10-point fix list
- [Ecosystem Integration](audit/ecosystem-integration-assessment.md) — Cross-repo dependencies
- [GTM Q2 Africa](audit/gtm-q2-africa-assessment.md) — Ghana pilot infrastructure needs
- [Pilot Agreement Template](audit/pilot-agreement-template.md) — Partner pilot agreement scaffold
- [Pilot Success Criteria](audit/pilot-success-criteria.md) — Pilot evaluation metrics

### Audit Cycles

- [Auto Dev State](audit/historical-cycles/auto-dev-state.md) — Autonomous development state tracker
- [2026-05-04 Cycle 2](audit/historical-cycles/2026-05-04-cycle-2.md) — Audit cycle 2 results
- [2026-05-04 Cycle 3](audit/historical-cycles/2026-05-04-cycle-3.md) — Audit cycle 3 results
- [2026-05-04 Cycle 4](audit/historical-cycles/2026-05-04-cycle-4.md) — Audit cycle 4 results
- [2026-05-04 Full Audit](audit/historical-cycles/2026-05-04-full-audit.md) — Complete audit report
- [2026-05-05 Cycle 5](audit/historical-cycles/2026-05-05-cycle-5.md) — Audit cycle 5 results
- [2026-05-05 Cycle 6](audit/historical-cycles/2026-05-05-cycle-6.md) — Audit cycle 6 results
- [2026-05-05 Cycle 7 Final](audit/historical-cycles/2026-05-05-cycle-7-final.md) — Final audit cycle results

### QA Reviews

- [Production Readiness Evidence](audit/production-readiness-evidence-2026-05-08.md) — Production readiness evidence package
- [Documentation Coverage Proposal](audit/qa-reviews/2026-05-05-documentation-coverage-proposal.md) — Documentation-as-Code CI enforcement
- [Hardening Strategy](audit/qa-reviews/2026-05-05-gtcx-hardening-strategy.md) — Institutional hardening (Bash-to-Go, Merkle Anchoring)
- [Sovereign Stack Whitepaper](audit/qa-reviews/2026-05-05-gtcx-sovereign-stack-whitepaper.md) — Technical guide for government deployment
- [Infrastructure Improvement Roadmap](audit/qa-reviews/2026-05-05-infrastructure-improvement-roadmap.md) — Findings and remediation roadmap
- [Innovation Roadmap](audit/qa-reviews/2026-05-05-innovation-roadmap.md) — Long-term vision (PQC, Agentic Compliance)
- [Innovation Spec Suite](audit/qa-reviews/2026-05-05-innovation-spec-suite.md) — Specs for future core features

---

## 12. Agents

### Onboarding

- [Orientation](agents/onboarding/orientation.md) — Repo map, environment topology, key commands
- [Developer Quickstart](agents/onboarding/developer-quickstart.md) — Fast-track setup guide
- [Developer Setup](agents/onboarding/developer-setup.md) — Full development environment setup
- [Agent Guide](agents/onboarding/agent-guide.md) — Agent behavior and conventions
- [Agentic Integration](agents/onboarding/agentic-integration.md) — Agentic system integration patterns
- [Context Recovery](agents/onboarding/context-recovery.md) — Session context restoration
- [Contributor Guide](agents/onboarding/contributor-guide.md) — Contribution workflow
- [Project Adaptation Guide](agents/onboarding/project-adaptation-guide.md) — Adapting to project conventions
- [Quick Reference](agents/onboarding/quick-reference.md) — Command and path cheat sheet
- [Service Overview](agents/onboarding/service-overview.md) — Service catalog and ownership

### Roles

- [Bureau Chiefs](agents/roles/bureau-chiefs.md) — Bureau chief responsibilities
- [Contributors](agents/roles/contributors.md) — Contributor role definition
- [Database Platform Engineer](agents/roles/database-platform-engineer.md) — Database engineering role
- [DevOps SRE Engineer](agents/roles/devops-sre-engineer.md) — DevOps/SRE role
- [Editor in Chief](agents/roles/editor-in-chief.md) — Editorial oversight role
- [Infrastructure Security Engineer](agents/roles/infrastructure-security-engineer.md) — Security engineering role
- [Platform Engineer](agents/roles/platform-engineer.md) — Platform engineering role
- [Role Identification Guide](agents/roles/role-identification-guide.md) — How to identify your role
- [Role Template](agents/roles/role-template.md) — Blank role definition scaffold

### Workflows

- [Agent Safety Rules](agents/workflows/agent-safety-rules.md) — Three-tier authority structure
- [Agent Checklist](agents/workflows/agent-checklist.md) — Pre-flight checklist
- [Approval Flows](agents/workflows/approval-flows.md) — Change approval routing
- [Add Package](agents/workflows/add-package.md) — New package addition workflow
- [Add Secondary Component](agents/workflows/add-secondary-component.md) — Secondary component workflow
- [Cut Release](agents/workflows/cut-release.md) — Release cut procedure
- [Investigate CI Failure](agents/workflows/investigate-ci-failure.md) — CI failure triage
- [Story Lifecycle](agents/workflows/story-lifecycle.md) — Story from creation to done
- [Write ADR](agents/workflows/write-adr.md) — ADR authoring workflow

### Governance

- [Conflict of Interest](agents/governance/conflict-of-interest.md) — COI disclosure policy
- [Editorial Independence](agents/governance/editorial-independence.md) — Editorial autonomy policy

### Structure

- [Tech Team](agents/structure/tech-team.md) — Team structure and ownership

---

## 13. Agile

- [Backlog](agile/backlog.md) — Product backlog
- [Feature Backlog](agile/feature-backlog.md) — Feature-level backlog
- [Epic](agile/epic.md) — Epic definitions
- [Sprint Planning](agile/sprint-planning.md) — Sprint planning process
- [Definition of Done](agile/definition-of-done.md) — Done criteria
- [Definition of Ready](agile/definition-of-ready.md) — Ready criteria
- [QA Test Plan](agile/qa-test-plan.md) — QA testing strategy
- [UAT Test Plan](agile/uat-test-plan.md) — User acceptance testing
- [Retrospective](agile/retrospective.md) — Sprint retrospective template
- [Doc Hygiene Runbook](agile/doc-hygiene-runbook.md) — Documentation maintenance procedure

---

## 14. Release

- [GA Release Checklist](operations/release/ga-release-checklist.md) — General availability release gate
- [Legal Review](operations/release/legal-review.md) — Legal sign-off requirements
- [License Compliance](operations/release/license-compliance.md) — OSS license audit
- [Versioning Policy](operations/release/versioning-policy.md) — SemVer and release tagging

---

## 15. External

- [Governance](gitbook/governance.md) — Public governance model
- [Integration Guide](gitbook/integration-guide.md) — Third-party integration guide
- [Quickstart](gitbook/quickstart.md) — External developer quickstart

---

## 16. Principles

- [Open Infrastructure](architecture/principles/open-infrastructure.md) — Open-source infrastructure philosophy
- [Regenerative Economics](architecture/principles/regenerative-economics.md) — Regenerative economic model
- [Sovereign Accessibility](architecture/principles/sovereign-accessibility.md) — Sovereignty and accessibility principles

---

## 17. Reference & Research

### Reference

- [Glossary](reference/glossary.md) — Term definitions
- [Cannon Glossary](reference/cannon-glossary.md) — Canonical term registry
- [Docs Writing Guide](reference/docs-writing-guide.md) — Documentation style guide
- [Changelog](reference/changelog.md) — Infrastructure changelog
- [Performance Metrics](reference/performance-metrics.md) — Performance measurement definitions
- [Performance SLOs](reference/performance-slos.md) — Service level objectives

### Research

- [Alternative Network Concepts](reference/alternative-network-concepts.md) — Alternative networking approaches
- [Competitors](reference/competitors.md) — Competitive landscape analysis
- [Industry Landscape](reference/industry-landscape.md) — Market and industry overview

---

## Document Lifecycle Conventions

| Stage        | Meaning                            |
| ------------ | ---------------------------------- |
| `DRAFT`      | Work in progress, not yet reviewed |
| `REVIEW`     | Ready for peer review              |
| `APPROVED`   | Reviewed and accepted              |
| `SUPERSEDED` | Replaced by a newer document       |
| `DEPRECATED` | Scheduled for removal              |

- ADRs are immutable once `APPROVED`. To change a decision, write a new ADR that supersedes it.
- Runbooks must be tested against staging before promotion to `APPROVED`.
- Policies in `compliance/policies/` follow ISO 27001 Annex A numbering (A05-A18).

---

## How to Find Something

| I need to...                   | Go to                                                                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Set up my dev environment      | [Developer Quickstart](agents/onboarding/developer-quickstart.md)                                                                                                |
| Understand the system          | [System Overview](architecture/system-overview.md)                                                                                                               |
| Deploy to production           | [Deploy Runbook](operations/runbooks/deploy.md)                                                                                                                  |
| Handle an incident             | [Incident Response](operations/runbooks/incident-response.md)                                                                                                    |
| Understand a past decision     | [Decisions (ADRs)](#4-decisions-adrs)                                                                                                                            |
| Review security posture        | [Security Framework](security/security-framework.md)                                                                                                             |
| Check compliance status        | [Controls Matrix](compliance/controls-matrix.md)                                                                                                                 |
| Write documentation            | [Docs Writing Guide](reference/docs-writing-guide.md)                                                                                                            |
| Add a new package              | [Add Package Workflow](agents/workflows/add-package.md)                                                                                                          |
| Cut a release                  | [Cut Release Workflow](agents/workflows/cut-release.md)                                                                                                          |
| Understand the tech stack      | [Tech Stack](engineering/tech-stack/tech-stack.md)                                                                                                               |
| Review threat model            | [Threat Model](security/threat-model.md)                                                                                                                         |
| Check audit history            | [Assessments & Audit](#11-assessments--audit)                                                                                                                    |
| Understand agent roles         | [Role Identification Guide](agents/roles/role-identification-guide.md)                                                                                           |
| Check SLOs                     | [Performance SLOs](reference/performance-slos.md)                                                                                                                |
| Prepare for sandbox submission | [Sandbox Application](#sandbox-application)                                                                                                                      |
| Review CI/CD pipeline          | [CI/CD](operations/ci-cd/ci-cd.md)                                                                                                                               |
| Understand data governance     | [Data Governance](specs/data-governance.md)                                                                                                                      |
| Review error budgets           | [AGX](operations/runbooks/agx-error-budget.md) / [ANISA](operations/runbooks/anisa-error-budget.md) / [Protocols](operations/runbooks/protocols-error-budget.md) |
