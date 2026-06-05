---
title: 'Defense Readiness Assessment — gtcx-infrastructure'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Defense Readiness Assessment — gtcx-infrastructure

**Assessment date:** 2026-04-06
**Classification:** Internal
**Framework:** CMMC Level 2 (Controlled Unclassified Information)
**Status:** Ready for air-gap deployment with documented procedures

---

## Executive Summary

GTCX infrastructure is designed for deployment in disconnected, air-gapped, and sovereign environments. The architecture supports complete operation without internet egress: EKS runs in private subnets, container images are pre-staged in regional ECR, Terraform state resides in S3, NATS runs locally within the cluster, and all data stores operate in isolated database subnets with no internet route. This assessment documents the air-gap deployment mode and maps controls to CMMC Level 2 practices.

---

## Air-Gap Deployment Architecture

### Network Isolation Model

```
                    [VPN Gateway (optional)]
                              |
    ┌─────────────────────────┼─────────────────────────────┐
    │                     VPC (10.0.0.0/16)                  │
    │                                                        │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
    │  │ Public Subnet │  │ Public Subnet │  │ Public Subnet│ │
    │  │  (ALB only)   │  │  (NAT - off)  │  │   (spare)    │ │
    │  └──────────────┘  └──────────────┘  └──────────────┘ │
    │                                                        │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
    │  │Private Subnet │  │Private Subnet │  │Private Subnet│ │
    │  │  (EKS nodes)  │  │  (EKS nodes)  │  │  (EKS nodes) │ │
    │  │  No egress    │  │  No egress    │  │  No egress   │ │
    │  └──────────────┘  └──────────────┘  └──────────────┘ │
    │                                                        │
    │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
    │  │  DB Subnet    │  │  DB Subnet    │  │  DB Subnet   │ │
    │  │ (RDS - no RT) │  │ (RDS - no RT) │  │ (RDS - no RT)│ │
    │  └──────────────┘  └──────────────┘  └──────────────┘ │
    └────────────────────────────────────────────────────────┘
```

### Air-Gap Readiness by Component

| Component         | Air-Gap Ready       | Mechanism                                                                    | Evidence                                                                                                                                                     |
| ----------------- | ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| EKS cluster       | Yes                 | Private API endpoint, private subnets, no public access                      | `04-ship/terraform/modules/eks/main.tf` -- `enable_public_access = false`, nodes in `private_subnet_ids`                                                     |
| Container images  | Yes                 | Pre-pulled to regional ECR, immutable tags                                   | `04-ship/terraform/modules/ecr/main.tf` -- in-region repos, `IMMUTABLE` tags                                                                                 |
| RDS (operational) | Yes                 | Database subnets with no internet route, no public access                    | `04-ship/terraform/modules/vpc/main.tf` -- database route table has no routes; `04-ship/terraform/modules/database/main.tf` -- `publicly_accessible = false` |
| RDS (audit)       | Yes                 | Same isolation as operational, plus deletion protection always on            | `04-ship/terraform/modules/database/main.tf` -- `deletion_protection = true` (hardcoded)                                                                     |
| NATS JetStream    | Yes                 | Runs in private subnets, cluster-internal only, EBS persistence              | `04-ship/terraform/modules/event-bus/main.tf` -- security group restricts to allowed SGs only                                                                |
| S3 backups        | Yes                 | Regional bucket, public access blocked, no cross-region replication          | `04-ship/terraform/modules/backup/main.tf` -- `block_public_acls = true`, all four public access flags                                                       |
| Terraform state   | Yes                 | S3 backend in same region, no external dependencies                          | `04-ship/terraform/environments/`                                                                                                                            |
| Secrets           | Yes                 | AWS Secrets Manager in-region, synced to K8s via External Secrets Operator   | `04-ship/terraform/modules/secrets/intelligence.tf`                                                                                                          |
| Monitoring        | Yes                 | Prometheus + Grafana + Loki run locally, no external telemetry endpoints     | `04-ship/docker/observability/`                                                                                                                              |
| NAT Gateway       | Disable for air-gap | `enable_nat_gateway = false` removes all internet egress for private subnets | `04-ship/terraform/modules/vpc/main.tf` -- `var.enable_nat_gateway` controls creation                                                                        |
| VPN Gateway       | Optional            | `enable_vpn_gateway = true` for government network connectivity              | `04-ship/terraform/modules/vpc/main.tf` -- `var.enable_vpn_gateway`                                                                                          |

