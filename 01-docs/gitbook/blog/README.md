---
title: 'External Blog Drafts'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['external', 'blog', 'distribution']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 95
autonomy_level: 'sovereign'
---

# External Blog Drafts

Publish-ready drafts for the GTCX `gtcx.trade` blog. Each draft has an internal-review checklist at the bottom; mark items as the named reviewer signs off, then publish.

## Drafts

| File                                                                 | Status | Topic                                        |
| -------------------------------------------------------------------- | ------ | -------------------------------------------- |
| [`audit-signer-launch-2026-05.md`](./audit-signer-launch-2026-05.md) | Draft  | `@gtcx/audit-signer` npm launch announcement |

## Process

1. Author writes the draft with `status: 'draft'` frontmatter.
2. Each reviewer in the front-matter checklist signs off (changes `pending` → `approved`).
3. When all reviewers approve, status flips to `'ready-to-publish'`.
4. After publishing, status flips to `'published'` and a link to the live URL is added under the title.

We keep drafts in-repo so they're versioned, link-checked, and reviewable via PR like any other code.
