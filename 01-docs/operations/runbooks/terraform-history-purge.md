---
title: 'Terraform Binary History Purge Runbook'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['infrastructure', 'api', 'frontend', 'devops', 'agentic']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Terraform Binary History Purge Runbook

## Problem

`.terraform/` directories and `*.tfstate` files were accidentally committed to Git history in `04-ship/terraform/environments/testnet-pilot/` and other paths. These binaries bloat the repo and may contain sensitive state.

## Prerequisites

- `git-filter-repo` installed (`pip install git-filter-repo` or `brew install git-filter-repo`)
- Repository backup (clone to a safe location)
- Team coordination — everyone must re-clone after history rewrite

## Steps

```bash
# 1. Fresh clone
 git clone https://github.com/gtcx-ecosystem/gtcx-infrastructure.git gtcx-infrastructure-purge
 cd gtcx-infrastructure-purge

# 2. Run filter-repo to remove Terraform artifacts from ALL history
 git filter-repo \
   --path-glob '04-ship/terraform/**/*.tfstate*' \
   --path-glob '04-ship/terraform/**/.terraform/**' \
   --path-glob '04-ship/terraform/**/.terraform.lock.hcl' \
   --invert-paths

# 3. Verify nothing remains
 git log --all --full-history -- '04-ship/terraform/**/.terraform/**'
 git log --all --full-history -- '04-ship/terraform/**/*.tfstate*'

# 4. Force-push to origin (DESTRUCTIVE — requires admin)
 git push origin --force --all
 git push origin --force --tags

# 5. Notify the team to re-clone
```

## Prevention

The `.gitignore` already excludes these patterns. The CI gate in `.github/workflows/ci.yml` now rejects PRs that introduce them.

## Rollback

If the purge goes wrong, restore from the backup clone or use `git reflog` within 30 days (before garbage collection).
