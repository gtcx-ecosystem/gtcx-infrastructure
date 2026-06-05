---
title: 'Dependency-Bump Triage'
status: 'current'
date: '2026-05-30'
owner: 'platform-engineering'
tier: 'standard'
tags: ['dependencies', 'dependabot', 'ci']
review_cycle: 'on-change'
---

# Dependency-Bump Triage

`.github/workflows/dependabot-triage.yml` runs on every dependabot PR
and labels it by risk class. Use the label to decide the merge path.

## Labels + merge policy

| Label        | Class                                | Merge policy                                                                                                                                         |
| ------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deps:patch` | `version-update:semver-patch`        | **Merge on green CI** (squash). No additional review needed for dev deps; one reviewer on runtime deps in the compliance-gateway / audit-flush path. |
| `deps:minor` | `version-update:semver-minor`        | **Review changelog, merge on green CI.** Look for new APIs or deprecation warnings.                                                                  |
| `deps:major` | `version-update:semver-major`        | **Hold + investigate.** Read changelog, run integration tests beyond CI, plan migration. Do not merge without a follow-up issue if breaking changes. |
| `deps:other` | unclassified (e.g., security update) | Treat as **minor** by default; escalate to **major** if dependabot's PR body cites a CVE.                                                            |

## Group bumps

The `.github/dependabot.yml` groups several ecosystems so weekly bumps
arrive as a handful of PRs instead of dozens:

- `actions-core` — `actions/*`
- `aws-actions` — `aws-actions/*`
- `docker` — `docker/*`
- `security-scanners` — `aquasecurity/*`, `github/codeql-action*`, `sigstore/*`, `slsa-framework/*`, `trufflesecurity/*`, `zaproxy/*`
- `terraform` — `hashicorp/setup-terraform`, `terraform-linters/*`
- `typescript` / `linting` / `testing` (per `dependabot.yml`) — npm groups

A grouped PR is rated by the **highest-class** bump in the group.
If a group PR mixes patch + major bumps, treat the whole thing as major.

## Hard rules

- **Never** merge a major bump on a production-hot package
  (`@gtcx/*`, `@ai-sdk/*`, `ai`, `nats`, `@aws-sdk/*`) without
  first running `pnpm test:full` locally + checking soak-test
  artifacts in `04-ship/security/reports/load-tests/`.
- **Never** merge while `pnpm test` / `pnpm test:full` is red.
- **SHA-pin every action.** `pin-actions-sha.mjs --check` enforces this
  in CI; dependabot bumps preserve the SHA-pin format because
  `dependabot.yml`'s grouped strategy keeps the trailing `# v4`
  annotation as a comment.

## Why no auto-merge

Auto-merge to `main` ships changes without human-in-the-loop. For
a compliance substrate under regulatory scrutiny, the cost of a
breaking change reaching production unreviewed is much higher than
the cost of the reviewer clicking the merge button after CI green.
Auto-merge is intentionally NOT enabled at the repo level. The
triage workflow surfaces the signal the auto-merge switch would
consume; the human flips the switch.
