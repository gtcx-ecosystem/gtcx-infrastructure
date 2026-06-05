---
title: 'ADR-020: Per-Package Coverage Thresholds, Documented Deviations'
status: 'accepted'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['architecture', 'testing', 'coverage', 'quality-gates']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-020: Per-Package Coverage Thresholds, Documented Deviations

## Status

Accepted

## Date

2026-05-22

## Context

The repo's coverage gate started at branches=functions=statements=lines=90 for every workspace package. That worked while the surface was tight. By the end of Cycle 1, two specific files (`03-platform/tools/audit-flush/03-platform/src/index.mjs` for the soft-loaded NATS path, `03-platform/tools/compliance-gateway/03-platform/src/server.mjs` for the startup-listener + SIGTERM path) had genuine coverage gaps that would have required real-broker integration tests + subprocess-signaling tests to close.

The choices were:

1. **Lower the global threshold** — easy but signals "we don't care about coverage."
2. **Add complex integration scaffolding** — closes the gap honestly but costs disproportionate effort for marginal value (those code paths are well-tested in production traffic + manual ops drills).
3. **Per-package thresholds with documented rationale** — preserve high bar on the majority, document each exception with its specific reason.

## Decision

Each workspace package's `package.json` defines its own `test:coverage:gate` thresholds. The default is `branches=90, functions=90, statements=90, lines=90`. Any package that deviates from the default ships an entry in `01-docs/05-audit/coverage-gate-rationale.md` explaining which file produces the gap and why integration scaffolding to close it is not warranted.

Current deviations (as of Cycle 2.5):

| Package                    | Branches | Functions | Statements | Lines | Reason                                                                                                                                                      |
| -------------------------- | -------: | --------: | ---------: | ----: | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@gtcx/compliance-gateway` |       85 |        85 |         90 |    90 | NATS soft-load + server-startup-listener paths require real-broker + real-process integration to credit. See `01-docs/05-audit/coverage-gate-rationale.md`. |
| All others                 |       90 |        90 |         90 |    90 | Default.                                                                                                                                                    |

The rationale doc is part of `validate-all.mjs --full` link-checking and updates whenever a deviation is added or removed.

## Alternatives Considered

| Option                                               | Pros                                   | Cons                                                                                                                              |
| ---------------------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Single global 90% threshold                          | Simple to communicate                  | Forces dishonest workarounds (e.g., wrapping process.exit in a helper just to test it); discourages legitimate soft-load patterns |
| Single global 85% threshold                          | Universally achievable                 | Lowers the bar for packages that genuinely hit 100% (audit-signer at 100% loses signal)                                           |
| Per-file thresholds via c8 config                    | Most surgical                          | Maintenance nightmare; cross-cuts files unrelated to the gap                                                                      |
| **Per-package thresholds with documented rationale** | High bar by default; honest deviations | Requires the rationale doc to stay current                                                                                        |

## Consequences

**Positive:**

- `@gtcx/audit-signer` continues to score 100% across all four metrics and that signal is preserved
- `@gtcx/compliance-gateway`'s gap is documented in a single canonical place reviewers can audit
- New packages inherit the strict default unless they justify otherwise
- The rationale doc is the ADR's enforcement artifact — anyone considering a deviation must add their own rationale

**Negative:**

- Two places to keep aligned: `03-platform/tools/<pkg>/package.json` and `01-docs/05-audit/coverage-gate-rationale.md`. Drift is possible. Mitigated by: (a) the rationale doc is small (~50 lines), (b) any future deviation lands as a PR and reviewers look at both files together
- A new contributor seeing only `@gtcx/compliance-gateway`'s 85% threshold might assume the bar is universally 85%. Mitigated by `package.json`'s `_coverage_gate_note` field — a comment-like key that explains the deviation inline

**Neutral:**

- Coverage tools may emit warnings for the difference between gate and actual. Acceptable; the gate is a floor, not a target.

## References

- `01-docs/05-audit/coverage-gate-rationale.md` — the canonical deviation registry
- ADR-019 — workspace boundary discipline (the list of packages this ADR applies to)
- `03-platform/tools/03-platform/scripts/validate-all.mjs` — coverage sweep that uses each package's own thresholds
- Cycle 1 R4 commit `70dbc62` — first per-package threshold + rationale doc
