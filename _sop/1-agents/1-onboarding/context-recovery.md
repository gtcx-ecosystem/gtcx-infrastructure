# Agent Context Recovery — {repo-name}

How to recover agent context across sessions, prevent drift, and maintain continuity in a codebase where incorrect assumptions cause downstream problems.

---

## Why Context Recovery Matters

AI agents have no persistent memory between sessions. Every new conversation starts from zero. Context loss leads to:

- Hallucinated file paths, function signatures, or package names
- Architecture decisions made without reading the relevant ADR
- Patterns that violate established dependency boundaries
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

Created at the end of any session with in-progress work. Stored in `_sop/4-sessions/`.

Each handoff must include:

- Exact files being worked on (with line numbers if relevant)
- Current state: what is done, what is in progress, what is blocked
- Decisions made this session and the reasoning
- Known issues or gotchas discovered
- Numbered next steps, specific and actionable

Naming: `YYYY-MM-DD-handoff.md`

### Layer 4 — Codebase Self-Documentation

The codebase provides context directly:

- Every `_sop/` folder has a README explaining what belongs there
- Every component has a README with its purpose and key API surface
- ADRs in `_sop/2-docs/3-engineering/6-decisions/` capture significant architectural decisions
- Test files serve as living documentation of expected behavior

---

## Recovery Protocol

### Quick Recovery — under 2 minutes

Use when returning to a session with clear prior context:

1. Agent reads `CLAUDE.md` (automatic on session start)
2. Agent reads memory files
3. Agent reads the last session handoff if continuing prior work
4. Agent confirms understanding before proceeding

### Deep Recovery — 5 to 10 minutes

Use when starting work in an unfamiliar area of the codebase:

1. Complete Quick Recovery steps above
2. Read `_sop/1-agents/1-onboarding/orientation.md`
3. Read the relevant architecture section in `_sop/2-docs/3-engineering/2-system-design/`
4. Read the relevant component spec in `_sop/2-docs/5-specs/4-backend/packages/`
5. Read 2–3 test files to understand expected behavior patterns
6. Summarize understanding before proceeding

### Full Recovery — after a long gap or major refactor

1. Complete Deep Recovery steps above
2. Read recent ADRs for architectural decisions
3. Run `git log --oneline -20` to review recent changes
4. Run `{test-command}` to verify current state
5. Update memory files if anything has changed

---

## Maintaining Context During a Session

- When context gets compressed, anchor on `CLAUDE.md` and memory files
- Before major decisions, re-read the relevant ADR or component spec
- If the agent starts hallucinating paths or patterns, stop and re-read the actual file structure
- Commit progress regularly to create concrete checkpoints

---

## Red Flags

Signs that context has been lost and recovery is needed:

- Suggesting file paths or functions that do not exist in this repo
- Using patterns that contradict `_sop/2-docs/3-engineering/` standards or existing components
- Asking questions that were already answered earlier in the session
- Proposing architecture that conflicts with an existing ADR
- Using wrong import paths, package names, or API signatures

When any of these appear: run Quick Recovery before continuing.

---

## File Map

| File                                             | Purpose                     | When to Update                                    |
| ------------------------------------------------ | --------------------------- | ------------------------------------------------- |
| `CLAUDE.md`                                      | Auto-loaded project context | When stack, structure, or conventions change      |
| `.claude/memory/MEMORY.md`                       | Persistent agent memory     | After every significant session                   |
| `.claude/memory/*.md`                            | Topic-specific knowledge    | When patterns are confirmed across sessions       |
| `_sop/4-sessions/YYYY-MM-DD-handoff.md`          | Session handoff             | End of every session with in-progress work        |
| ADRs in `_sop/2-docs/3-engineering/6-decisions/` | Decision record             | When significant architectural decisions are made |

---

## Reference

- [`orientation.md`](./orientation.md) — codebase map and session-start reading order
- [`../4-workflows/safety-rules.md`](../4-workflows/safety-rules.md) — what requires human approval
- [`../../2-docs/3-engineering/6-decisions/`](../../2-docs/3-engineering/6-decisions/) — all ADRs
- [`../../4-sessions/README.md`](../../4-sessions/README.md) — session document structure
