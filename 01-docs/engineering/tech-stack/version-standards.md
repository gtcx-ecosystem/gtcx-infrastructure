---
title: 'Version Standards'
status: 'current'
date: '2026-05-28'
owner: 'gtcx-infrastructure'
role: 'platform-engineer'
tier: 'standard'
tags: ['documentation', 'engineering']
review_cycle: 'on-change'
---

# Version Standards

This doc defines minimum version standards for `gtcx-infrastructure` tooling to keep CI, IaC validation, and operator workflows deterministic.

## Baseline versions (minimum)

- Node.js: **>= 20.18.0**
- pnpm: **>= 9.15**
- Terraform: **>= 1.7**
- kubectl: **compatible with EKS** (pin per environment runbook)
- Docker: **current stable** (required for local compose)

## Pinning principles

- Prefer **lockfiles** and **pinned GitHub Actions** over floating tags.
- Treat changes to build tooling versions as **release-impacting** and require green `pnpm test:full`.
- For security scanners (Trivy, Semgrep, OSV), pin major/minor where possible and schedule periodic upgrades.

## Evidence

- CI must show the actual versions used in logs (Node/pnpm/Terraform/kubectl).
- `pnpm test` and `pnpm test:full` are the canonical local reproducibility gates.
