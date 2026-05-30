---
title: 'Intelligence Evidence'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'standard'
tags: ['security', 'infrastructure', 'api', 'devops', 'mobile']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Intelligence Evidence

Use this runbook to prepare environment variables for the intelligence repo evidence runners from the infra-managed testnet contract.

This runbook does not execute the evidence scripts itself. It prepares the smoke target and provider credentials/toggles that the intelligence repo needs.

## Inputs

- testnet or staging Terraform has been applied
- sandbox provider secret values have been populated in AWS Secrets Manager
- AWS CLI credentials can read the relevant secret ARNs

## Step 1: Export Terraform Outputs

From this repo:

```bash
terraform -chdir=infra/terraform/environments/testnet-pilot output -json > /tmp/testnet-outputs.json
```

The output file must contain:

- `smoke_evidence_base_url`
- `provider_failure_mode`
- `provider_failure_target`
- `sandbox_secret_arns`

## Step 2: Prepare Evidence Environment

Generate shell exports from the Terraform outputs plus Secrets Manager values:

```bash
./infra/scripts/prepare-intelligence-evidence-env.sh \
  --terraform-output-file=/tmp/testnet-outputs.json \
  --mode=sandbox
```

To force degraded-mode verification:

```bash
./infra/scripts/prepare-intelligence-evidence-env.sh \
  --terraform-output-file=/tmp/testnet-outputs.json \
  --mode=forced-failure \
  --failure-target=all
```

To write a dotenv-style file:

```bash
./infra/scripts/prepare-intelligence-evidence-env.sh \
  --terraform-output-file=/tmp/testnet-outputs.json \
  --format=dotenv \
  --write-env-file=/tmp/intelligence-evidence.env
```

The helper emits:

- `SMOKE_EVIDENCE_BASE_URL`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `COMPLY_ADVANTAGE_API_KEY`
- `INTELLIGENCE_PROVIDER_MODE`
- `INTELLIGENCE_PROVIDER_FAILURE_TARGET`

## Step 3: Run Evidence In The Intelligence Repo

In `gtcx-intelligence`, load those variables into your shell and run:

```bash
# cwd: gtcx-intelligence (NOT this repo — runbook-commands-check.mjs skips this block)
pnpm evidence:external-providers
pnpm evidence:deployment-smoke
pnpm evidence:production-readiness
```

## Notes

- `--mode=sandbox` is the normal non-production path
- `--mode=forced-failure` is for degraded-mode evidence only
- do not commit generated env files or captured outputs

## Related

- [fine-tune-workflow-enablement.md](./fine-tune-workflow-enablement.md)
- [rollback-evidence.md](./rollback-evidence.md)
- [docs/security/secrets-management.md](../../security/secrets-management.md)
