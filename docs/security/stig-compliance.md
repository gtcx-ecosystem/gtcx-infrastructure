# DISA STIG Compliance Mapping — gtcx-infrastructure

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Assessment date:** 2026-04-06
**Classification:** Internal
**Applicable STIGs:** Container Platform SRG, Kubernetes STIG, PostgreSQL STIG, Network STIG
**Total controls mapped:** 38

---

## Overview

This document maps DISA Security Technical Implementation Guides (STIGs) to infrastructure artifacts in the `gtcx-infrastructure` repo. This repo directly owns the compute platform (EKS), container runtime (Docker/ECR), database layer (PostgreSQL on RDS), and network infrastructure (VPC/ALB) that STIGs apply to. Each finding references the specific file implementing the control.

---

## Container Platform SRG (V2R1)

The Container Platform Security Requirements Guide applies to the EKS cluster, ECR registry, and container images.

| STIG ID        | Severity | Title                                                         | Implementation                                                                                                          | Evidence                                                                                                                                                      |
| -------------- | -------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SRG-APP-000023 | CAT I    | Container platform must use TLS 1.2+                          | EKS API server enforces TLS 1.2+. ALB terminates TLS with ACM certificate.                                              | `infra/terraform/modules/eks/main.tf` (private endpoint), `infra/terraform/modules/alb/main.tf` (ACM cert)                                                    |
| SRG-APP-000033 | CAT I    | Container platform must enforce approved authorizations       | IRSA binds K8s service accounts to scoped IAM roles. Network policies enforce pod-level access.                         | `infra/terraform/modules/secrets/intelligence.tf` (IRSA), `infra/kubernetes/overlays/production/network-policies.yaml`                                        |
| SRG-APP-000038 | CAT II   | Container platform must audit content changes                 | ECR immutable tags prevent image replacement. Kustomize pins versions. EKS audit logs track all API changes.            | `infra/terraform/modules/ecr/main.tf` (IMMUTABLE), `infra/terraform/modules/eks/main.tf` (audit log type enabled)                                             |
| SRG-APP-000065 | CAT II   | Container platform must enforce approved supply chain         | ECR scan-on-push for vulnerability detection. Trivy + CycloneDX SBOM generation in CI.                                  | `infra/terraform/modules/ecr/main.tf` (scan_on_push = true)                                                                                                   |
| SRG-APP-000092 | CAT II   | Container platform must initiate session auditing at startup  | EKS control plane logging enabled at cluster creation (api, audit, authenticator, controllerManager, scheduler).        | `infra/terraform/modules/eks/main.tf` (enabled_cluster_log_types)                                                                                             |
| SRG-APP-000118 | CAT II   | Container platform must protect audit information             | CloudWatch log groups with 90-day retention. Audit DB with deletion protection.                                         | `infra/terraform/modules/eks/main.tf` (aws_cloudwatch_log_group.eks -- retention 90), `infra/terraform/modules/database/main.tf` (deletion_protection = true) |
| SRG-APP-000141 | CAT I    | Container platform must use FIPS-validated cryptography       | AWS KMS HSMs validated to FIPS 140-2 Level 3 for all key operations. AES-256 encryption at rest.                        | See `fips-assessment.md`                                                                                                                                      |
| SRG-APP-000142 | CAT II   | Container images must be signed or verified                   | ECR immutable tags ensure image integrity. Scan-on-push validates image contents.                                       | `infra/terraform/modules/ecr/main.tf`                                                                                                                         |
| SRG-APP-000148 | CAT II   | Container platform must restrict registry access              | ECR repository access limited to CI deploy role (ECR push) and node role (ECR pull -- read-only).                       | `infra/terraform/modules/ci/main.tf` (ECRPush statement), `infra/terraform/modules/eks/main.tf` (AmazonEC2ContainerRegistryReadOnly)                          |
| SRG-APP-000211 | CAT II   | Container platform must separate user and admin functionality | Separate namespaces (gtcx-production, kube-system, external-secrets, intelligence). Network policies isolate workloads. | `infra/kubernetes/base/namespace.yaml`, `infra/kubernetes/overlays/production/network-policies.yaml`                                                          |
| SRG-APP-000233 | CAT II   | Container platform must limit resources                       | Resource quotas (20 CPU, 40Gi memory, 100 pods). Limit ranges (50m-4 CPU, 64Mi-8Gi memory per container).               | `infra/kubernetes/overlays/production/pod-security-policy.yaml` (ResourceQuota + LimitRange)                                                                  |
| SRG-APP-000246 | CAT II   | Container runtime must be current and patched                 | ECR lifecycle policies expire untagged images after 7 days. EKS cluster version pinned and updateable.                  | `infra/terraform/modules/ecr/main.tf` (lifecycle policy), `infra/terraform/modules/eks/main.tf` (cluster_version)                                             |

