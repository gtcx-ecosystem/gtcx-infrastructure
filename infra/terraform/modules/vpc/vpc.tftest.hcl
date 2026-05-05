# =============================================================================
# VPC Module — Terraform Native Tests
# =============================================================================
# Run: terraform test (from this directory)
# These validate configuration correctness without provisioning real resources.
# =============================================================================

variables {
  environment        = "test"
  region             = "us-east-1"
  cidr_block         = "10.99.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  enable_nat_gateway = false
  enable_vpn_gateway = false
}

# -----------------------------------------------------------------------------
# Plan-mode tests — validate resource configuration
# -----------------------------------------------------------------------------

run "vpc_creates_expected_resources" {
  command = plan

  assert {
    condition     = aws_vpc.main.cidr_block == "10.99.0.0/16"
    error_message = "VPC CIDR block should match input variable"
  }

  assert {
    condition     = aws_vpc.main.enable_dns_support == true
    error_message = "VPC must have DNS support enabled"
  }

  assert {
    condition     = aws_vpc.main.enable_dns_hostnames == true
    error_message = "VPC must have DNS hostnames enabled"
  }
}

run "creates_three_subnet_tiers" {
  command = plan

  # 3 AZs = 3 subnets per tier
  assert {
    condition     = length(aws_subnet.public) == 3
    error_message = "Expected 3 public subnets (one per AZ)"
  }

  assert {
    condition     = length(aws_subnet.private) == 3
    error_message = "Expected 3 private subnets (one per AZ)"
  }

  assert {
    condition     = length(aws_subnet.database) == 3
    error_message = "Expected 3 database subnets (one per AZ)"
  }
}

run "flow_logs_are_configured" {
  command = plan

  assert {
    condition     = aws_flow_log.main.traffic_type == "ALL"
    error_message = "VPC flow logs must capture ALL traffic"
  }
}

run "vpc_endpoints_created" {
  command = plan

  # S3 gateway endpoint should exist
  assert {
    condition     = aws_vpc_endpoint.s3.service_name == "com.amazonaws.us-east-1.s3"
    error_message = "S3 VPC endpoint should target the correct region"
  }

  # ECR interface endpoints should exist
  assert {
    condition     = aws_vpc_endpoint.ecr_api.private_dns_enabled == true
    error_message = "ECR API endpoint must have private DNS enabled"
  }
}

run "nat_gateway_disabled_when_false" {
  command = plan

  # With enable_nat_gateway = false, no NAT resources should be planned
  assert {
    condition     = length(aws_eip.nat) == 0
    error_message = "No EIP should be created when NAT gateway is disabled"
  }

  assert {
    condition     = length(aws_nat_gateway.main) == 0
    error_message = "No NAT gateway should be created when disabled"
  }
}
