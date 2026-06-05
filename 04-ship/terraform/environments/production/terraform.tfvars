# =============================================================================
# GTCX Production — Variable Overrides
# =============================================================================
# Live environment serving all GTCX protocol traffic.
#
# Estimated monthly cost: ~$1,200-1,800 (t3.medium EKS × 3 + db.t3.medium RDS
# multi-AZ + WAF + Flow Logs + ALB).
#
# DEPLOYMENT CHECKLIST:
#   1. Ensure gtcx-terraform-state-production S3 bucket exists (us-east-1)
#   2. Ensure gtcx-terraform-locks-production DynamoDB table exists
#   3. Verify ACM certificate for *.gtcx.trade in af-south-1
#   4. Confirm admin_cidr_blocks are correct before apply
#   5. Run terraform plan with -out, review every resource
#   6. Require approval ticket: --approval-ticket=PROD-<date>-<initiator>
# =============================================================================

environment        = "production"
region             = "af-south-1"
availability_zones = ["af-south-1a", "af-south-1b", "af-south-1c"]

# Network — separate CIDR from staging (10.3.0.0/16)
vpc_cidr = "10.4.0.0/16"

# Database — multi-AZ, production-grade
# NOTE: Multi-AZ may not be available for all instance classes in af-south-1.
# Verify before apply: aws rds describe-db-engine-versions --engine postgres
#   --query 'DBEngineVersions[0].SupportedEngineModes'
db_instance_class    = "db.t3.medium"
db_allocated_storage = 100

# EKS — 3 nodes minimum for production HA, 6 max for burst
eks_node_instance_types = ["t3.medium"]
eks_node_desired_size   = 3
eks_node_min_size       = 3
eks_node_max_size       = 6

# API access — private cluster, no public endpoint
enable_public_api = false
admin_cidr_blocks = []

# Domain — ACM certificate for HTTPS
domain_name = "gtcx.trade"

tags = {
  Deployment = "PRODUCTION"
  CostCenter = "gtcx-production"
  Purpose    = "live-traffic-settlement-custody"
}
