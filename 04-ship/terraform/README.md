# `04-ship/terraform/`

Infrastructure-as-code for GTCX AWS resources.

## Structure

| Directory                     | Purpose                                             |
| ----------------------------- | --------------------------------------------------- |
| `environments/staging/`       | Staging environment (EKS, RDS, WAF, ALB)            |
| `environments/production/`    | Production environment                              |
| `environments/testnet-pilot/` | Testnet pilot environment                           |
| `modules/`                    | Reusable modules: VPC, EKS, WAF, ALB, database, KMS |

## Key modules

| Module                   | Resources                                      |
| ------------------------ | ---------------------------------------------- |
| `vpc/`                   | VPC, subnets, NAT, IGW                         |
| `eks/`                   | EKS cluster, node groups, IRSA                 |
| `waf/`                   | WAFv2 WebACL, rate limiting, bot control       |
| `alb/`                   | ALB controller IAM, ingress support            |
| `database/`              | RDS PostgreSQL, security groups                |
| `kms-sovereign-signing/` | KMS keys for sovereign authority DIDs (INF-86) |

## Usage

```bash
cd 04-ship/terraform/environments/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply
```

## Agent note

Run `terraform validate` before committing. Never commit `.tfstate` files.
All modules support `for_each` for multi-authority deployments.
