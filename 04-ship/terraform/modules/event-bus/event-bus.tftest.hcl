# =============================================================================
# Event Bus Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# Validates NATS security group, JetStream storage, and configuration.
# =============================================================================

variables {
  environment            = "test"
  vpc_id                 = "vpc-test123"
  subnet_ids             = ["subnet-a", "subnet-b"]
  availability_zones     = ["af-south-1a", "af-south-1b"]
  cluster_size           = 1
  jetstream_storage_gb   = 10
  max_payload_kb         = 1024
  retention_days         = 90
}

# -----------------------------------------------------------------------------
# Security group
# -----------------------------------------------------------------------------

run "security_group_created" {
  command = plan

  assert {
    condition     = aws_security_group.nats.vpc_id == "vpc-test123"
    error_message = "NATS security group must be in the specified VPC"
  }
}

run "cluster_routing_is_self_only" {
  command = plan

  assert {
    condition     = aws_security_group.nats.ingress[0].self == true
    error_message = "NATS cluster routing must only allow self (inter-node) traffic"
  }
}

# -----------------------------------------------------------------------------
# JetStream storage
# -----------------------------------------------------------------------------

run "jetstream_volumes_created" {
  command = plan

  assert {
    condition     = length(aws_ebs_volume.jetstream) == 1
    error_message = "Must create one JetStream volume per cluster node"
  }
}

run "jetstream_volumes_encrypted" {
  command = plan

  assert {
    condition     = aws_ebs_volume.jetstream[0].encrypted == true
    error_message = "JetStream EBS volumes must be encrypted at rest"
  }
}

run "jetstream_volumes_use_gp3" {
  command = plan

  assert {
    condition     = aws_ebs_volume.jetstream[0].type == "gp3"
    error_message = "JetStream volumes must use gp3 for performance"
  }
}

# -----------------------------------------------------------------------------
# Configuration outputs
# -----------------------------------------------------------------------------

run "connection_url_uses_standard_port" {
  command = plan

  assert {
    condition     = output.nats_port == 4222
    error_message = "NATS must use standard port 4222"
  }
}

run "ha_cluster_creates_multiple_volumes" {
  command = plan

  variables {
    cluster_size = 3
  }

  assert {
    condition     = length(aws_ebs_volume.jetstream) == 3
    error_message = "HA cluster (size=3) must create 3 JetStream volumes"
  }
}
