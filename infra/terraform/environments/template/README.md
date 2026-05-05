# Terraform Environment Template

This directory is the starting point for provisioning a new GTCX environment. Each environment (jurisdiction + stage) gets its own copy of this template with customized variables and backend configuration.

## Purpose

Provides a reproducible, sovereign-by-default infrastructure definition for any new GTCX deployment. Implements the SOVEREIGN (6) and DEPLOYABLE (14) principles by ensuring every environment is isolated and consistent.

## Creating a new environment

1. **Copy this directory**

   ```bash
   cp -r template ghana-pilot
   cd ghana-pilot
   ```

2. **Configure the S3 backend** in `main.tf`

   Replace all `CHANGE-ME` values in the `backend "s3"` block:
   - `bucket` -- unique S3 bucket for Terraform state (e.g., `gtcx-terraform-state-ghana`)
   - `key` -- state file path (e.g., `ghana-pilot/terraform.tfstate`)
   - `region` -- AWS region (e.g., `af-south-1`)
   - `dynamodb_table` -- DynamoDB table for state locking (e.g., `gtcx-terraform-locks-ghana`)

3. **Customize variables** in `terraform.tfvars`

   Copy `terraform.tfvars.example` to `terraform.tfvars` and set:

   | Variable               | Description                            | Example                          |
   | ---------------------- | -------------------------------------- | -------------------------------- |
   | `environment`          | Environment name                       | `ghana-pilot`                    |
   | `region`               | AWS region (choose for data residency) | `af-south-1`                     |
   | `availability_zones`   | AZs for HA                             | `["af-south-1a", "af-south-1b"]` |
   | `vpc_cidr`             | VPC CIDR block                         | `10.0.0.0/16`                    |
   | `db_instance_class`    | RDS instance size                      | `db.t3.medium`                   |
   | `db_allocated_storage` | Storage in GB                          | `100`                            |
   | `enable_multi_az`      | HA for databases                       | `true`                           |
   | `tags`                 | Resource tags                          | `{ Owner = "GTCX" }`             |

4. **Initialize and apply**

   ```bash
   terraform init
   terraform plan -out=plan.tfplan
   terraform apply plan.tfplan
   ```

## What gets created

- VPC with public/private/database subnets across specified AZs
- NAT gateway for private subnet egress
- Two RDS PostgreSQL instances (operational + audit) per ADR-008
- All resources tagged with project, environment, and `ManagedBy=terraform`

## Deployment runbook

See `_sop/2-docs/deployment-runbook.md` for the full deployment process including EKS cluster setup, secret configuration, and service deployment.
