---
title: '03-platform/tools/03-platform/scripts/ — Developer + CI Validators'
status: 'current'
date: '2026-05-24'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['scripts', 'ci', 'validators', 'dev-tooling', 'master-validation']
review_cycle: 'on-change'
---

# 03-platform/tools/03-platform/scripts/ — Developer + CI Validators

**Charter:** Scripts that run as part of the master-validation gate or as developer-loop tooling. Mix of `.mjs` (Node), `.sh` (bash), and `.py` (Python) — language follows the artifact each script processes. These do **not** touch production infrastructure.

## What belongs here

- Validators run by [`03-platform/tools/03-platform/scripts/validate-all.mjs`](./validate-all.mjs) as master-validation gates
- Docs hygiene checkers ([`docs-standard-validator.mjs`](./docs-standard-validator.mjs), [`docs-link-checker.mjs`](./docs-link-checker.mjs), [`doc-hygiene-check.sh`](./doc-hygiene-check.sh))
- Static-content generators ([`distribution-snapshot.mjs`](./distribution-snapshot.mjs))
- Drill simulators ([`incident-drill-pagerduty-simulation.mjs`](./incident-drill-pagerduty-simulation.mjs), [`incident-drill-validator.mjs`](./incident-drill-validator.mjs))
- Policy validators ([`kyverno-policy-validator.mjs`](./kyverno-policy-validator.mjs), [`verify-mesh-injection.mjs`](./verify-mesh-injection.mjs))
- Build-reproducibility checks ([`verify-reproducible-build.mjs`](./verify-reproducible-build.mjs))
- Scorecard validators ([`validate-score-ledger.mjs`](./validate-score-ledger.mjs), [`validate-signal.mjs`](./validate-signal.mjs))

## What does NOT belong here

- Runtime operations (deploy, migrate, bootstrap) → use [`04-ship/03-platform/scripts/`](../../04-ship/03-platform/scripts/README.md)
- Cross-repo coordination / agent-sync → use [`03-platform/scripts/`](../../03-platform/scripts/README.md)
- Per-workspace-package scripts → use that package's `package.json` scripts

## Contents

### Master-validation gates

These run as part of `node 03-platform/tools/03-platform/scripts/validate-all.mjs`:

| Script                                                             | Validates                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| [`validate-all.mjs`](./validate-all.mjs)                           | Orchestrator — runs all gates below + per-package coverage |
| [`docs-standard-validator.mjs`](./docs-standard-validator.mjs)     | YAML frontmatter, broken links, directory placement        |
| [`docs-link-checker.mjs`](./docs-link-checker.mjs)                 | All internal markdown links resolve                        |
| [`kyverno-policy-validator.mjs`](./kyverno-policy-validator.mjs)   | Kyverno K8s policy syntax + coverage                       |
| [`validate-score-ledger.mjs`](./validate-score-ledger.mjs)         | Append-only score-evidence ledger integrity                |
| [`validate-signal.mjs`](./validate-signal.mjs)                     | SIGNAL scorecard structure + per-dimension consistency     |
| [`verify-mesh-injection.mjs`](./verify-mesh-injection.mjs)         | Linkerd / Kyverno mesh-injection policies (prod + staging) |
| [`verify-reproducible-build.mjs`](./verify-reproducible-build.mjs) | Reproducible-build dry-run                                 |
| [`chaos-manifest-validator.mjs`](./chaos-manifest-validator.mjs)   | Chaos experiment manifest schema                           |
| [`incident-drill-validator.mjs`](./incident-drill-validator.mjs)   | Incident drill schedule completeness                       |

### Dev / CI tooling

| Script                                                                                 | Purpose                                                        |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [`audit-with-acceptance.mjs`](./audit-with-acceptance.mjs)                             | `npm audit` with CVE-acceptance-log filtering                  |
| [`auto-sync-agents.sh`](./auto-sync-agents.sh)                                         | Sync agent-orchestration files across siblings                 |
| [`distribution-snapshot.mjs`](./distribution-snapshot.mjs)                             | Daily npm + GitHub adoption snapshot (CI cron)                 |
| [`distribution-snapshot.test.mjs`](./distribution-snapshot.test.mjs)                   | Unit tests for the snapshot generator                          |
| [`doc-hygiene-check.sh`](./doc-hygiene-check.sh)                                       | Quick local docs hygiene check                                 |
| [`incident-drill-pagerduty-simulation.mjs`](./incident-drill-pagerduty-simulation.mjs) | PagerDuty incident-drill simulator (CI dry-run)                |
| [`staging-smoke-test.mjs`](./staging-smoke-test.mjs)                                   | Post-deploy smoke test against staging                         |
| [`security-status.js`](./security-status.js)                                           | Repo security-posture summary                                  |
| [`check_docs.py`](./check_docs.py)                                                     | Migration-stack doc checker (Python; in migration stack scope) |
| [`generate_docs.py`](./generate_docs.py)                                               | Migration-stack doc generator (Python)                         |

## Conventions

- Validators exit non-zero on violation; CI gate blocks merge
- Output is human-readable when run from a TTY; structured (JSON) when piped
- Validators are **read-only** — they detect issues but never mutate state
- New gates added here must also be wired into [`validate-all.mjs`](./validate-all.mjs)
- Tests for these scripts live alongside (e.g. `distribution-snapshot.test.mjs`)

## Related

- [`04-ship/03-platform/scripts/`](../../04-ship/03-platform/scripts/README.md) — runtime operations
- [`03-platform/scripts/`](../../03-platform/scripts/README.md) — cross-repo automation
- [`03-platform/tools/policy/`](../policy/) — Kyverno policy source these validators check against
