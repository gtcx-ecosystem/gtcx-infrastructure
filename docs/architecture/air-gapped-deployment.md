---
title: 'Air-Gapped Deployment Architecture'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'platform-engineering'
tier: 'critical'
tags: ['architecture', 'air-gapped', 'offline', 'government-grade', 'disconnected']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Air-Gapped Deployment Architecture

**Document ID:** GTCX-AIR-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Owner:** Platform Engineering Lead

---

## 1. Purpose

Define the architecture, procedures, and validation criteria for deploying GTCX in fully air-gapped (disconnected) environments. This capability is required for Government-Grade certification, sovereign data center deployments, and defense-adjacent contracts.

## 2. Air-Gapped Definition

An air-gapped GTCX deployment meets **all** of the following:

1. **No internet connectivity** — Production network has no route to public IP space.
2. **No DNS resolution** — External DNS is blocked; internal DNS only.
3. **No cloud dependencies** — No AWS, GCP, Azure, or SaaS APIs in production path.
4. **Controlled ingress/egress** — All data transfer via physically secured sneakernet or one-way diode.
5. **Self-contained artifact supply** — All containers, packages, and dependencies pre-staged.

## 3. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    UNCLASSIFIED ZONE                         │
│  (Build pipeline, artifact staging, update preparation)      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ CI Builder   │  │ Artifact     │  │ Update       │      │
│  │ (Internet)   │  │ Registry     │  │ Packaging    │      │
│  └──────────────┘  │ (Harbor)     │  │ (ISO/USB)    │      │
│                    └──────────────┘  └──────────────┘      │
└──────────────────────────┬──────────────────────────────────┘
                           │ Physical transfer (guarded courier)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    AIR-GAPPED ZONE                           │
│  (Production — no internet, no cloud, self-contained)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Kubernetes   │  │ PostgreSQL   │  │ NATS         │      │
│  │ Cluster      │  │ (Primary)    │  │ JetStream    │      │
│  │ (On-prem)    │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vault        │  │ MinIO        │  │ Prometheus   │      │
│  │ (Auto-unseal │  │ (S3-compat)  │  │ + Grafana    │      │
│  │  via HSM)    │  │  Object Lock │  │  (On-prem)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 4. Component Mapping

| Cloud Component    | Air-Gapped Replacement              | Notes                             |
| ------------------ | ----------------------------------- | --------------------------------- |
| AWS EKS            | On-prem Kubernetes (k3s or RKE2)    | Hardened per CIS benchmark        |
| AWS RDS            | PostgreSQL on-prem (Patroni + etcd) | Streaming replication, PITR       |
| AWS S3             | MinIO with Object Lock (COMPLIANCE) | WORM retention enforced           |
| AWS KMS            | HashiCorp Vault + Thales Luna HSM   | FIPS 140-2 Level 3 key generation |
| AWS CloudTrail     | Auditd + Fluent Bit → MinIO         | Immutable log shipping            |
| AWS GuardDuty      | Suricata + Wazuh                    | On-prem IDS/IPS/SIEM              |
| NATS (AWS MSK)     | NATS Server on-prem                 | JetStream replication             |
| Prometheus/Grafana | Same, on-prem                       | No remote write                   |
| Linkerd            | Same, on-prem                       | mTLS via Vault PKI                |

## 5. Artifact Supply Chain

### 5.1 Base Image Mirroring

1. Pin all Docker base images by digest in `infra/docker/`.
2. Pull images in the Unclassified Zone build pipeline.
3. Export to OCI tarball.
4. Cryptographically sign tarball with offline signing key.
5. Transfer via guarded courier to Air-Gapped Zone.
6. Import into Harbor registry.
7. Verify signature before deployment.

### 5.2 Dependency Mirroring

1. `pnpm` dependencies vendored to `node_modules/` + `pnpm-lock.yaml`.
2. Go modules vendored to `vendor/`.
3. Terraform providers cached to `.terraform/providers/`.
4. All vendored artifacts hashed (SHA-256) and signed.

### 5.3 Update Cadence

| Update Type        | Frequency | Transfer Method                | Validation                      |
| ------------------ | --------- | ------------------------------ | ------------------------------- |
| Security patches   | Emergency | Guarded courier + dual-control | Signature + hash verification   |
| Feature releases   | Quarterly | Guarded courier                | Full regression test in staging |
| Dependency updates | Monthly   | Guarded courier                | SBOM diff + vulnerability scan  |

## 6. Network Segmentation

| Zone             | Connectivity         | Purpose                           |
| ---------------- | -------------------- | --------------------------------- |
| **Unclassified** | Internet + internal  | Build, staging, documentation     |
| **Transfer**     | None (physical only) | Artifact handover, log extraction |
| **Air-Gapped**   | Internal only        | Production                        |
| **Management**   | Internal only        | Admin jump hosts, HSM management  |

## 7. Validation Procedure

Before declaring an air-gapped deployment operational, verify:

| Test                  | Method                                      | Pass Criteria                         |
| --------------------- | ------------------------------------------- | ------------------------------------- |
| Network isolation     | `curl https://8.8.8.8` from production node | Timeout or connection refused         |
| DNS isolation         | `dig google.com` from production node       | NXDOMAIN or no response               |
| Cloud API isolation   | `aws sts get-caller-identity`               | Credentials error or timeout          |
| Artifact completeness | `helm template` + `terraform plan`          | No external chart/provider references |
| HSM key generation    | `vault operator init` with HSM seal         | Success, FIPS 140-2 Level 3           |
| WORM enforcement      | `mc rm` on Object Lock bucket               | Denied during retention period        |
| mTLS mesh             | `linkerd check`                             | All checks pass                       |
| Offline replay        | `tools/replay-guard/` test suite            | All tests pass without internet       |

## 8. Operational Runbooks

| Scenario                        | Runbook                                                  | Location      |
| ------------------------------- | -------------------------------------------------------- | ------------- |
| Air-gapped deployment bootstrap | `docs/operations/runbooks/air-gapped-bootstrap.md`       | To be created |
| Physical artifact transfer      | `docs/operations/runbooks/guarded-courier-procedure.md`  | To be created |
| HSM key ceremony (offline)      | `docs/security/key-ceremony-runbook.md`                  | Exists        |
| Emergency patch in air-gap      | `docs/operations/runbooks/air-gapped-emergency-patch.md` | To be created |

## 9. Compliance Mapping

| Framework            | Control                         | Evidence                             |
| -------------------- | ------------------------------- | ------------------------------------ |
| Government-Grade G.7 | Air-gapped deployment option    | This document + validation checklist |
| FIPS 140-2           | Cryptographic module validation | HSM CMVP certificate                 |
| SOC 2 CC6.6          | Network controls                | Network segmentation diagram         |
| ISO 27001 A.13.1     | Network security management     | Firewall + IDS configuration         |

## 10. Implementation Roadmap

| Phase | Deliverable                                   | Target Date | Dependency                   |
| ----- | --------------------------------------------- | ----------- | ---------------------------- |
| 1     | Air-gapped architecture review + threat model | 2026-Q3     | Government contract interest |
| 2     | On-prem Kubernetes + MinIO staging            | 2026-Q4     | Hardware procurement         |
| 3     | HSM procurement + FIPS validation             | 2027-Q1     | Budget approval              |
| 4     | End-to-end air-gapped pilot                   | 2027-Q2     | Phases 1–3 complete          |
| 5     | Red team validation in air-gap                | 2027-Q3     | Government-Grade readiness   |

---

_Last updated: 2026-05-25_