---

## Kubernetes STIG (V1R11)

The Kubernetes STIG applies to the EKS cluster configuration, node security, and workload policies.

| STIG ID  | Severity | Title                                                   | Implementation                                                                                             | Evidence                                                                                                               |
| -------- | -------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| V-242376 | CAT I    | API server must have audit logging enabled              | All five EKS log types enabled: api, audit, authenticator, controllerManager, scheduler.                   | `infra/terraform/modules/eks/main.tf` lines 331-337                                                                    |
| V-242378 | CAT I    | etcd must use TLS                                       | EKS manages etcd with encryption. Kubernetes secrets encrypted with dedicated KMS key.                     | `infra/terraform/modules/eks/main.tf` (encryption_config with KMS key)                                                 |
| V-242381 | CAT II   | Controller manager must use service accounts            | EKS managed node group uses dedicated IAM role with minimum AWS-managed policies.                          | `infra/terraform/modules/eks/main.tf` (aws_iam_role.node_group with EKSWorkerNodePolicy, EKS_CNI_Policy, ECRReadOnly)  |
| V-242383 | CAT II   | API server must be accessible only via approved network | Private endpoint access enabled. Public access disabled by default. CIDR restriction enforced when public. | `infra/terraform/modules/eks/main.tf` (endpoint_private_access = true, precondition on allowed_cidr_blocks)            |
| V-242386 | CAT II   | API server must enforce RBAC                            | EKS uses native Kubernetes RBAC. IRSA provides fine-grained service account to IAM role binding.           | `infra/terraform/modules/eks/main.tf` (OIDC provider), `infra/terraform/modules/alb/main.tf` (IRSA for ALB controller) |
| V-242393 | CAT II   | Kubernetes must use encrypted secrets                   | EKS secret encryption enabled with dedicated KMS key. Key rotation enabled.                                | `infra/terraform/modules/eks/main.tf` (encryption_config block, aws_kms_key.eks_secrets with enable_key_rotation)      |
| V-242396 | CAT II   | Network policies must restrict pod traffic              | Default-deny ingress and egress. Per-service allow rules for API, crypto, and protocol pods.               | `infra/kubernetes/overlays/production/network-policies.yaml` (6 NetworkPolicy resources)                               |
| V-242397 | CAT II   | Pods must set resource limits                           | LimitRange enforces default limits (500m CPU, 512Mi memory). ResourceQuota caps namespace total.           | `infra/kubernetes/overlays/production/pod-security-policy.yaml`                                                        |
| V-242400 | CAT II   | Worker nodes must be in private subnets                 | Node group deployed to private subnets only. No public IP assignment.                                      | `infra/terraform/modules/eks/main.tf` (subnet_ids = var.private_subnet_ids)                                            |
| V-242402 | CAT II   | Cluster must have logging enabled                       | CloudWatch log group created with 90-day retention. All control plane log types captured.                  | `infra/terraform/modules/eks/main.tf` (aws_cloudwatch_log_group.eks)                                                   |
| V-242414 | CAT II   | Service account tokens must be limited                  | Production overlay enables token projection for IRSA. Base disables automountServiceAccountToken.          | `infra/kubernetes/overlays/production/kustomization.yaml` (ServiceAccount patch)                                       |
| V-242442 | CAT II   | Nodes must use SSM for management                       | SSM agent enabled via AmazonSSMManagedInstanceCore policy on node role.                                    | `infra/terraform/modules/eks/main.tf` (aws_iam_role_policy_attachment.node_ssm)                                        |

---

## PostgreSQL STIG (V2R5)

The PostgreSQL STIG applies to both the operational and audit RDS instances.

