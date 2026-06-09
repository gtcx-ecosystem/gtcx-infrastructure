locals {
  # SoR: bridgeOS/pm/spec/environment-cost-policy.v1.json (eks.nodeMin/nodeDesired/nodeMax)
  profiles = {
    always_on = { min = 2, desired = 3, max = 6 }
    scheduled = { min = 0, desired = 0, max = 4 }
    ephemeral = { min = 0, desired = 0, max = 5 }
  }

  from_profile = var.cost_profile != null ? local.profiles[var.cost_profile] : null
}
