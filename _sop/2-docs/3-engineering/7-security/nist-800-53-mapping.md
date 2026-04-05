# NIST 800-53 Rev 5 Control Mapping — gtcx-infrastructure

**Assessment date:** 2026-04-06
**Framework:** NIST SP 800-53 Revision 5
**Baseline:** Moderate
**Classification:** Internal
**Total controls mapped:** 48

---

## Overview

This document maps NIST 800-53 Rev 5 controls to infrastructure artifacts in the `gtcx-infrastructure` repo. This repo owns the largest surface area of security controls in the GTCX ecosystem: network isolation, compute hardening, encryption, access control, audit logging, backup, and disaster recovery are all defined here as code.

Controls are organized by family. Each control references the specific file path implementing it.

---

## AC -- Access Control

| Control  | Title                                                     | Implementation                                                                                                                                                                                  | Evidence                                                                                                                                                                            |
| -------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-2     | Account Management                                        | IAM roles per service with least-privilege policies. IRSA binds K8s service accounts to scoped IAM roles.                                                                                       | `infra/terraform/modules/eks/main.tf` (cluster/node IAM roles), `infra/terraform/modules/secrets/intelligence.tf` (IRSA)                                                            |
| AC-3     | Access Enforcement                                        | Kubernetes RBAC via service accounts. Network policies enforce pod-to-pod access. Security groups restrict network access per tier.                                                             | `infra/kubernetes/overlays/production/network-policies.yaml`, `infra/terraform/modules/database/main.tf` (SG)                                                                       |
| AC-4     | Information Flow Enforcement                              | Default-deny network policies in production. Database subnets have no internet route. Crypto service has zero egress.                                                                           | `infra/kubernetes/overlays/production/network-policies.yaml` (default-deny-ingress, default-deny-egress), `infra/terraform/modules/vpc/main.tf` (database route table -- no routes) |
| AC-5     | Separation of Duties                                      | Separate IAM roles for cluster, node group, ALB controller, CI deploy, RDS export, and secret rotation. No role has cross-domain permissions.                                                   | `infra/terraform/modules/eks/main.tf`, `infra/terraform/modules/alb/main.tf`, `infra/terraform/modules/ci/main.tf`, `infra/terraform/modules/backup/main.tf`                        |
| AC-6     | Least Privilege                                           | CI deploy role limited to ECR push and EKS describe. ALB controller role scoped to ELB/EC2. Node role uses AWS-managed minimal policies. Database SG accepts only from allowed security groups. | `infra/terraform/modules/ci/main.tf` (ECR + EKS only), `infra/terraform/modules/database/main.tf` (SG ingress from allowed SGs, no egress)                                          |
| AC-6(1)  | Least Privilege -- Authorize Access to Security Functions | Production deployments require `--approval-ticket` flag. KMS key access restricted to specific IAM roles.                                                                                       | `infra/scripts/deploy.sh` (approval gate), `infra/terraform/modules/backup/main.tf` (KMS policy)                                                                                    |
| AC-6(9)  | Least Privilege -- Log Use of Privileged Functions        | EKS control plane audit logging enabled. RDS logs all connections and statements. VPC flow logs capture all traffic.                                                                            | `infra/terraform/modules/eks/main.tf` (enabled_cluster_log_types includes "audit"), `infra/terraform/modules/database/main.tf` (log_statement = "all")                              |
| AC-17    | Remote Access                                             | EKS API endpoint private by default. Public access requires explicit CIDR allowlist with precondition enforcement.                                                                              | `infra/terraform/modules/eks/main.tf` (endpoint_private_access = true, precondition on allowed_cidr_blocks)                                                                         |
| AC-17(2) | Remote Access -- Protection of Confidentiality/Integrity  | All remote access via TLS-encrypted channels. EKS API uses mTLS. ALB terminates TLS with ACM certificates.                                                                                      | `infra/terraform/modules/alb/main.tf` (ACM cert), `infra/terraform/modules/eks/main.tf`                                                                                             |

---

## AU -- Audit and Accountability

