---
title: SOC 2 Readiness Checklist
status: current
date: 2026-06-07
owner: crypto-security-engineer
---

# SOC 2 Readiness Checklist

## Agent ownership model

Control owners use `agent:<role>` unless escalated to CISO, Legal, or Board.

| CC ID | Control             | Evidence                                  | Status      | Owner                    | Notes |
| ----- | ------------------- | ----------------------------------------- | ----------- | ------------------------ | ----- |
| CC1.1 | Control environment | `docs/operations/repo/SECURITY.md`        | in_progress | agent:security-engineer  |       |
| CC2.1 | Communication       | `audit/latest.json`                       | in_progress | agent:platform-architect |       |
| CC3.1 | Risk assessment     | `audit/pen-test-scope-2026.md`            | in_progress | agent:security-engineer  |       |
| CC6.1 | Logical access      | `deploy/kubernetes/base/rbac/`            | in_progress | agent:security-engineer  |       |
| CC7.1 | System operations   | `platform/tools/scripts/validate-all.mjs` | in_progress | agent:builder            |       |
| CC8.1 | Change management   | `.github/workflows/ci.yml`                | in_progress | agent:builder            |       |
