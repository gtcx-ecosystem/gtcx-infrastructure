---
title: 'GTCX Production Environment — Monthly Cost Estimate'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Production Environment — Monthly Cost Estimate

**Date:** 2026-05-13
**Environment:** `gtcx-production` (af-south-1)
**Terraform Plan:** 86 resources
**Prepared by:** Platform Engineering
**Status:** Awaiting leadership approval

---

## Executive Summary

| Scenario                                |  Monthly Cost (USD) |     Annual Cost (USD) |
| --------------------------------------- | ------------------: | --------------------: |
| **Minimum (3 nodes, baseline traffic)** |     **$520 – $680** |   **$6,240 – $8,160** |
| **Nominal (4 nodes, moderate traffic)** |     **$780 – $980** |  **$9,360 – $11,760** |
| **Maximum (6 nodes, peak traffic)**     | **$1,200 – $1,500** | **$14,400 – $18,000** |

---

## Cost Breakdown by Service

### 1. Amazon EKS (Compute)

| Component         | Spec                     | Unit Price (af-south-1) |      Min |      Max |
| ----------------- | ------------------------ | ----------------------: | -------: | -------: |
| EKS Control Plane | 1 cluster                |               ~$0.10/hr |      $73 |      $73 |
| Worker Nodes      | 3× t3.medium (on-demand) |        ~$0.0416/hr each |      $91 |     $182 |
| EBS (node root)   | 50GB gp3 × 3 nodes       |           ~$0.092/GB-mo |      $14 |      $28 |
| **EKS Subtotal**  |                          |                         | **$178** | **$283** |

**Scaling behavior:**

- Minimum: 3 nodes (baseline)
- Nominal: 4 nodes (moderate load)
- Maximum: 6 nodes (peak / HPA-triggered)
- t3.medium: 2 vCPU, 4GB RAM each

---

### 2. Amazon RDS (PostgreSQL)

| Component             | Spec                              |               Unit Price |      Min |      Max |
| --------------------- | --------------------------------- | -----------------------: | -------: | -------: |
| Operational DB        | db.t3.medium, 100GB gp3           |     ~$0.068/hr + storage |      $50 |      $50 |
| Audit DB              | db.t3.medium, 200GB gp3, Multi-AZ | ~$0.068/hr × 2 + storage |      $99 |      $99 |
| Storage (operational) | 100GB gp3                         |            ~$0.115/GB-mo |      $12 |      $24 |
| Storage (audit)       | 200GB gp3                         |            ~$0.115/GB-mo |      $23 |      $46 |
| Backup storage        | 30-day retention, incremental     |            ~$0.095/GB-mo |      $10 |      $20 |
| Performance Insights  | 7d retention (op), 31d (audit)    |     Included in instance |       $0 |       $0 |
| **RDS Subtotal**      |                                   |                          | **$194** | **$239** |

**Notes:**

- Audit DB runs Multi-AZ for compliance (standby in second AZ)
- Operational DB can enable Multi-AZ post-launch for ~$50/mo additional
- Storage auto-scales to max 200GB (operational) / 400GB (audit)

---

### 3. Networking (VPC + Load Balancers)

| Component                  | Spec                        |        Unit Price |     Min |      Max |
| -------------------------- | --------------------------- | ----------------: | ------: | -------: |
| NAT Gateway                | 1× (3 AZ HA via single NAT) |        ~$0.045/hr |     $33 |      $33 |
| NAT Data Processing        | ~500GB/mo egress            |        ~$0.045/GB |     $23 |      $45 |
| Application Load Balancer  | 1× ALB for EKS ingress      | ~$0.0225/hr + LCU |     $16 |      $35 |
| VPC Flow Logs (CloudWatch) | ALL traffic, 365d retention |  ~$0.50/GB ingest |     $15 |      $40 |
| Data Transfer (cross-AZ)   | Minimal (pods same AZ)      |         ~$0.01/GB |      $5 |      $15 |
| **Networking Subtotal**    |                             |                   | **$92** | **$168** |

---

### 4. AWS WAF

| Component           | Spec                       |      Unit Price |     Min |     Max |
| ------------------- | -------------------------- | --------------: | ------: | ------: |
| Web ACL Base        | 1 regional ACL             | $5/mo + $1/rule |     $10 |     $10 |
| Request Inspection  | ~10M requests/mo           |  ~$0.60/million |      $6 |     $30 |
| Managed Rules (AWS) | OWASP CRS + KnownBadInputs |  ~$1/rule/month |      $5 |      $5 |
| **WAF Subtotal**    |                            |                 | **$21** | **$45** |

---

### 5. S3 WORM Audit Storage

