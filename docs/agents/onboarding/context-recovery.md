---
title: 'Agent Context Recovery — gtcx-infrastructure'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'architecture', 'infrastructure', 'frontend', 'database']
review_cycle: 'on-change'
---

# Agent Context Recovery — gtcx-infrastructure

How to recover agent context across sessions, prevent drift, and maintain continuity in a codebase where incorrect assumptions cause downstream problems.

---

## Why Context Recovery Matters

AI agents have no persistent memory between sessions. Every new conversation starts from zero. Context loss leads to:

- Hallucinated file paths, Terraform module names, or K8s resource names
- Infrastructure changes applied without reading the relevant ADR
- Patterns that violate established environment boundaries
- Regression to generic conventions instead of repo-specific ones

---

## Context Layers

### Layer 1 — CLAUDE.md (Automatic)

Loaded automatically at every session start. Contains: repo purpose, tech stack, workspace structure, key commands, critical patterns, and common gotchas.

Keep under 200 lines. Update it when stack, structure, or conventions change.

### Layer 2 — Memory Files (Persistent)

Located at `.claude/projects/…/memory/`. Updated by the agent as patterns are confirmed across sessions.

| File                             | Contents                                       |
| -------------------------------- | ---------------------------------------------- |
| `MEMORY.md`                      | Confirmed patterns, pitfalls, user preferences |
| Topic files (e.g. `patterns.md`) | Detailed knowledge on specific subsystems      |

Rules: only write confirmed patterns, remove entries that turn out to be wrong, organize by topic not chronologically.

### Layer 3 — Session Handoff Documents

Created at the end of any session with in-progress work. Stored in `docs/sessions/`.

Each handoff must include:

- Exact files being worked on (with line numbers if relevant)
- Current state: what is done, what is in progress, what is blocked
- Decisions made this session and the reasoning
- Known issues or gotchas discovered
- Numbered next steps, specific and actionable

Naming: `YYYY-MM-DD-handoff.md`

### Layer 4 — Codebase Self-Documentation

The codebase provides context directly:

- Every `docs/` folder has a README explaining what belongs there
- ADRs in `docs/architecture/decisions/` capture significant infrastructure decisions
- Terraform modules have README files documenting inputs, outputs, and intended use
- K8s manifests are organized by service and environment

---

## Recovery Protocol

### Quick Recovery — under 2 minutes

Use when returning to a session with clear prior context:

1. Agent reads `CLAUDE.md` (automatic on session start)
2. Agent reads memory files
3. Agent reads the last session handoff if continuing prior work
4. Agent confirms understanding before proceeding

### Deep Recovery — 5 to 10 minutes

Use when starting work in an unfamiliar area of the infrastructure:

1. Complete Quick Recovery steps above
2. Read `docs/agents/onboarding/orientation.md`
3. Read the relevant architecture section in `docs/architecture/`
4. Review the Terraform module README or K8s manifest structure for the area of work
5. Summarize understanding before proceeding

### Full Recovery — after a long gap or major change

1. Complete Deep Recovery steps above
2. Read recent ADRs for infrastructure decisions
3. Run `git log --oneline -20` to review recent changes
4. Confirm environment state before any destructive action
5. Update memory files if anything has changed

---

## Maintaining Context During a Session

- When context gets compressed, anchor on `CLAUDE.md` and memory files
- Before any `terraform apply` or `kubectl apply`, re-read the relevant plan or manifest
- If the agent starts hallucinating resource names or module paths, stop and re-read the actual structure
- Commit progress regularly to create concrete checkpoints
- Never apply infra changes without human review of the plan output

---

## Red Flags

Signs that context has been lost and recovery is needed:

- Suggesting Terraform modules, K8s resources, or service names that do not exist in this repo
- Using patterns that contradict `docs/engineering/` standards
- Proposing architecture that conflicts with an existing ADR
- Attempting to commit secrets, credentials, or `.env` files
- Proposing destructive changes without stating the recovery plan

When any of these appear: run Quick Recovery before continuing.

---

## File Map

| File                                   | Purpose                     | When to Update                                     |
| -------------------------------------- | --------------------------- | -------------------------------------------------- |
| `CLAUDE.md`                            | Auto-loaded project context | When stack, structure, or conventions change       |
| `.claude/memory/MEMORY.md`             | Persistent agent memory     | After every significant session                    |
| `.claude/memory/*.md`                  | Topic-specific knowledge    | When patterns are confirmed across sessions        |
| `docs/sessions/YYYY-MM-DD-handoff.md`  | Session handoff             | End of every session with in-progress work         |
| ADRs in `docs/architecture/decisions/` | Decision record             | When significant infrastructure decisions are made |

---

## Reference

- [`orientation.md`](./orientation.md) — codebase map and session-start reading order
- [`../4-workflows/safety-rules.md`](../workflows/agent-safety-rules.md) — what requires human approval
- [`../../architecture/decisions/`](../../architecture/decisions/) — all ADRs
- Session transcripts are not canonical repo documentation; recover context from `docs/README.md`, `CLAUDE.md`, and recent git history instead.
