## Universal agent behavior (ANY LLM — terminal, IDE, CLI)

**Applies to:** Claude, Kimi, Gemini, Codex, Cursor (IDE + `agent` CLI), Copilot, and any future agent with shell access.

**Canonical doc (read every session):** `docs/operations/agent-universal-instructions.md`

### Session start (provider-agnostic)

```bash
pnpm agent:session-start          # preferred when wired
pnpm agent:next-work              # P22 selection only
pnpm agent:next-work --json       # automation / scripts
```

If `agent:session-start` is missing: `node scripts/agent-session-start.mjs` or `node scripts/agent-next-work.mjs`.

### P22 — Work selection

- Run next-work; **never** ask "which story?" or present numbered menus.
- Execute the returned story in **this repo** unless P24 handoff says switch owner repo.

### P26 — Proceed Brief (then implement)

Emit **one** brief, then work. Human may **stop**, **correct:**, or story ID — not pick options.

**Forbidden replies:** Your call · Two options · 1./2. menus · Say push if you want · Which do you prefer? · approval of path already selected (Class R).

### P27 — You run commands

- Gates, dev servers (Metro/Expo background), `adb`, `git push` — in-session.
- Report **command + exit code**.
- Harness blocks bare `git push`? `pnpm --dir ../gtcx-agentic ecosystem:push-all` (from ecosystem root).
- Blocked after diagnosis D1–D6? **Permission Unblock Report** — not "run locally."

### P28 — Authority

| Class | Behavior                                       |
| ----- | ---------------------------------------------- |
| **R** | Self-execute docs, tests, commits, normal push |
| **A** | Run after artifact (XR, inbound ticket)        |
| **S** | Stop; Blocker Report only                      |

### Hub specs

- P22 `gtcx-docs/docs/governance/protocols/22-agent-work-selection/protocol.md`
- P26 `gtcx-docs/docs/governance/protocols/26-agent-proceed-confirmation/protocol.md`
- P27 `gtcx-docs/docs/governance/protocols/27-agent-execution-obligation/protocol.md`
