# =============================================================================
# GTCX Testnet Pilot — Variable Overrides
# =============================================================================
# Sized for evaluation by bank and government tenants, not production traffic.
# Estimated monthly cost: ~$150-250 (t3.small EKS + db.t3.micro RDS).
# =============================================================================

environment        = "testnet-pilot"
region             = "af-south-1"
availability_zones = ["af-south-1a", "af-south-1b", "af-south-1c"]

# Network — separate CIDR from zimbabwe-pilot (10.1.0.0/16)
vpc_cidr = "10.2.0.0/16"

# Database — minimal for evaluation workloads
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# EKS — single small node, scale up if evaluation load requires
eks_node_instance_types = ["t3.small"]
eks_node_desired_size   = 1
eks_node_min_size       = 1
eks_node_max_size       = 3

# API access — restricted to operator IP
# Update admin_cidr_blocks when your IP changes
enable_public_api = true
admin_cidr_blocks = ["196.50.223.130/32"]

# Domain — ACM certificate for HTTPS
domain_name = "gtcxprotocol.org"

tags = {
  Deployment = "TESTNET"
  CostCenter = "gtcx-testnet-pilot"
  Purpose    = "tenant-evaluation"
}
