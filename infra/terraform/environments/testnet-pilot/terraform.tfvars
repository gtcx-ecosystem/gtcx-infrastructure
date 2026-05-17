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

# API access — Cloudflare Tunnel handles all service traffic.
# EKS public API endpoint is DISABLED. Operators must use AWS Systems Manager
# Session Manager or a bastion host for kubectl access.
# If emergency public access is needed, use AWS CLI (not committed):
#   aws eks update-cluster-config --name gtcx-testnet-pilot \
#     --resources-vpc-config publicAccessCidrs=<OPERATOR_IP>/32
enable_public_api = false
admin_cidr_blocks = []

# Domain — ACM certificate for HTTPS
domain_name = "gtcx.trade"

tags = {
  Deployment = "TESTNET"
  CostCenter = "gtcx-testnet-pilot"
  Purpose    = "tenant-evaluation"
}
