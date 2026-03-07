# Codebase Orientation — {repo-name}

Session-start protocol for any agent or contributor entering this repo.

---

## What This Repo Is

{Describe what this repo is, what it produces, and who consumes it. Is it a library, a service, a product? Does it have a UI? What are the downstream dependencies?}

---

## Read Before Touching Code

In this order — no exceptions:

1. `_sop/2-docs/5-specs/4-backend/core-spec.md` — scope, NFRs, design principles
2. `_sop/2-docs/3-engineering/2-system-design/overview.md` — layer map and component boundaries
3. `_sop/2-docs/3-engineering/6-decisions/` — all ADRs (understand why things are the way they are)
4. `_sop/2-docs/5-specs/4-backend/packages/` — spec for the component you are working in
5. `_sop/1-agents/4-workflows/safety-rules.md` — before making any change

---

## Repo Structure

```
{source-dir}/       {primary source — packages, services, apps, etc.}
{secondary-dir}/    {secondary source if applicable — e.g. rust/, workers/}
tools/              Quality gate scripts and automation
tests/              Integration and end-to-end tests
benchmarks/         Performance budgets and results (if applicable)
quality/            API surface baselines and evidence artifacts
```

---

## Dependency Rules

- {Rule 1 — e.g. the core package has no hard internal dependencies}
- {Rule 2 — e.g. higher-level packages build on lower-level ones}
- Circular dependencies are disallowed — enforced by `{architecture-check-command}`
- Any new dependency must be declared; phantom dependencies are a CI failure

---

## Security-Sensitive Areas

These packages or modules require explicit human review before any change ships:

| Component       | Area                                   |
| --------------- | -------------------------------------- |
| `{component-1}` | {e.g. auth, signing, key management}   |
| `{component-2}` | {e.g. data validation, access control} |

---

## Pre-Commit Gate

Run this sequence before every commit:

```bash
{lint-command}
{typecheck-command}
{test-command}
{build-command}
```

See `_sop/2-docs/4-devops/2-runbooks/quality-runbook.md` for the full gate sequence and triage order when a gate fails.

---

## Where Things Live

| Need                   | Location                                     |
| ---------------------- | -------------------------------------------- |
| System specification   | `_sop/2-docs/5-specs/4-backend/core-spec.md` |
| Component specs        | `_sop/2-docs/5-specs/4-backend/packages/`    |
| System architecture    | `_sop/2-docs/3-engineering/2-system-design/` |
| Architecture decisions | `_sop/2-docs/3-engineering/6-decisions/`     |
| Security framework     | `_sop/2-docs/3-engineering/7-security/`      |
| CI/CD pipeline         | `_sop/2-docs/4-devops/3-ci-cd-pipelines/`    |
| Operations runbooks    | `_sop/2-docs/4-devops/2-runbooks/`           |
| Sprint and roadmap     | `_sop/3-agile/`                              |
| Quality evidence       | `quality/`, `benchmarks/`                    |

---

## Reference

- [`safety-rules.md`](../4-workflows/safety-rules.md) — what requires human approval
- [`context-recovery.md`](./context-recovery.md) — how to recover agent context across sessions
- [`_sop/2-docs/3-engineering/2-system-design/overview.md`](../../2-docs/3-engineering/2-system-design/overview.md) — architecture overview
- [`_sop/2-docs/4-devops/2-runbooks/quality-runbook.md`](../../2-docs/4-devops/2-runbooks/quality-runbook.md) — full pre-commit gate sequence
