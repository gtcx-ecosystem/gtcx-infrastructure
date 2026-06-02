---
title: 'GitHub Automation & Workflows'
status: current
date: '2026-06-02'
owner: devops
tags: ['github', 'ci-cd', 'automation', 'actions']
---

# GitHub Automation & Workflows

This directory contains all GitHub-native automation for `gtcx-infrastructure`.

## Structure

| Path                     | Purpose                                                                    |
| ------------------------ | -------------------------------------------------------------------------- |
| `workflows/`             | GitHub Actions workflows: CI, CD, security scanning, evidence collection   |
| `actions/`               | Reusable composite actions for cross-workflow steps                        |
| `CODEOWNERS`             | Required reviewers per path (security-critical paths need `platform-lead`) |
| `dependabot.yml`         | Automated dependency update policy: tier grouping, Q7 pin rules            |
| `PULL_REQUEST_TEMPLATE/` | Standardized PR description templates                                      |
| `workflow-templates/`    | Org-level workflow templates                                               |

## Key Workflows

| Workflow                | Trigger                       | Purpose                                                   |
| ----------------------- | ----------------------------- | --------------------------------------------------------- |
| `ci.yml`                | PR / push to `main`           | Lint, typecheck, test, coverage gates, contract tests     |
| `deploy-staging.yml`    | Push to `infra/kubernetes/**` | Kustomize apply, rollout health, audit API smoke test     |
| `security-evidence.yml` | Schedule / manual             | SLSA provenance, sigstore attestation, vulnerability scan |
| `dr-test.yml`           | Schedule / manual             | Disaster recovery validation against staging RDS          |

## Security

- All Actions are SHA-pinned (no floating tags).
- OIDC authentication to AWS (no long-lived secrets in repo).
- See `docs/security/github-actions-hardening.md` for the full threat model.
