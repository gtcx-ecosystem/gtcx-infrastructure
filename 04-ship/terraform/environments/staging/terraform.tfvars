# =============================================================================
# GTCX Staging — Variable Overrides
# =============================================================================
# Pre-production environment for integration testing, pen-tests, and
# chaos engineering. Sized between testnet and production.
#
# Estimated monthly cost: ~$350-500 (t3.small EKS × 2 + db.t3.small RDS).
# =============================================================================

environment        = "staging"
region             = "af-south-1"
availability_zones = ["af-south-1a", "af-south-1b", "af-south-1c"]

# Network — separate CIDR from testnet-pilot (10.2.0.0/16) and zimbabwe-pilot (10.1.0.0/16)
vpc_cidr = "10.3.0.0/16"

# Database — small but not minimal; handles realistic test data volumes
db_instance_class    = "db.t3.small"
db_allocated_storage = 50

# EKS — 3 nodes for HA during chaos experiments and pen-tests
# Bumped from t3.small (2Gi) to t3.medium (4Gi) to schedule nats + agx + protocols
# Scaled to 3 on 2026-06-04 to resolve Unschedulable (terminal-os + Litmus capacity)
eks_node_instance_types = ["t3.medium"]
eks_node_desired_size   = 3
eks_node_min_size       = 2
eks_node_max_size       = 4

# API access — public for CI/CD deploys from GitHub Actions.
# Staging is pre-production; 0.0.0.0/0 is acceptable here because
# the EKS API is authenticated via IAM (OIDC trust policy). The
# network-level CIDR restriction is secondary to IAM.
#
# NOTE: AWS EKS limits public_access_cidrs to 40 CIDR blocks.
# GitHub Actions publishes ~3,500+ aggregated IPv4 CIDRs, so a
# complete restriction is impossible without a self-hosted runner.
# The commented block below shows the first 40 aggregated CIDRs
# as an example, but this would randomly block some runners.
#
# TODO(#49-production): Deploy a self-hosted runner inside the VPC
# and restrict admin_cidr_blocks to the runner's egress IP.
enable_public_api = true
admin_cidr_blocks = ["0.0.0.0/0"]

# Example: first 40 aggregated GitHub Actions CIDRs (not exhaustive).
# Do NOT uncomment unless you accept that some runners will be blocked.
# admin_cidr_blocks = [
#   "4.148.0.0/14", "4.152.0.0/14", "4.156.0.0/15", "4.172.0.0/14",
#   "4.180.0.0/16", "4.204.0.0/14", "4.208.0.0/15", "4.210.0.0/16",
#   "4.227.0.0/16", "4.229.0.0/16", "4.231.0.0/16", "4.236.0.0/16",
#   "4.239.0.0/16", "4.242.0.0/16", "4.245.0.0/16", "4.246.0.0/16",
#   "4.248.0.0/15", "4.255.0.0/16", "9.163.0.0/16", "9.169.0.0/16",
#   "9.234.0.0/16", "13.64.0.0/15", "13.66.0.0/16", "13.67.128.0/20",
#   "13.67.144.0/21", "13.67.152.0/24", "13.67.153.0/28", "13.67.153.32/27",
#   "13.67.153.64/26", "13.67.153.128/25", "13.67.155.0/24", "13.67.156.0/22",
#   "13.67.160.0/19", "13.67.192.0/18", "13.68.0.0/15", "13.70.192.0/18",
#   "13.71.160.0/19", "13.71.192.0/18", "13.72.64.0/18", "13.73.32.0/19",
# ]

# Domain — ACM certificate for HTTPS
# Staging uses staging.gtcx.trade so the cert covers *.staging.gtcx.trade
domain_name = "staging.gtcx.trade"

tags = {
  Deployment = "STAGING"
  CostCenter = "gtcx-staging"
  Purpose    = "integration-testing-pen-test-chaos"
}
