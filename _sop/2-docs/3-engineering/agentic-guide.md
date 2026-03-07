# Architecture Documentation Standard (Agentic Guide)

Purpose: define how architecture documentation is structured, authored, and maintained.

## Scope

Applies to all documentation under `docs/architecture/` in this repository and in downstream repos that adopt this standard.

## Structure

Each subfolder answers a specific architecture question:

- `principles/`: design principles and product tenets
- `technology-stack/`: technology choices and rationale
- `data-models/`: schemas, content models, data dictionaries
- `security/`: security architecture and trust boundaries
- `performance/`: performance budgets and scaling strategy
- `decisions/`: Architecture Decision Records (ADRs)
- `deployment/`: deployment architecture and environment topology
- `monitoring/`: observability, alerting, SLOs
- `global-south/`: offline-first and constrained environment requirements

## README Expectations

- Each subfolder must include a `README.md` that functions as a project-specific index.
- READMEs should list current documents and templates, with short descriptions.
- Standards and authoring rules live in this guide, not in the folder README.

## Templates

- Templates live in `templates/` under each subfolder.
- Use templates as starting points, then publish the finalized spec in the parent folder.
- Template updates require a brief change note in the relevant README.

## Authoring Rules

- Be explicit about scope, assumptions, and dependencies.
- Use stable, relative links within the repo.
- Avoid duplicating content across folders; link instead.
- Date-stamp major documents and note the review cadence.

## Review Cadence

- Principles, security, and monitoring: quarterly
- Technology stack and data models: semiannual
- Performance and deployment: after major releases

## Ownership

Owner: [Platform Lead / Architecture Lead]

---

_Standard version: {version} — {month} {year}_
