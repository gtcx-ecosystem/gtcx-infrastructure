# Standalone root for CI terraform validate (module requires aws.secondary alias).
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = "af-south-1"
}

provider "aws" {
  alias  = "secondary"
  region = "eu-west-1"
}

module "multi_region" {
  source = "./.."

  providers = {
    aws.secondary = aws.secondary
  }

  environment                   = "ci-validate"
  domain_name                   = "api.example.com"
  route53_zone_id               = "Z000000000000"
  primary_alb_dns               = "primary.example.com"
  primary_alb_zone_id           = "Z000000000001"
  secondary_alb_dns             = "secondary.example.com"
  secondary_alb_zone_id         = "Z000000000002"
  audit_db_arn                  = "arn:aws:rds:af-south-1:000000000000:db:ci-validate"
  secondary_kms_key_arn         = "arn:aws:kms:eu-west-1:000000000000:key/00000000-0000-0000-0000-000000000001"
  secondary_monitoring_role_arn = "arn:aws:iam::000000000000:role/ci-validate-rds-monitoring"
  primary_backup_bucket_id      = "gtcx-ci-validate-audit-backups"
  primary_backup_bucket_arn     = "arn:aws:s3:::gtcx-ci-validate-audit-backups"
  primary_kms_key_arn           = "arn:aws:kms:af-south-1:000000000000:key/00000000-0000-0000-0000-000000000000"
}
