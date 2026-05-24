---
title: 'Documentation Governance'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['compliance', 'architecture', 'infrastructure', 'database', 'devops']
review_cycle: 'on-change'
---

# Documentation Governance

This document records how the infrastructure repo treats documentation as an auditable control surface.

## Rules

- `docs/README.md` is the master index and single source of navigation truth.
- Repo-local docs may deviate from the ecosystem taxonomy only when the repo has a stable audience-specific collection that would become less legible if forcibly flattened.
- Cross-repo references are documented as repo-relative code paths when this repo is not the authority.
- Historical evidence remains in place under audit or historical folders; it is not deleted during standards work.

## Current Repo-Specific Deviations

- `docs/agents/` remains a first-class collection because operator, reviewer, and agent workflows are core to how infrastructure changes are executed here.
- `docs/agile/`, `docs/devops/`, and `docs/gtm/` remain explicit top-level collections because they map to distinct operating audiences already used across the repo.
- `docs/architecture/decisions/` is retained as the ADR collection for this repo; a future ecosystem-wide ADR consolidation can move it to `docs/adr/` if desired.