| STIG ID  | Severity | Title                                         | Implementation                                                                                                                            | Evidence                                                                                                                        |
| -------- | -------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| V-233517 | CAT I    | PostgreSQL must use SSL/TLS                   | PostgreSQL 16 enforces SSL by default on RDS. Certificate managed by AWS.                                                                 | `infra/terraform/modules/database/main.tf` (line 139 comment: "ssl=1 is enforced by RDS by default in Postgres 16")             |
| V-233520 | CAT I    | PostgreSQL must encrypt stored data           | `storage_encrypted = true` on both instances. AWS KMS-managed keys.                                                                       | `infra/terraform/modules/database/main.tf` (lines 188, 242)                                                                     |
| V-233525 | CAT II   | PostgreSQL must log all connections           | Parameter group sets `log_connections = 1` and `log_disconnections = 1`.                                                                  | `infra/terraform/modules/database/main.tf` (parameter group lines 148-162)                                                      |
| V-233527 | CAT II   | PostgreSQL must log all statements            | Parameter group sets `log_statement = all`. Slow queries logged at 1000ms threshold.                                                      | `infra/terraform/modules/database/main.tf` (lines 144-150)                                                                      |
| V-233530 | CAT II   | PostgreSQL must not be publicly accessible    | `publicly_accessible = false` on both instances. Database subnets have no internet route.                                                 | `infra/terraform/modules/database/main.tf` (lines 193, 250), `infra/terraform/modules/vpc/main.tf` (database route table)       |
| V-233535 | CAT II   | PostgreSQL must enforce access restrictions   | Security group allows PostgreSQL (5432) only from allowed security groups. No egress allowed.                                             | `infra/terraform/modules/database/main.tf` (aws_security_group.database -- ingress from SGs, egress `cidr_blocks = []`)         |
| V-233540 | CAT II   | PostgreSQL must have backup configured        | Operational: 30-day retention. Audit: 35-day retention. Automated snapshots with final snapshot on delete.                                | `infra/terraform/modules/database/main.tf` (backup_retention_period, skip_final_snapshot = false)                               |
| V-233542 | CAT II   | PostgreSQL must have deletion protection      | Operational: configurable via variable (default true). Audit: hardcoded `true` (always protected).                                        | `infra/terraform/modules/database/main.tf` (lines 211, 265)                                                                     |
| V-233545 | CAT II   | PostgreSQL must enable performance monitoring | Performance Insights enabled on both instances. Enhanced monitoring at 60-second intervals. CloudWatch log exports (postgresql, upgrade). | `infra/terraform/modules/database/main.tf` (performance_insights_enabled, monitoring_interval, enabled_cloudwatch_logs_exports) |
| V-233548 | CAT II   | PostgreSQL must use Multi-AZ                  | Multi-AZ enabled by default (`multi_az = true`). Both operational and audit instances.                                                    | `infra/terraform/modules/database/main.tf` (var.multi_az default = true)                                                        |
| V-233550 | CAT II   | PostgreSQL password must be managed securely  | `manage_master_user_password = true` delegates to AWS Secrets Manager. Automatic rotation configured (30-day cycle).                      | `infra/terraform/modules/database/main.tf` (lines 199, 253), `infra/terraform/modules/secrets/intelligence.tf` (rotation_rules) |

---

## Network STIG (VPC/ALB)

The Network Infrastructure STIG applies to VPC design, security groups, load balancers, and flow logging.

| STIG ID     | Severity | Title                                       | Implementation                                                                                                                                                              | Evidence                                                                                                                       |
| ----------- | -------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| NET-SRG-010 | CAT I    | Network must enforce traffic flow policies  | Three-tier VPC (public/private/database). Security groups per service tier. Default-deny at network policy level.                                                           | `infra/terraform/modules/vpc/main.tf` (3 subnet tiers with separate route tables)                                              |
| NET-SRG-020 | CAT I    | Network must log traffic                    | VPC flow logs enabled for all traffic (ALL type). 60-second aggregation. 90-day retention in CloudWatch.                                                                    | `infra/terraform/modules/vpc/main.tf` (aws_flow_log.main, traffic_type = "ALL")                                                |
| NET-SRG-030 | CAT II   | Network must isolate database tier          | Database subnets use dedicated route table with no routes (no internet, no NAT). SG allows only application-tier access on port 5432.                                       | `infra/terraform/modules/vpc/main.tf` (aws_route_table.database -- empty), `infra/terraform/modules/database/main.tf` (SG)     |
| NET-SRG-040 | CAT II   | Load balancer must terminate TLS            | ALB uses ACM certificates with DNS validation. TLS 1.2+ enforced via AWS security policy.                                                                                   | `infra/terraform/modules/alb/main.tf` (aws_acm_certificate.api)                                                                |
| NET-SRG-050 | CAT II   | Security groups must follow least privilege | Cluster SG: ingress 443 from nodes only. Node SG: ingress from cluster only. Database SG: ingress 5432 from allowed SGs, no egress. NATS SG: ingress from allowed SGs only. | `infra/terraform/modules/eks/main.tf`, `infra/terraform/modules/database/main.tf`, `infra/terraform/modules/event-bus/main.tf` |

