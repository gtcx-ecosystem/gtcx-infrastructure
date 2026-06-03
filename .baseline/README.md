# `.baseline/`

Institutional memory and agent context for the GTCX Infrastructure repository.

## Files

| File | Purpose |
|------|---------|
| `definition.json` | Repo identity, stack, and canonical terminology |
| `memory/session.md` | Per-session activity log and next-steps |
| `memory/patterns.md` | Confirmed architectural patterns |
| `memory/pitfalls.md` | Known issues, anti-patterns, blockers |
| `memory/dependencies.md` | Cross-repo dependency map |
| `checkpoints/` | Audit evidence and gate state snapshots |
| `govern/` | Policy and decision records |
| `index/` | Registry of canonical documents |

## Agent note

Read `.baseline/definition.json` and `memory/session.md` on every session start.
Append session outcomes to `memory/session.md` before shutdown.
