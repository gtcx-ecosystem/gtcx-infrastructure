# AWS cost optimization (T7)

**Owner:** `gtcx-infrastructure`  
**Policy SoR:** [`bridge-os/pm/spec/environment-cost-policy.json`](../../../bridge-os/pm/spec/environment-cost-policy.json)  
**Governance SoR:** [`bridge-os/pm/spec/aws-cost-governance.json`](../../../bridge-os/pm/spec/aws-cost-governance.json)

## Principle

Only **production** is always-on. Staging and testnet pilot run on intent — warm, cold, or ephemeral — never 24/7 by default.

## Terraform cost profiles (ECO-ENV-07)

Module: `deploy/terraform/modules/cost-profile`

| `cost_profile` | Environment   | EKS min / desired / max | NAT |
| -------------- | ------------- | ----------------------- | --- |
| `always_on`    | production    | 2 / 3 / 6               | on  |
| `scheduled`    | staging       | 0 / 0 / 4               | on  |
| `ephemeral`    | testnet_pilot | 0 / 0 / 5               | off |

Wiring:

- `deploy/terraform/environments/staging/terraform.tfvars` → `cost_profile = "scheduled"`
- `deploy/terraform/environments/testnet-pilot/terraform.tfvars` → `cost_profile = "ephemeral"`

Run module tests:

```bash
cd deploy/terraform/modules/cost-profile
terraform init -backend=false
terraform test
```

## Runtime fleet controller (bridge-os)

| Action                      | Command                                         |
| --------------------------- | ----------------------------------------------- |
| Weekly Cost Explorer rollup | `pnpm --dir ../bridge-os env:cost:report:write` |
| Warm staging                | `pnpm --dir ../bridge-os env:warm`              |
| Cold staging                | `pnpm --dir ../bridge-os env:cold`              |
| Budget gate check           | `pnpm --dir ../bridge-os env:governance:check`  |
| Fleet status                | `pnpm --dir ../bridge-os env:status`            |

Live AWS mutations require credentials for account `348389439381` (primarily `af-south-1`). Cost Explorer uses `us-east-1`.

## Audit harness

```bash
pnpm infra:cost:audit          # check gates
pnpm infra:cost:audit:write    # write witness
```

Witness: `audit/evidence/infra-aws-cost-optimization-latest.json`

Bridge-os fleet witnesses (linked, not duplicated):

- `bridge-os/pm/ci/eco-env-07-terraform-cost-profile-latest.json`
- `bridge-os/pm/ci/eco-env-08-nat-endpoints-latest.json`
- `bridge-os/pm/ci/aws-cost-weekly.json`
- `bridge-os/pm/ci/aws-budgets-latest.json`

## Apply gate

`terraform apply` for staging/testnet-pilot cost-profile changes requires an **infra window** (Class A when production-adjacent). Code and tfvars may be green while live AWS still reflects pre-apply state — see `applyRequired` in the witness JSON.
