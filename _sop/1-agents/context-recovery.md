# Guide: Agent Context Recovery

## The Problem

AI agents have no persistent memory between sessions. Every new conversation starts from zero. Context window limits mean even within a session, early context gets compressed or lost. This leads to:

- Repeated explanations of architecture and conventions
- AI making decisions that contradict earlier ones
- Hallucinated file paths, function names, or patterns
- Regression to generic patterns instead of project-specific ones
- Wasted time re-establishing what was already known

## The Solution: Context Layers

Build context recovery into the project structure itself. Instead of relying on conversation history, encode knowledge into files the agent can read at session start.

### Layer 1: CLAUDE.md (Automatic — loaded every session)

The most critical file. Lives at repo root. Automatically loaded by Claude Code.

**What to include:**

- Project name and what it does (2–3 sentences)
- Tech stack (exact versions)
- Monorepo structure (which folders are what)
- Key commands: install, build, test, lint
- Architecture summary (3–5 bullet points)
- Current conventions: naming, file structure, testing patterns
- Common pitfalls: things the AI gets wrong repeatedly

**What NOT to include:**

- Full architecture docs (link to them instead)
- Detailed specs (too much noise for every session)
- Historical context that is no longer relevant

Keep it under 200 lines. Update it as the project evolves.

### Layer 2: SOP Orientation

Any agent entering this repo must read, in order:

1. `_sop/1-agents/orientation.md` — codebase map, repo structure, session start protocol
2. `_sop/1-agents/safety-rules.md` — what requires human approval before acting
3. The role file for the work being performed
4. `_sop/2-docs/2-specs/protocol-index.md` — protocol relationships and integration contracts

### Layer 3: Session Handoff Documents

When ending a session mid-task, create a handoff doc in `_sop/4-sessions/`:

- What was being worked on (exact files, line numbers)
- Current state: done, in progress, blocked
- Decisions made during the session and why
- Known issues or gotchas discovered
- Exact next steps (numbered, specific)

### Layer 4: Codebase Self-Documentation

Make the codebase itself provide context:

- Every SOP folder has a README
- ADRs document why decisions were made (`_sop/2-docs/1-architecture/decisions/`)
- Test files document expected behavior
- Protocol specs are canonical (`protocols/<protocol>/SPEC.md`)

## Context Recovery Protocol

### Quick Recovery (< 2 minutes)

For resuming known work after a short break:

1. CLAUDE.md is automatically loaded — no action needed
2. Read `_sop/1-agents/orientation.md`
3. Read the last session handoff doc in `_sop/4-sessions/` (if one exists)
4. Confirm understanding before acting: state what you believe the current task is and what the next step is

### Deep Recovery (5–10 minutes)

When entering a new area of the codebase:

1. Complete Quick Recovery steps above
2. Read the relevant protocol spec: `protocols/<protocol>/SPEC.md`
3. Read the relevant architecture section: `_sop/2-docs/1-architecture/`
4. Explore key files: `package.json`, recent git log, directory structure
5. Read 2–3 test files to understand expected behavior
6. Summarize understanding before proceeding

### Full Recovery (after long gap or major changes)

1. Complete Deep Recovery steps above
2. Read recent ADRs: `_sop/2-docs/1-architecture/decisions/`
3. Review git log for changes since last session
4. Run the test suite to verify current state: `pnpm test`

## Red Flags (Context Has Been Lost)

Stop and run the Quick Recovery protocol if you observe:

- Suggesting files or functions that do not exist in this repo
- Using patterns that contradict the conventions in `code-standards.md` or `testing.md`
- Asking questions that were answered earlier in the session
- Proposing architecture that was already decided against (check ADRs)
- Using wrong package names, import paths, or API signatures from `@gtcx/` packages

## Anti-Patterns

- Relying solely on conversation history — it gets compressed
- Writing everything into CLAUDE.md — it should be scannable, not a textbook
- Skipping session recaps when handing off mid-task
- Dumping entire file contents into the prompt instead of using structured context files

## File Map

| File                                    | Purpose                     | When to Update                                    |
| --------------------------------------- | --------------------------- | ------------------------------------------------- |
| `CLAUDE.md`                             | Auto-loaded project context | When stack, structure, or conventions change      |
| `_sop/1-agents/orientation.md`          | Session start protocol      | When repo structure changes                       |
| `_sop/4-sessions/*.md`                  | Session handoff docs        | End of every session with incomplete work         |
| `_sop/2-docs/1-architecture/decisions/` | Decision record             | When significant architectural decisions are made |

## Reference

- [orientation.md](orientation.md)
- [safety-rules.md](safety-rules.md)
- [\_sop/4-sessions/README.md](../4-sessions/README.md)
- [\_sop/2-docs/1-architecture/decisions/](../2-docs/1-architecture/decisions/)
