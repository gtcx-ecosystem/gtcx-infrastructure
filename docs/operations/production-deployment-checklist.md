---
title: 'Production Deployment Checklist'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Production Deployment Checklist

**Environment:** `gtcx-production` (af-south-1)  
**Terraform Plan:** 86 resources  
**Estimated Cost:** $520–$850/month (baseline), $1,000/month (recommended budget)  
**Last Updated:** 2026-05-13

---

## Pre-Flight (Before Any Apply)

### 1. Approval & Budget

- [ ] **Leadership approval ticket** created and assigned
- [ ] **Cost estimate reviewed** by finance (`docs/compliance/production-cost-estimate-2026-05.md`)
- [ ] **Monthly budget allocated** ($1,000/mo recommended)
- [ ] **Scaling triggers documented** (when to review budget: >$1,200/mo, >$1,500/mo)
- [ ] **Emergency contact list** updated (CTO, CFO, Platform Lead)

### 2. Terraform State Validation

- [ ] Backend bucket exists: `gtcx-terraform-state-production` (us-east-1)
- [ ] Lock table exists: `gtcx-terraform-locks-production` (us-east-1)
- [ ] `terraform init` successful (no backend errors)
- [ ] `terraform validate` passes (0 errors)
- [ ] `terraform plan` generated and saved: `terraform plan -out=production.tfplan`
- [ ] Plan reviewed by second person (required by `main.tf` line 9)
- [ ] No unexpected deletions in plan output

### 3. AWS Account & Credentials

- [ ] AWS account: `348389439381`
- [ ] Region: `af-south-1` (Cape Town)
- [ ] IAM user/role has `AdministratorAccess` or equivalent
- [ ] MFA enabled on root account
- [ ] AWS CloudTrail enabled and logging to WORM storage

### 4. Domain & Certificates

- [ ] Domain `gtcx.trade` registered and DNS managed
- [ ] ACM certificate requested for `*.gtcx.trade` (af-south-1)
- [ ] Certificate validation completed (DNS or email)

---

## Resource-by-Resource Checklist

### VPC & Networking

- [ ] VPC CIDR: `10.4.0.0/16` (no overlap with staging `10.3.0.0/16`)
- [ ] 3 public subnets across 3 AZs
- [ ] 3 private subnets across 3 AZs
- [ ] 3 database subnets across 3 AZs
- [ ] NAT Gateway deployed in single AZ (cost optimization) or 3 AZs (HA)
- [ ] Internet Gateway attached
- [ ] Route tables correctly associated
- [ ] VPC Flow Logs enabled (ALL traffic, 365d retention)

### EKS Cluster

- [ ] Cluster name: `gtcx-production`
- [ ] Kubernetes version: 1.31
- [ ] **Public endpoint: DISABLED** (`enable_public_access = false`)
- [ ] Private endpoint: ENABLED
- [ ] Control plane logs: api, audit, authenticator, controllerManager, scheduler
- [ ] Node group: `gtcx-production-nodes`
- [ ] Instance type: `t3.medium`
- [ ] Desired: 3, Min: 3, Max: 6
- [ ] Disk: 50GB gp3 per node
- [ ] Labels: `environment=production`, `project=gtcx`
- [ ] Cluster encryption: KMS key `alias/gtcx-production-eks-secrets`

### RDS Databases

- [ ] Operational DB: `gtcx-production-operational`
  - [ ] Instance: `db.t3.medium`
  - [ ] Storage: 100GB gp3, encrypted
  - [ ] Engine: PostgreSQL 16.6
  - [ ] Multi-AZ: **NO** (enable post-launch for +$50/mo)
  - [ ] Backup retention: 30 days
  - [ ] Deletion protection: ENABLED
  - [ ] Parameter group: `log_connections=1`, `rds.force_ssl=1`

- [ ] Audit DB: `gtcx-production-audit`
  - [ ] Instance: `db.t3.medium`
  - [ ] Storage: 200GB gp3, encrypted
  - [ ] Engine: PostgreSQL 16.6
  - [ ] Multi-AZ: **YES** (compliance requirement)
  - [ ] Backup retention: 35 days
  - [ ] Deletion protection: ENABLED
  - [ ] Performance Insights: 31-day retention
  - [ ] Parameter group: `log_statement=all`

### WAF & Security

- [ ] WAF Web ACL: `gtcx-production-waf-af-south-1`
- [ ] Scope: REGIONAL
- [ ] Rate limit: 5,000 requests/5min
- [ ] OWASP Core Rule Set: ENABLED
- [ ] AWSManagedRulesKnownBadInputsRuleSet: ENABLED
- [ ] Custom rules for GTCX protocol validation: DOCUMENTED

