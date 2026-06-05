---
title: 'Fine-Tune Workflow Enablement'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'infrastructure', 'testing', 'frontend', 'devops']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Fine-Tune Workflow Enablement

`enable_fine_tune_workflow` must remain `false` until all of the following are true:

- `fine_tune.py` produces a real model artifact
- the eval step gates that artifact with a real result
- the promoter updates a real promotion target
- one staging end-to-end workflow run succeeds
- `enable_red_team_workflow` remains `false` unless a separate red-team runtime, image pin, and operator decision are ready

Before setting `enable_fine_tune_workflow = true` in any Terraform environment:

1. Pin `curator_image`, `trainer_image`, `evaluator_image`, and `promoter_image` to immutable SHA or release tags.
2. Create an evidence manifest JSON file based on [fine-tune-workflow-enable-evidence.example.json](../fine-tune-workflow-enable-evidence.example.json).
3. Set `enablement_evidence_manifest` to the relative path of that evidence file from the Terraform environment directory.
4. Run the policy guard:
   `pnpm check:fine-tune-workflow-policy`
5. Run `terraform plan` and confirm the workflow policy guard passes.
6. Use the manual operator path in [fine-tune-workflow-operations.md](./fine-tune-workflow-operations.md) for one staging/testnet run before any cron enablement.

The workflow must not be enabled with `:latest` tags.
The red-team step must not be enabled by setting `red_team_image` alone; it requires `enable_red_team_workflow = true`.
