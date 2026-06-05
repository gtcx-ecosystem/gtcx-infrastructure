# `03-platform/scripts/agent-sync/` — Agent doc sync

Syncs `.agent/*.md` partials into `AGENTS.md`, `CLAUDE.md`, and sibling agent entry files.

```bash
pnpm agent:sync          # write
pnpm agent:check       # dry-run / drift check
```

**Entry:** `sync.mjs` (delegates to shared BaselineOS sync patterns).

**Parent:** [`03-platform/scripts/README.md`](../README.md)
