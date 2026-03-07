# uat/

UAT plan and execution evidence for `gtcx-protocols`.

## Contents

| File                            | Description                                                       |
| ------------------------------- | ----------------------------------------------------------------- |
| [`uat-plan.md`](uat-plan.md)    | UAT scenarios, acceptance checklist, and environment requirements |
| `uat-execution-{YYYY-MM-DD}.md` | Evidence files from UAT runs                                      |

## What Goes in an Execution File

Each UAT execution file records:

- Environment state (Node version, Redis, Postgres, evidence run ID)
- Scenario results — PASS / FAIL / PARTIAL per protocol and cross-protocol flow
- UAT acceptance checklist with results
- Any open items that require follow-up

## Evidence Requirement

A UAT signoff is only valid when:

- Evidence run status is `PASS`
- Evidence run is ≤14 days old
- All P0/P1 acceptance criteria are met
- No open P0 or P1 defects in the backlog

## Archived Execution Records

| Date       | Status | Notes                                                                                                                                                                         |
| ---------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-02-21 | PASS   | v3.0 delivery UAT — all protocols, cross-protocol flows, and acceptance checklist passed. Source: `_archive/legacy/2-specs/_project/planning/uat/uat-execution-2026-02-21.md` |