### Air-Gap Deployment Procedure

1. **Pre-stage images:** Push all container images to regional ECR before disabling egress
2. **Disable NAT:** Set `enable_nat_gateway = false` in Terraform environment config
3. **Enable VPN (optional):** Set `enable_vpn_gateway = true` for government network access
4. **Disable EKS public endpoint:** Confirm `enable_public_access = false` (default)
5. **Validate:** Run `dr-test.sh` to confirm all services operate without internet
6. **Monitor:** Prometheus/Grafana/Loki operate entirely within the cluster

---

## SBOM (Software Bill of Materials) per Container Image

### SBOM Generation

| Image             | Dockerfile                               | SBOM Format | Generation Method         |
| ----------------- | ---------------------------------------- | ----------- | ------------------------- |
| gtcx-api          | `04-ship/docker/Dockerfile.node`         | CycloneDX   | Trivy SBOM in CI pipeline |
| gtcx-crypto       | `04-ship/docker/Dockerfile.node`         | CycloneDX   | Trivy SBOM in CI pipeline |
| gtcx-protocols    | `04-ship/docker/Dockerfile.protocols`    | CycloneDX   | Trivy SBOM in CI pipeline |
| gtcx-intelligence | `04-ship/docker/Dockerfile.intelligence` | CycloneDX   | Trivy SBOM in CI pipeline |
| gtcx-base         | `04-ship/docker/Dockerfile.base`         | CycloneDX   | Trivy SBOM in CI pipeline |

### SBOM Verification

```bash
# Generate SBOM for a container image
trivy image --format cyclonedx --output sbom.json $ECR_REGISTRY/gtcx-api:v1.0.0

# Scan SBOM for vulnerabilities
trivy sbom sbom.json --severity HIGH,CRITICAL
```

### Container Image Security

| Control           | Implementation                                              | Evidence                                                                        |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Scan on push      | ECR scans every image on push                               | `04-ship/terraform/modules/ecr/main.tf` -- `scan_on_push = true`                |
| Immutable tags    | Tags cannot be overwritten                                  | `04-ship/terraform/modules/ecr/main.tf` -- `image_tag_mutability = "IMMUTABLE"` |
| Lifecycle cleanup | Untagged images expire after 7 days, max 30 tagged retained | `04-ship/terraform/modules/ecr/main.tf` -- lifecycle policy                     |
| Version pinning   | Production overlay pins exact image versions                | `04-ship/kubernetes/overlays/production/kustomization.yaml` -- `newTag: v1.0.0` |
| AES-256 at rest   | All ECR images encrypted                                    | `04-ship/terraform/modules/ecr/main.tf` -- `encryption_type = "AES256"`         |

---

## CMMC Level 2 Practice Mapping

CMMC Level 2 requires implementation of 110 practices from NIST SP 800-171 Rev 2. The following maps the practices directly owned by this infrastructure repo.

### AC -- Access Control

| Practice     | Title                                       | Implementation                                                                                       | Evidence                                                                                                               |
| ------------ | ------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| AC.L2-3.1.1  | Limit system access to authorized users     | IAM roles with OIDC federation. No long-lived credentials. Branch-restricted CI.                     | `04-ship/terraform/modules/ci/main.tf`, `04-ship/terraform/modules/eks/main.tf`                                        |
| AC.L2-3.1.2  | Limit system access to authorized functions | Least-privilege IAM policies. Pod network policies restrict service communication.                   | `04-ship/terraform/modules/ci/main.tf` (scoped policy), `04-ship/kubernetes/overlays/production/network-policies.yaml` |
| AC.L2-3.1.3  | Control CUI flow                            | Database subnets isolated. Data residency enforcement per region. No cross-region data flow for CUI. | `04-ship/terraform/modules/vpc/main.tf` (database RT), `04-ship/security/data-residency.md`                            |
| AC.L2-3.1.5  | Least privilege                             | Detailed in NIST 800-53 AC-6 mapping. Every IAM role scoped to minimum required permissions.         | See `nist-800-53-mapping.md` AC-6                                                                                      |
| AC.L2-3.1.12 | Monitor and control remote access           | EKS private endpoint. VPC flow logs. CloudWatch audit logging.                                       | `04-ship/terraform/modules/eks/main.tf`, `04-ship/terraform/modules/vpc/main.tf` (flow logs)                           |
| AC.L2-3.1.13 | Encrypt remote access sessions              | TLS 1.2+ on all endpoints.                                                                           | `04-ship/terraform/modules/alb/main.tf`, `04-ship/terraform/modules/database/main.tf`                                  |

