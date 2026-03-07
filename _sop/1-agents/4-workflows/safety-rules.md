# Safety Rules — {repo-name}

What agents and contributors may do autonomously vs. what requires explicit human authorization.

Governed by the Baseline Protocol (`ai-1-baseline`) and enforced through `1-agentic`. These rules apply to all AI-assisted work in this repo.

---

## Autonomous — No Approval Required

- Read any file in the repo
- Run any quality gate (`{lint-command}`, `{test-command}`, `{build-command}`, etc.)
- Write or update documentation in `_sop/`
- Write new tests for existing behavior
- Fix failing tests where the fix is clearly scoped to the failing case
- Update component specs in `_sop/2-docs/5-specs/`
- Propose ADRs — status must remain `Proposed`; human approval required before `Accepted`
- Commit completed work using conventional commit format — commit after each meaningful, self-contained unit of work; never accumulate multiple tasks into a single commit

---

## Requires Human Approval Before Proceeding

| Action                                         | Reason                                     |
| ---------------------------------------------- | ------------------------------------------ |
| Any change to {security-sensitive-component-1} | {reason — e.g. security-sensitive package} |
| Any change to {security-sensitive-component-2} | {reason}                                   |
| Adding any new package, service, or module     | Changes workspace or service configuration |
| Any change to `{workspace-config-file}`        | Build system integrity                     |
| Any change to `.github/workflows/`             | CI/CD pipeline                             |
| Any change to {quality-baseline-file}          | Published quality contract                 |
| Marking an ADR status `Accepted`               | Architectural decision finalization        |
| Any destructive git operation                  | Irreversible                               |
| Publishing a release                           | Downstream impact                          |

---

## Never — Hard Rules

These rules have no exceptions. There is no circumstance where these actions are permitted:

- Never skip CI gates — no `--no-verify`, no bypassing hooks
- Never push to `main` without explicit instruction
- Never force push
- Never commit `.env` files or secrets
- Never remove or downgrade a security control
- Never mark a release checklist item complete without running the actual gate
- Never mark an ADR `Accepted` without human approval

---

## Escalation

If uncertain whether an action requires approval: stop. State the action, the uncertainty, and the consequence of getting it wrong. Ask.

The cost of pausing is zero. The cost of an unauthorized change is unbounded.

---

## Reference

- [`_sop/1-agents/3-structure/coordination.md`](../3-structure/coordination.md) — decision matrix and coordination protocols
- [`_sop/1-agents/4-workflows/tasks/`](./tasks/) — task playbooks for common operations
- [`_sop/2-docs/4-devops/7-release-mgmt/release-checklist.md`](../../2-docs/4-devops/7-release-mgmt/release-checklist.md) — release gate checklist
- `ai-1-baseline` — Baseline Protocol governing these rules