| Control | Title                                        | Implementation                                                                                                                                                                             | Evidence                                                                                                                                                                                              |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AU-2    | Event Logging                                | EKS control plane logs (api, audit, authenticator, controllerManager, scheduler). RDS logs all statements, connections, disconnections. VPC flow logs capture all traffic.                 | `infra/terraform/modules/eks/main.tf` (enabled_cluster_log_types), `infra/terraform/modules/database/main.tf` (parameter group), `infra/terraform/modules/vpc/main.tf` (aws_flow_log)                 |
| AU-3    | Content of Audit Records                     | EKS audit logs include timestamp, user, resource, action, outcome. RDS logs include query text, duration, connection source. VPC flow logs include source/dest IP, port, protocol, action. | `infra/terraform/modules/eks/main.tf`, `infra/terraform/modules/vpc/main.tf`                                                                                                                          |
| AU-4    | Audit Log Storage Capacity                   | CloudWatch log groups with 90-day retention. Audit database with 35-day backup retention. S3 backup exports with 7-year lifecycle (90-day to Glacier, 2555-day expiration).                | `infra/terraform/modules/vpc/main.tf` (retention_in_days = 90), `infra/terraform/modules/database/main.tf` (backup_retention_period = 35), `infra/terraform/modules/backup/main.tf` (lifecycle rules) |
| AU-5    | Response to Audit Logging Process Failures   | Prometheus alerting for monitoring failures. Grafana dashboards for observability. Alert rules for protocol and intelligence services.                                                     | `infra/monitoring/alerts/protocol-alerts.yml`, `infra/monitoring/alerts/intelligence-alerts.yml`                                                                                                      |
| AU-6    | Audit Record Review                          | Grafana dashboards for real-time log analysis. Loki for centralized log aggregation and search.                                                                                            | `infra/docker/observability/grafana/`, `infra/docker/observability/loki.yml`                                                                                                                          |
| AU-7    | Audit Record Reduction and Report Generation | Prometheus metrics provide aggregated audit summaries. Grafana dashboards provide filtered views.                                                                                          | `infra/docker/observability/prometheus.yml`, `infra/monitoring/dashboards/`                                                                                                                           |
| AU-8    | Time Stamps                                  | All AWS services use synchronized NTP. EKS nodes use Amazon Time Sync Service. CloudWatch logs use UTC timestamps.                                                                         | AWS infrastructure default                                                                                                                                                                            |
| AU-9    | Protection of Audit Information              | Audit database has `deletion_protection = true` (always, not variable-controlled). Audit DB tagged `IMMUTABLE`. Backup S3 bucket blocks public access and enables versioning.              | `infra/terraform/modules/database/main.tf` (line 265), `infra/terraform/modules/backup/main.tf` (public access block, versioning)                                                                     |
| AU-11   | Audit Record Retention                       | Audit DB backups: 35 days (RDS max). S3 exports: 7 years (2555 days). CloudWatch logs: 90 days. NATS event streams: 90 days retention.                                                     | `infra/terraform/modules/database/main.tf`, `infra/terraform/modules/backup/main.tf`, `infra/terraform/modules/event-bus/main.tf` (retention_days = 90)                                               |
| AU-12   | Audit Record Generation                      | Automated -- all services emit to CloudWatch, Prometheus, and the audit database. No manual audit generation required.                                                                     | All Terraform modules include logging/monitoring configuration                                                                                                                                        |

---

## CM -- Configuration Management

| Control | Title                          | Implementation                                                                                                                               | Evidence                                                                                                                                 |
| ------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| CM-2    | Baseline Configuration         | Infrastructure defined as Terraform modules with pinned provider versions. Kubernetes manifests use Kustomize base + environment overlays.   | `infra/terraform/modules/*/versions.tf`, `infra/kubernetes/base/kustomization.yaml`                                                      |
| CM-3    | Configuration Change Control   | Terraform state tracks all infrastructure changes. Git history provides audit trail. Deploy script requires approval tickets for production. | `infra/scripts/deploy.sh` (--approval-ticket), `infra/terraform/`                                                                        |
| CM-5    | Access Restrictions for Change | CI OIDC restricts deployments to main branch only. Production deploys require explicit approval ticket.                                      | `infra/terraform/modules/ci/main.tf` (StringLike condition: `ref:refs/heads/main`), `infra/scripts/deploy.sh`                            |
| CM-6    | Configuration Settings         | Kustomize overlays enforce per-environment configuration. Resource quotas and limit ranges enforce runtime constraints.                      | `infra/kubernetes/overlays/production/kustomization.yaml`, `infra/kubernetes/overlays/production/pod-security-policy.yaml`               |
| CM-7    | Least Functionality            | Container images built from minimal base images. ECR lifecycle policies expire untagged images after 7 days. Database SG has no egress.      | `infra/docker/Dockerfile.base`, `infra/terraform/modules/ecr/main.tf` (lifecycle policies), `infra/terraform/modules/database/main.tf`   |
| CM-8    | System Component Inventory     | ECR repositories tracked in Terraform. All infrastructure components tagged with environment, project, and principle labels.                 | `infra/terraform/modules/ecr/main.tf` (repository list), all modules use `common_tags`                                                   |
| CM-11   | User-Installed Software        | ECR image tag immutability prevents tag overwrite. Container images pinned to specific versions in production Kustomize overlay.             | `infra/terraform/modules/ecr/main.tf` (IMMUTABLE), `infra/kubernetes/overlays/production/kustomization.yaml` (images with pinned newTag) |

---

## CP -- Contingency Planning