### AU -- Audit and Accountability

| Practice    | Title                       | Implementation                                                                                  | Evidence                                                                                                                       |
| ----------- | --------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| AU.L2-3.3.1 | Create system audit records | EKS audit logs, RDS statement logs, VPC flow logs, Prometheus metrics.                          | `04-ship/terraform/modules/eks/main.tf`, `04-ship/terraform/modules/database/main.tf`, `04-ship/terraform/modules/vpc/main.tf` |
| AU.L2-3.3.2 | Individual accountability   | OIDC-based identity for all service and CI actions. IRSA binds K8s actions to AWS IAM identity. | `04-ship/terraform/modules/ci/main.tf`, `04-ship/terraform/modules/secrets/intelligence.tf`                                    |
| AU.L2-3.3.4 | Alert on audit failure      | Prometheus alerting for monitoring stack health.                                                | `04-ship/monitoring/alerts/`                                                                                                   |
| AU.L2-3.3.5 | Correlate audit records     | Centralized logging via Loki. Grafana dashboards correlate across services.                     | `04-ship/docker/observability/loki.yml`, `04-ship/monitoring/dashboards/`                                                      |
| AU.L2-3.3.8 | Protect audit information   | Audit DB deletion protection always on. S3 versioning. Immutable tagging.                       | `04-ship/terraform/modules/database/main.tf` (line 265), `04-ship/terraform/modules/backup/main.tf`                            |

### CM -- Configuration Management

| Practice    | Title                              | Implementation                                                             | Evidence                                                                                                                          |
| ----------- | ---------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| CM.L2-3.4.1 | Baseline configuration             | All infrastructure defined in Terraform. K8s manifests in Kustomize.       | `04-ship/terraform/modules/`, `04-ship/kubernetes/`                                                                               |
| CM.L2-3.4.2 | Security configuration enforcement | Resource quotas, limit ranges, network policies enforced in production.    | `04-ship/kubernetes/overlays/production/pod-security-policy.yaml`, `04-ship/kubernetes/overlays/production/network-policies.yaml` |
| CM.L2-3.4.5 | Access restrictions for change     | Main-branch-only CI deploy. Approval ticket required for production.       | `04-ship/terraform/modules/ci/main.tf`, `04-ship/03-platform/scripts/deploy.sh`                                                   |
| CM.L2-3.4.6 | Least functionality                | Minimal container images. No unnecessary services. Database has no egress. | `04-ship/docker/Dockerfile.base`, `04-ship/terraform/modules/database/main.tf`                                                    |

### IA -- Identification and Authentication

| Practice    | Title                       | Implementation                                                                                   | Evidence                                                                        |
| ----------- | --------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| IA.L2-3.5.1 | Identify system users       | OIDC-based identity for all automated access. No shared credentials.                             | `04-ship/terraform/modules/ci/main.tf`, `04-ship/terraform/modules/eks/main.tf` |
| IA.L2-3.5.2 | Authenticate users          | OIDC federation with AWS STS. Token-based authentication for all service accounts.               | `04-ship/terraform/modules/secrets/intelligence.tf` (IRSA)                      |
| IA.L2-3.5.3 | Multi-factor authentication | AWS IAM MFA for console access (organizational policy). OIDC tokens are time-limited and scoped. | AWS organizational MFA policy                                                   |

### MP -- Media Protection

| Practice    | Title                | Implementation                                                                              | Evidence                                                                            |
| ----------- | -------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| MP.L2-3.8.1 | Protect CUI on media | All storage encrypted (RDS, S3, EBS, ECR).                                                  | See `fips-assessment.md`                                                            |
| MP.L2-3.8.3 | Sanitize media       | ECR lifecycle policies expire old images. S3 lifecycle transitions to Glacier then expires. | `04-ship/terraform/modules/ecr/main.tf`, `04-ship/terraform/modules/backup/main.tf` |

