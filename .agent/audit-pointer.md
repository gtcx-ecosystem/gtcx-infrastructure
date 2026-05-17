## Audits (cross-repo)

To run any forensic audit on this repo (master-audit, full-audit, 10-10-roadmap, repo-overview, doc-cleanup, doc-standard, verification-audit, docs-machine-readable):

1. Read `../audit/AGENT-START.md` — the canonical entry point lists every command, its prompt file, and the output path.
2. Read the specific command file (`../audit/commands/<command>.md`).
3. Read the prompt file referenced there (`../audit/prompts/<category>/<file>.md`).
4. Execute the prompt against this repo.
5. Write the output to the path the command specifies (typically `docs/audit/<command>-<YYYY-MM-DD>.md`).

The audit registry is provider-agnostic — the same prompts work for Claude, Codex, Gemini, Kimi, Deepseek, Grok, etc.
