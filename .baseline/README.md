---
title: 'BaselineOS Institutional Memory'
status: current
date: '2026-06-02'
owner: platform-lead
tags: ['baseline', 'institutional-memory', 'agent-protocol']
---

# BaselineOS Institutional Memory

This directory contains the **institutional baseline** for `gtcx-infrastructure` per the BaselineOS agent protocol.

## Structure

| Path | Purpose |
|------|---------|
| `definition.json` | Canonical repo configuration: terminology, authority model, scoring rubric |
| `checkpoints/` | Audit checkpoint artifacts and signed state snapshots |
| `govern/` | Governance rules: CODEOWNERS, branch protection, merge policy |
| `index/` | Machine-readable registry of docs, APIs, and compliance artifacts |
| `memory/` | Cross-session persistence: patterns, pitfalls, dependencies, session state |

## Usage

Agents should read `definition.json` and `memory/session.md` at the start of every session to establish context. Humans should treat this directory as read-only — changes flow through the agent-sync pipeline (`pnpm agent:sync`).

## Related

- [`docs/governance/institutional/`](../docs/governance/institutional/) — ecosystem-wide baseline
- [`AGENTS.md`](../AGENTS.md) — repo-specific agent protocol
