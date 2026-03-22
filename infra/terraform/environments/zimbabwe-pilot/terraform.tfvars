# =============================================================================
# Zimbabwe Pilot — ZWCMP Deployment
# =============================================================================
# 200+ licensed female mine operators. Critical minerals.
# af-south-1 (Cape Town) — closest AWS region (~30ms from Harare).
# =============================================================================

environment        = "zimbabwe-pilot"
region             = "af-south-1"
availability_zones = ["af-south-1a", "af-south-1b", "af-south-1c"]

# Network
vpc_cidr = "10.1.0.0/16"

# Database — start with t3.medium, scale to r6g.large for production
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100

# EKS — pilot config (single node, scale up for production)
eks_node_instance_types = ["t3.medium"]
eks_node_desired_size   = 1
eks_node_min_size       = 1
eks_node_max_size       = 5

# API access — enabled for initial deployment; restrict post-deploy
enable_public_api = true
admin_cidr_blocks = ["0.0.0.0/0"] # open during active development — restrict before production go-live

tags = {
  Deployment = "ZWCMP"
  Country    = "Zimbabwe"
  CostCenter = "gtcx-zwcmp-pilot"
}
