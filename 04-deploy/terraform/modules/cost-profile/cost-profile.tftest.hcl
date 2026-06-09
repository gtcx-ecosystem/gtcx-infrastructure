run "scheduled_profile_node_min_zero" {
  command = plan

  module {
    source = "./"
  }

  variables {
    cost_profile = "scheduled"
  }

  assert {
    condition     = output.node_min_size == 0 && output.node_desired_size == 0 && output.node_max_size == 4
    error_message = "scheduled profile must match bridgeOS staging policy (0/0/4)"
  }
}

run "ephemeral_profile_node_min_zero" {
  command = plan

  module {
    source = "./"
  }

  variables {
    cost_profile = "ephemeral"
  }

  assert {
    condition     = output.node_min_size == 0 && output.node_desired_size == 0 && output.node_max_size == 5
    error_message = "ephemeral profile must match bridgeOS testnet_pilot policy (0/0/5)"
  }
}

run "explicit_override_wins" {
  command = plan

  module {
    source = "./"
  }

  variables {
    cost_profile          = "scheduled"
    eks_node_desired_size = 2
  }

  assert {
    condition     = output.node_min_size == 0 && output.node_desired_size == 2
    error_message = "explicit eks_node_desired_size must override profile desired"
  }
}