| Control | Title                              | Implementation                                                                                                                  | Evidence                                                                                                                                            |
| ------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| CP-2    | Contingency Plan                   | DR test script validates backup integrity and restore capability. Deploy script supports rollback mode.                         | `infra/scripts/dr-test.sh`, `infra/scripts/deploy.sh` (--rollback flag)                                                                             |
| CP-6    | Alternate Storage Site             | S3 backup bucket in same region with Glacier transition. Multi-region deployment capability (us-east-1, eu-west-1, af-south-1). | `infra/terraform/modules/backup/main.tf`, `infra/security/data-residency.md`                                                                        |
| CP-7    | Alternate Processing Site          | Multi-region Terraform environments allow failover. EKS auto-scaling from 1 to 5 nodes. Multi-AZ RDS deployment.                | `infra/terraform/environments/`, `infra/terraform/modules/eks/main.tf` (node scaling), `infra/terraform/modules/database/main.tf` (multi_az = true) |
| CP-9    | System Backup                      | Automated 30-day RDS snapshot exports to S3. EventBridge schedules export Lambda. Backup encryption with dedicated KMS key.     | `infra/terraform/modules/backup/main.tf` (Lambda + EventBridge + S3 + KMS)                                                                          |
| CP-9(1) | System Backup -- Testing           | DR test script performs insert-backup-destroy-restore cycle and validates data integrity.                                       | `infra/scripts/dr-test.sh` (8-step test sequence)                                                                                                   |
| CP-10   | System Recovery and Reconstitution | Deploy script with canary deployment (5% traffic) and automatic rollback on failure. DR test validates full restore flow.       | `infra/scripts/deploy.sh` (CANARY_PERCENTAGE=5, CANARY_WAIT_SECONDS=300)                                                                            |

---

## IA -- Identification and Authentication

| Control | Title                                                        | Implementation                                                                                                                      | Evidence                                                                                                                                                   |
| ------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IA-2    | Identification and Authentication (Organizational Users)     | EKS OIDC provider for service identity. GitHub OIDC for CI/CD authentication (no long-lived credentials).                           | `infra/terraform/modules/eks/main.tf` (aws_iam_openid_connect_provider.eks), `infra/terraform/modules/ci/main.tf` (aws_iam_openid_connect_provider.github) |
| IA-3    | Device Identification and Authentication                     | Kubernetes service accounts bound to IAM roles via IRSA. TLS certificates for ALB.                                                  | `infra/terraform/modules/secrets/intelligence.tf` (IRSA), `infra/terraform/modules/alb/main.tf` (ACM cert)                                                 |
| IA-5    | Authenticator Management                                     | RDS passwords managed by AWS Secrets Manager with automatic rotation (30-day cycle). Secrets never stored in git.                   | `infra/terraform/modules/database/main.tf` (manage_master_user_password = true), `infra/terraform/modules/secrets/intelligence.tf` (rotation_rules)        |
| IA-5(1) | Authenticator Management -- Password-Based                   | RDS master passwords auto-generated and stored in Secrets Manager. No human-managed passwords for infrastructure.                   | `infra/terraform/modules/database/main.tf`, `infra/scripts/init-secrets.sh`                                                                                |
| IA-8    | Identification and Authentication (Non-Organizational Users) | CI deploy role uses OIDC federation with branch restriction (main only). ALB controller uses IRSA with service account restriction. | `infra/terraform/modules/ci/main.tf` (subject condition), `infra/terraform/modules/alb/main.tf` (IRSA condition)                                           |

---

## PE -- Physical and Environmental Protection

| Control | Title                                        | Implementation                                                                                | Evidence                        |
| ------- | -------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------- |
| PE-1    | Physical and Environmental Protection Policy | Inherited from AWS. AWS data centers meet SOC 2 Type II, ISO 27001, and FedRAMP requirements. | AWS shared responsibility model |
| PE-2    | Physical Access Authorizations               | Inherited from AWS. Physical access to data centers controlled by AWS.                        | AWS compliance documentation    |
| PE-3    | Physical Access Control                      | Inherited from AWS. Multi-factor physical access, 24/7 monitoring, video surveillance.        | AWS data center security        |

---

## SC -- System and Communications Protection

