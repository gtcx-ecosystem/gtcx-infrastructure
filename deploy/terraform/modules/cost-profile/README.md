# cost-profile

Maps fleet **cost_profile** tiers to EKS managed node group sizing.

| `cost_profile` | Environments  | nodeMin / desired / max |
| -------------- | ------------- | ----------------------- |
| `always_on`    | production    | 2 / 3 / 6               |
| `scheduled`    | staging       | 0 / 0 / 4               |
| `ephemeral`    | testnet_pilot | 0 / 0 / 5               |

Policy SoR: `bridge-os/pm/spec/environment-cost-policy.json` (ECO-ENV-07).

Explicit `eks_node_*` variables override profile defaults when set.

`enable_nat_gateway` is `false` for `ephemeral` (testnet_pilot) — fleet NAT count 4→3.
