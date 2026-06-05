## Universal agent behavior (ANY LLM — terminal, IDE, CLI)

**Applies to:** Claude, Kimi, Gemini, Codex, Cursor (IDE + `agent` CLI), Copilot, and any future agent with shell access.

**Canonical docs (read every session):**

1. `01-docs/04-ops/agent-universal-instructions.md`
2. `01-docs/04-ops/human-gate-navigation.md` — Class **S** + **`blocksIR: false`** gates are **parallel**, not repo frozen

**Full chain:** `baseline start` (INST-003 + repo session + gates). Repo-only: `pnpm agent:start`.

### Session start (one command)

```bash
baseline start
# or: pnpm agent:start   # P22 bootstrap only — not full INST-003 chain
```

Optional: `pnpm agent:start --json` · legacy alias `pnpm agent:session-start` (same as `agent:start`).

### P22 — Work selection

- Run next-work; **never** ask "which story?" or present numbered menus.
- Execute the returned story in **this repo** unless P24 handoff says switch owner repo.

### P26 — Proceed Brief (then implement)

Emit **one** brief, then work. Human may **stop**, **correct:**, or story ID — not pick options.

**Forbidden replies:** Your call · Two options · 1./2. menus · Say push if you want · **Say if you want** · **committed next or** · **left as local WIP** · Which do you prefer? · **I can…** · **Want me to tackle…** · **anything on the P1 list?** · approval of path already selected (Class R).

**After push/status tables:** run `agent:next-work` → **Status Update** → **Next priority** = that story → implement (do not offer a repo pick list).

**Uncommitted Class R files:** commit in-session (micro-commit) — never ask operator to choose commit vs WIP.

**Required close:** **Status Update** only — message **stops** after Approval needed. **One** Next priority (from `agent:next-work`); never "Want me to proceed with A or B?". Execute Class R Next in-session.

**Status Update (end of turn):** `### Done` · `### Next priority` (one owner + action) · `### Approval needed` (Class A/S only — omit if empty). Template: `01-docs/04-ops/agent-status-update-template.md`.

### P27 — You run commands

- Gates, dev servers (Metro/Expo background), `adb`, `git push` — in-session.
- Report **command + exit code**.
- Harness blocks bare `git push`? **D3:** `pnpm --dir ../gtcx-agentic ecosystem:git-push --repo <name>` · **D5:** `pnpm --dir ../gtcx-agentic ecosystem:push-all`.
- Blocked after diagnosis D1–D6? **Permission Unblock Report** — not "run locally."

### P28 — Authority

| Class | Behavior                                       |
| ----- | ---------------------------------------------- |
| **R** | Self-execute docs, tests, commits, normal push |
| **A** | Run after artifact (XR, inbound ticket)        |
| **S** | Stop; Blocker Report only                      |

### Hub specs

- P22 `gtcx-docs/01-docs/governance/protocols/22-agent-work-selection/protocol.md`
- P26 `gtcx-docs/01-docs/governance/protocols/26-agent-proceed-confirmation/protocol.md`
- P27 `gtcx-docs/01-docs/governance/protocols/27-agent-execution-obligation/protocol.md`
