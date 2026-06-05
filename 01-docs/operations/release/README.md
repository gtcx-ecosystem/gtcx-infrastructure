---
title: 'Release Governance'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['release', 'distribution', 'versioning', 'legal', 'license']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# Release Governance

Release-gate procedures and supporting policies. The actual release runbook is at [`../runbooks/release.md`](../runbooks/release.md); this folder holds the policy-level documents the runbook references.

## Contents

| File                                                   | Purpose                           |
| ------------------------------------------------------ | --------------------------------- |
| [`ga-release-checklist.md`](./ga-release-checklist.md) | General-availability release gate |
| [`legal-review.md`](./legal-review.md)                 | Legal sign-off requirements       |
| [`license-compliance.md`](./license-compliance.md)     | OSS license audit policy          |
| [`versioning-policy.md`](./versioning-policy.md)       | SemVer + release-tag discipline   |

## Related

- [`../runbooks/release.md`](../runbooks/release.md) — release runbook
- [`../runbooks/release-evidence.md`](../runbooks/release-evidence.md) — evidence-bundle collection
- [`../../architecture/decisions/ADR-021-npm-publish-discipline.md`](../../architecture/decisions/ADR-021-npm-publish-discipline.md) — npm publish discipline