| Component                      | Spec                   |          Unit Price |    Min |     Max |
| ------------------------------ | ---------------------- | ------------------: | -----: | ------: |
| Primary Storage (af-south-1)   | ~50GB/mo growth        |       ~$0.023/GB-mo |     $1 |      $3 |
| Replication (us-east-1)        | ~50GB/mo transferred   |  ~$0.02/GB transfer |     $1 |      $2 |
| Replicated Storage (us-east-1) | ~50GB                  |       ~$0.023/GB-mo |     $1 |      $2 |
| S3 API Requests                | ~1M PUT, ~100K GET/mo  | ~$0.005/1K requests |     $5 |     $10 |
| KMS Key                        | 1 customer-managed key |          ~$1/key-mo |     $1 |      $1 |
| **S3 WORM Subtotal**           |                        |                     | **$9** | **$18** |

---

### 6. CloudWatch + Observability

| Component                  | Spec                        |             Unit Price |     Min |     Max |
| -------------------------- | --------------------------- | ---------------------: | ------: | ------: |
| EKS Control Plane Logs     | API, audit, auth, scheduler |       ~$0.50/GB ingest |     $20 |     $50 |
| Container Insights         | Metrics collection          | ~$0.01/pod-hr (approx) |     $15 |     $30 |
| Custom Metrics             | Anomaly detector, SLOs      |          ~$0.30/metric |      $5 |     $10 |
| **Observability Subtotal** |                             |                        | **$40** | **$90** |

---

### 7. Security & Compliance

| Component                  | Spec                    |       Unit Price | Monthly |
| -------------------------- | ----------------------- | ---------------: | ------: |
| KMS (EKS secrets)          | 1 key, rotation enabled |       ~$1/key-mo |      $1 |
| KMS (RDS encryption)       | 2 keys (op + audit)     |       ~$1/key-mo |      $2 |
| KMS (WORM audit)           | 1 key                   |       ~$1/key-mo |      $1 |
| Secrets Manager (optional) | RDS master password     | ~$0.40/secret-mo |      $1 |
| **Security Subtotal**      |                         |                  |  **$5** |

---

## Total Monthly Cost

| Category        |  Minimum |  Nominal |  Maximum |
| --------------- | -------: | -------: | -------: |
| EKS (Compute)   |     $178 |     $230 |     $283 |
| RDS (Database)  |     $194 |     $217 |     $239 |
| Networking      |      $92 |     $130 |     $168 |
| WAF (Security)  |      $21 |      $33 |      $45 |
| S3 WORM (Audit) |       $9 |      $14 |      $18 |
| Observability   |      $40 |      $65 |      $90 |
| Security (KMS)  |       $5 |       $5 |       $5 |
| **Total**       | **$539** | **$694** | **$848** |

The original estimate of **$1,200–1,800/month** was conservative and included:

- Higher traffic assumptions (100M+ requests/mo)
- Additional redundancy (Multi-AZ on operational DB)
- Reserve capacity for GPU nodes (ML training)
- Data transfer spikes during cross-region replication

---

## Cost Optimization Opportunities

| Opportunity                                            | Savings | Effort | Risk                       |
| ------------------------------------------------------ | ------: | -----: | -------------------------- |
| Reserved Instances (1yr) for RDS                       |    ~30% |    Low | Commitment required        |
| Savings Plans for EC2/EKS nodes                        | ~20–30% |    Low | Commitment required        |
| Spot instances for non-critical workloads              | ~50–70% | Medium | Interruption risk          |
| Right-size t3.medium → t3.small for dev                |    ~40% |    Low | Performance testing needed |
| CloudWatch Logs retention tuning (90d → 30d non-audit) |    ~20% |    Low | Compliance review          |

---

## Approval Recommendation

**Recommended budget request:** **$1,000/month** (nominal + 30% buffer)

This covers:

- 3–4 t3.medium nodes continuously
- db.t3.medium Multi-AZ audit + single AZ operational
- Standard traffic (Zimbabwe pilot scale)
- Full observability and compliance logging
- Cross-region WORM replication

**Scaling triggers for budget review:**

- > $1,200/mo: Scale to 5+ nodes or enable operational Multi-AZ
- > $1,500/mo: Launch second jurisdiction or enable GPU nodes
- > $2,000/mo: Full production traffic (10,000+ DAU)

---

## Terraform Evidence

```
Plan: 86 to add, 0 to change, 0 to destroy.
Backend: s3://gtcx-terraform-state-production
Region: af-south-1
```

**Apply command (requires approval):**

```bash
cd 04-ship/terraform/environments/production
terraform plan -out=production.tfplan
terraform apply production.tfplan
```

---

_Document version: 1.0_
_Next review: Post-apply (verify actual costs via AWS Cost Explorer)_