### CI/CD

- [ ] Shared deploy role: `gtcx-production-shared-deploy`
- [ ] Trust policy: `repo:gtcx-ecosystem/*:ref:refs/heads/main`
- [ ] OIDC provider: `token.actions.githubusercontent.com` (reuse staging provider)
- [ ] ECR permissions: `arn:aws:ecr:*:348389439381:repository/gtcx-*`
- [ ] EKS permissions: `arn:aws:eks:*:348389439381:cluster/gtcx-*`

### WORM Audit Storage

- [ ] S3 bucket: `gtcx-worm-audit-production-af-south-1`
- [ ] Object Lock: COMPLIANCE mode
- [ ] Default retention: 2,557 days (7 years)
- [ ] KMS encryption: Customer-managed key with rotation
- [ ] Public access: BLOCKED (all 4 settings)
- [ ] Bucket policy: Deny unencrypted uploads + deny non-SSL
- [ ] Cross-region replication: ENABLED to `us-east-1`
- [ ] Replication destination: `gtcx-worm-audit-production-replica-us-east-1`

---

## Post-Apply Verification

### Immediate (0–30 minutes)

- [ ] `terraform apply` completes with 0 errors
- [ ] State file written to S3 backend successfully
- [ ] DynamoDB lock released
- [ ] All 86 resources show `CREATE_COMPLETE` (or equivalent)

### EKS Verification (30–60 minutes)

- [ ] Nodes register: `kubectl get nodes` shows 3 Ready nodes
- [ ] CoreDNS pods running: `kubectl get pods -n kube-system`
- [ ] kube-proxy pods running
- [ ] AWS node daemonset running
- [ ] Cluster autoscaler deployed and functional (scale test)

### RDS Verification (15–60 minutes)

- [ ] Operational DB: `Available` status in RDS console
- [ ] Audit DB: `Available` status in RDS console
- [ ] Connect from bastion: `psql -h <endpoint> -U gtcx_admin -d gtcx_production`
- [ ] SSL enforced: `SHOW ssl;` returns `on`
- [ ] Backup automated: Verify backup window `03:00-04:00`

### WAF Verification (15 minutes)

- [ ] Web ACL associated with ALB or API Gateway
- [ ] Test rule: Send 5,001 requests in 5 minutes → expect block
- [ ] CloudWatch metric: `BlockedRequests` > 0 after test

### WORM Verification (15 minutes)

- [ ] Upload test object with Object Lock
- [ ] Verify retention: `aws s3api get-object-retention`
- [ ] Attempt deletion → expect `AccessDenied`
- [ ] Verify replication: Check replica bucket in `us-east-1`

### CI Verification (15 minutes)

- [ ] GitHub Actions workflow can assume `gtcx-production-shared-deploy`
- [ ] ECR push test: `docker push` to `gtcx-test-image`
- [ ] EKS access test: `kubectl get pods` from CI workflow

---

## Rollback Plan

If any verification fails:

1. **Stop** — Do not proceed to next resource group
2. **Document** — Capture `terraform show`, CloudWatch logs, error messages
3. **Assess** — Is the failure isolated or systemic?
4. **Decide**:
   - **Isolated failure:** Fix via targeted `terraform apply -target=...`
   - **Systemic failure:** Consider `terraform destroy` and re-apply from clean state
5. **Communicate** — Notify #gtcx-platform and CTO within 15 minutes

### Emergency Destroy

```bash
cd infra/terraform/environments/production
terraform destroy -auto-approve
```

---

## Post-Deployment (First Week)

- [ ] Enable AWS Cost Explorer tags (`Project=gtcx`, `Environment=production`)
- [ ] Set up AWS Budgets alert at $1,000/month (80% of recommended)
- [ ] Verify anomaly detector CronJob schedules in production namespace
- [ ] Deploy Prometheus + Grafana to `gtcx-monitoring` namespace
- [ ] Configure PagerDuty integration for production alerts
- [ ] Run first on-call drill with production environment
- [ ] Schedule weekly cost review (Fridays, 10:00 CAT)

---

## Sign-Off

| Role                      | Name | Date | Signature |
| ------------------------- | ---- | ---- | --------- |
| Platform Engineering Lead |      |      |           |
| CTO                       |      |      |           |
| CFO (Budget Approval)     |      |      |           |
| CISO (Security Review)    |      |      |           |

---

_Checklist version: 1.0_  
_Next review: Post-deployment (2026-05-20)_
