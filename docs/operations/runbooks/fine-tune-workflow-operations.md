# Fine-Tune Workflow Operations

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Operator path for one-off staging/testnet workflow runs and fast CronWorkflow suspension.

This runbook does **not** change the enablement policy in [fine-tune-workflow-enablement.md](./fine-tune-workflow-enablement.md). The policy remains:

- `enable_fine_tune_workflow = false` until evidence requirements are satisfied
- cron stays off until a manual staging/testnet run succeeds end to end
- `red_team_image` alone must not activate the red-team step

## Script

Use [infra/scripts/fine-tune-workflow.sh](../../../infra/scripts/fine-tune-workflow.sh).

The script assumes:

- `kubectl` already points at the target cluster
- the Argo namespace is `argo-workflows` unless overridden
- the Terraform-managed Argo resources already exist in the cluster

## Status Check

Before any manual run or suspend/resume action:

```bash
./infra/scripts/fine-tune-workflow.sh status
```

This verifies:

- whether `WorkflowTemplate/intelligence-fine-tune-cycle` exists
- whether `CronWorkflow/intelligence-fine-tune-biweekly` exists
- whether the cron is currently suspended
- recent workflow runs in the namespace

If the template or cron is missing, stop. That usually means the workflow is still disabled in Terraform for the current environment.

## Manual Trigger

Run one explicit workflow from the `WorkflowTemplate` before any cron enablement:

```bash
./infra/scripts/fine-tune-workflow.sh trigger \
  --environment=testnet-pilot \
  --dataset-version=2026-05-06 \
  --model-id=cortex-anomaly-detector \
  --eval-threshold=0.05 \
  --reason=staging-evidence-run
```

Notes:

- `--dataset-version` is required to avoid blind `latest` operator runs
- the script creates a standalone `Workflow`, not a `CronWorkflow`
- the created workflow is labeled as a manual operator run

Dry-run mode:

```bash
./infra/scripts/fine-tune-workflow.sh trigger \
  --environment=testnet-pilot \
  --dataset-version=2026-05-06 \
  --dry-run
```

After submission, collect:

- workflow name
- workflow phase/result
- links or screenshots for logs/artifacts
- follow-up evidence from the intelligence repo runners once deployment/provider prerequisites exist

## Fast Disable Path

Suspend the cron without editing Terraform or patching resources by hand:

```bash
./infra/scripts/fine-tune-workflow.sh suspend
```

This sets:

- `CronWorkflow/intelligence-fine-tune-biweekly.spec.suspend=true`

Use it when:

- a manual run exposes a bad trainer/eval/promotion behavior
- external providers degrade unexpectedly
- staging evidence collection shows unhealthy fallback behavior
- an operator needs an immediate stop on new scheduled runs

Dry-run mode:

```bash
./infra/scripts/fine-tune-workflow.sh suspend --dry-run
```

## Resume Path

Only resume after explicit review:

```bash
./infra/scripts/fine-tune-workflow.sh resume
```

Resume is allowed only after:

- root cause is understood
- image pins are verified
- rollback or mitigation is documented
- operator approval is explicit

## Rollback Expectations

Suspending the cron stops new scheduled runs. It does **not** rewrite image pins or undo a completed workflow result.

For evidence and rollback records, capture:

- workflow name and phase
- image tags used for curator, trainer, evaluator, promoter, and red-team if present
- timestamp of `suspend`
- post-suspend `status` output
- follow-up deployment or config rollback if the workflow surfaced a serving issue

If the issue is in the serving path, use the normal deploy rollback flow in [deploy.md](./deploy.md).

## Reference

- [fine-tune-workflow-enablement.md](./fine-tune-workflow-enablement.md)
- [deploy.md](./deploy.md)
- [infra/terraform/modules/workflow-orchestration/main.tf](../../../infra/terraform/modules/workflow-orchestration/main.tf)