| Control  | Title                                          | Implementation                                                                                                                             | Evidence                                                                                                                                                                 |
| -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SC-7     | Boundary Protection                            | Three-tier VPC architecture (public/private/database subnets). NAT Gateway for controlled egress. Database subnets have no internet route. | `infra/terraform/modules/vpc/main.tf` (subnet tiers, route tables)                                                                                                       |
| SC-7(5)  | Boundary Protection -- Deny by Default         | Default-deny network policies for all ingress and egress in production namespace. Security groups deny all unless explicitly allowed.      | `infra/kubernetes/overlays/production/network-policies.yaml` (default-deny-ingress, default-deny-egress)                                                                 |
| SC-8     | Transmission Confidentiality and Integrity     | TLS 1.2+ on all external endpoints (ALB, RDS, EKS API). Internal cluster communication encrypted.                                          | `infra/terraform/modules/alb/main.tf`, `infra/terraform/modules/database/main.tf`                                                                                        |
| SC-12    | Cryptographic Key Establishment and Management | AWS KMS for all key management. Dedicated keys per service (EKS secrets, backup encryption). Automatic annual key rotation.                | `infra/terraform/modules/eks/main.tf` (aws_kms_key.eks_secrets), `infra/terraform/modules/backup/main.tf` (aws_kms_key.backup)                                           |
| SC-13    | Cryptographic Protection                       | AES-256-GCM for data at rest. TLS 1.2+ for data in transit. All crypto operations via FIPS 140-2 Level 3 validated AWS KMS HSMs.           | See `fips-assessment.md`                                                                                                                                                 |
| SC-23    | Session Authenticity                           | OIDC tokens for service-to-service authentication. Kubernetes service account tokens projected via IRSA.                                   | `infra/terraform/modules/eks/main.tf` (OIDC provider), `infra/kubernetes/overlays/production/kustomization.yaml` (token projection)                                      |
| SC-28    | Protection of Information at Rest              | Storage encryption enabled on all data stores: RDS, S3, EBS, ECR.                                                                          | `infra/terraform/modules/database/main.tf`, `infra/terraform/modules/backup/main.tf`, `infra/terraform/modules/event-bus/main.tf`, `infra/terraform/modules/ecr/main.tf` |
| SC-28(1) | Protection at Rest -- Cryptographic Protection | Customer-managed KMS keys for EKS secrets and backup exports. AWS-managed keys for RDS, S3, EBS, ECR.                                      | `infra/terraform/modules/eks/main.tf`, `infra/terraform/modules/backup/main.tf`                                                                                          |

---

## SI -- System and Information Integrity

| Control | Title                                         | Implementation                                                                                                                                                        | Evidence                                                                                                       |
| ------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| SI-2    | Flaw Remediation                              | ECR scan-on-push enabled for all container images. Trivy scanning in CI pipeline. Zero CVE target maintained.                                                         | `infra/terraform/modules/ecr/main.tf` (scan_on_push = true)                                                    |
| SI-3    | Malicious Code Protection                     | Container image scanning on push. Immutable image tags prevent tampering. Network policies restrict lateral movement.                                                 | `infra/terraform/modules/ecr/main.tf`, `infra/kubernetes/overlays/production/network-policies.yaml`            |
| SI-4    | System Monitoring                             | Prometheus metrics collection. Grafana dashboards. Loki log aggregation. CloudWatch integration for AWS services. Alert rules for protocol and intelligence services. | `infra/docker/observability/prometheus.yml`, `infra/docker/observability/loki.yml`, `infra/monitoring/alerts/` |
| SI-5    | Security Alerts and Advisories                | Prometheus alert rules for service health. CloudWatch alarms for infrastructure.                                                                                      | `infra/monitoring/alerts/protocol-alerts.yml`, `infra/monitoring/alerts/intelligence-alerts.yml`               |
| SI-7    | Software, Firmware, and Information Integrity | ECR immutable tags prevent image replacement. Kustomize pins image versions in production. Deploy script uses versioned artifacts.                                    | `infra/terraform/modules/ecr/main.tf` (IMMUTABLE), `infra/kubernetes/overlays/production/kustomization.yaml`   |

---

## Control Summary

| Family                             | Controls Mapped | Key Infrastructure                                        |
| ---------------------------------- | --------------- | --------------------------------------------------------- |
| AC (Access Control)                | 9               | Network policies, IAM/IRSA, security groups               |
| AU (Audit)                         | 10              | Audit DB, CloudWatch, Prometheus, Loki, VPC flow logs     |
| CM (Configuration Management)      | 7               | Terraform state, Kustomize, ECR lifecycle, image pinning  |
| CP (Contingency Planning)          | 6               | Backup module, DR test script, multi-AZ, multi-region     |
| IA (Identification/Authentication) | 5               | OIDC (EKS + GitHub), IRSA, Secrets Manager rotation       |
| PE (Physical/Environmental)        | 3               | Inherited from AWS                                        |
| SC (System/Communications)         | 8               | VPC isolation, KMS, TLS, default-deny, encryption at rest |
| SI (System/Information Integrity)  | 5               | ECR scanning, immutable tags, Prometheus monitoring       |
| **Total**                          | **53**          |                                                           |

---

## References

- NIST SP 800-53 Rev 5: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- AWS Services in Scope for Compliance: https://aws.amazon.com/compliance/services-in-scope/
- NIST SP 800-171 (CUI protection): https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final
