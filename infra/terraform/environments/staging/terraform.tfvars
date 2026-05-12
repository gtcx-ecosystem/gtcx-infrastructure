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

# EKS — 2 nodes for HA during chaos experiments and pen-tests
eks_node_instance_types = ["t3.small"]
eks_node_desired_size   = 2
eks_node_min_size       = 2
eks_node_max_size       = 4

# API access — private only for staging security
enable_public_api = false
admin_cidr_blocks = []

# Domain — ACM certificate for HTTPS
domain_name = "gtcx.trade"

tags = {
  Deployment = "STAGING"
  CostCenter = "gtcx-staging"
  Purpose    = "integration-testing-pen-test-chaos"
}