### SC -- System and Communications Protection

| Practice      | Title                   | Implementation                                                              | Evidence                                                                                                |
| ------------- | ----------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| SC.L2-3.13.1  | Boundary protection     | Three-tier VPC. Default-deny network policies. Security groups per service. | `04-ship/terraform/modules/vpc/main.tf`, `04-ship/kubernetes/overlays/production/network-policies.yaml` |
| SC.L2-3.13.8  | CUI on public networks  | TLS 1.2+ on all external interfaces. No CUI transmitted unencrypted.        | `04-ship/terraform/modules/alb/main.tf` (ACM cert)                                                      |
| SC.L2-3.13.11 | Encrypt CUI at rest     | AES-256 on all storage. KMS-managed keys.                                   | See `fips-assessment.md`                                                                                |
| SC.L2-3.13.16 | Data at rest protection | Storage encryption on RDS, S3, EBS, ECR.                                    | All Terraform modules                                                                                   |

### SI -- System and Information Integrity

| Practice     | Title                      | Implementation                                             | Evidence                                                                                                                       |
| ------------ | -------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| SI.L2-3.14.1 | Identify and correct flaws | ECR scan-on-push. Trivy in CI. Zero CVE target.            | `04-ship/terraform/modules/ecr/main.tf`                                                                                        |
| SI.L2-3.14.2 | Malicious code protection  | Container scanning. Network isolation. Immutable images.   | `04-ship/terraform/modules/ecr/main.tf`, `04-ship/kubernetes/overlays/production/network-policies.yaml`                        |
| SI.L2-3.14.6 | Monitor systems            | Prometheus + Grafana + Loki. Alert rules for all services. | `04-ship/docker/observability/`, `04-ship/monitoring/alerts/`                                                                  |
| SI.L2-3.14.7 | Identify unauthorized use  | VPC flow logs. EKS audit logs. RDS connection logging.     | `04-ship/terraform/modules/vpc/main.tf`, `04-ship/terraform/modules/eks/main.tf`, `04-ship/terraform/modules/database/main.tf` |

### RE -- Recovery

| Practice     | Title                    | Implementation                                                         | Evidence                                                                        |
| ------------ | ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| RE.L2-3.11.1 | Perform risk assessments | Threat model maintained. DR test script validates recovery capability. | `01-docs/09-security/threat-model.md`, `04-ship/03-platform/scripts/dr-test.sh` |
| RE.L2-3.11.2 | Scan for vulnerabilities | ECR scan-on-push. Trivy + CycloneDX SBOM in CI.                        | `04-ship/terraform/modules/ecr/main.tf`                                         |

---

## CMMC Level 2 Summary

| Domain                                    | Practices Mapped | Status      |
| ----------------------------------------- | ---------------- | ----------- |
| Access Control (AC)                       | 6                | Implemented |
| Audit and Accountability (AU)             | 5                | Implemented |
| Configuration Management (CM)             | 4                | Implemented |
| Identification and Authentication (IA)    | 3                | Implemented |
| Media Protection (MP)                     | 2                | Implemented |
| System and Communications Protection (SC) | 4                | Implemented |
| System and Information Integrity (SI)     | 4                | Implemented |
| Recovery (RE)                             | 2                | Implemented |
| **Total**                                 | **30**           |             |

---

## Recommendations

1. **Formalize air-gap deployment runbook** -- Document the exact sequence for deploying without NAT Gateway, including image pre-staging checklist
2. **Add SBOM attestation** -- Sign SBOMs with cosign and store attestations alongside images in ECR
3. **Implement NATS TLS in production** -- Generate and manage TLS certificates for NATS cluster communication
4. **VPN Gateway testing** -- Validate VPN connectivity with government networks in target deployment regions
5. **Periodic air-gap drill** -- Run quarterly deployment exercise with NAT Gateway disabled to verify full offline operation

---

## References

- CMMC Level 2 Scoping Guide: https://dodcio.defense.gov/cmmc/
- NIST SP 800-171 Rev 2: https://csrc.nist.gov/publications/detail/sp/800-171/rev-2/final
- CycloneDX SBOM Specification: https://cyclonedx.org/specification/
- Trivy Scanner: https://aquasecurity.github.io/trivy/