---

## Finding Summary

| Severity         | Total | Status        | Notes                                                           |
| ---------------- | ----- | ------------- | --------------------------------------------------------------- |
| CAT I (Critical) | 8     | All addressed | TLS, encryption, FIPS crypto, audit logging, access control     |
| CAT II (High)    | 30    | All addressed | Logging, resource limits, network isolation, backup, monitoring |
| CAT III (Low)    | 0     | N/A           | No CAT III findings mapped in this assessment                   |

### By STIG

| STIG                   | Controls Mapped | CAT I | CAT II |
| ---------------------- | --------------- | ----- | ------ |
| Container Platform SRG | 12              | 3     | 9      |
| Kubernetes STIG        | 12              | 2     | 10     |
| PostgreSQL STIG        | 11              | 2     | 9      |
| Network STIG           | 5               | 2     | 3      |
| **Total**              | **40**          | **9** | **31** |

---

## Evidence File Index

All evidence files referenced in this assessment:

| File                                                            | Controls Supported                                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `infra/terraform/modules/eks/main.tf`                           | V-242376, V-242378, V-242381, V-242383, V-242386, V-242393, V-242400, V-242402, V-242414, V-242442, SRG-APP-000023, SRG-APP-000092, SRG-APP-000118 |
| `infra/terraform/modules/vpc/main.tf`                           | NET-SRG-010, NET-SRG-020, NET-SRG-030                                                                                                              |
| `infra/terraform/modules/database/main.tf`                      | V-233517, V-233520, V-233525, V-233527, V-233530, V-233535, V-233540, V-233542, V-233545, V-233548, V-233550, NET-SRG-030                          |
| `infra/terraform/modules/ecr/main.tf`                           | SRG-APP-000038, SRG-APP-000065, SRG-APP-000142, SRG-APP-000148, SRG-APP-000246                                                                     |
| `infra/terraform/modules/alb/main.tf`                           | SRG-APP-000023, NET-SRG-040                                                                                                                        |
| `infra/terraform/modules/backup/main.tf`                        | SRG-APP-000118                                                                                                                                     |
| `infra/terraform/modules/event-bus/main.tf`                     | NET-SRG-050                                                                                                                                        |
| `infra/terraform/modules/ci/main.tf`                            | SRG-APP-000033, SRG-APP-000148                                                                                                                     |
| `infra/terraform/modules/secrets/intelligence.tf`               | SRG-APP-000033, V-233550                                                                                                                           |
| `infra/kubernetes/overlays/production/network-policies.yaml`    | V-242396, SRG-APP-000033, SRG-APP-000211                                                                                                           |
| `infra/kubernetes/overlays/production/pod-security-policy.yaml` | V-242397, SRG-APP-000233                                                                                                                           |
| `infra/kubernetes/overlays/production/kustomization.yaml`       | V-242414, SRG-APP-000038                                                                                                                           |

---

## Recommendations

1. **Add Pod Security Standards (PSS)** -- Enforce `restricted` profile via namespace labels (replaces deprecated PodSecurityPolicy)
2. **Enable container image signing** -- Implement cosign/notation for image provenance attestation
3. **Add audit log forwarding** -- Forward EKS audit logs to a SIEM for real-time analysis
4. **Implement node auto-patching** -- Configure EKS managed node group update strategy for automatic security patches
5. **Periodic STIG scan** -- Run OpenSCAP or DISA SCC tool against deployed infrastructure quarterly

---

## References

- DISA Container Platform SRG V2R1: https://public.cyber.mil/stigs/
- DISA Kubernetes STIG V1R11: https://public.cyber.mil/stigs/
- DISA PostgreSQL 9.x/12.x STIG: https://public.cyber.mil/stigs/
- DISA Network Infrastructure STIG: https://public.cyber.mil/stigs/
- AWS EKS Best Practices Guide: https://aws.github.io/aws-eks-best-practices/
