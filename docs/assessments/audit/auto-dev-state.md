# Auto-Dev State — Session Handoff

**Last updated:** 2026-05-05
**Current commit:** 3690654
**Session:** Cycle 4 + deployment sprint

## Scorecard (Cycle 4)

| Dimension             | Score      |
| --------------------- | ---------- |
| Spec Fidelity         | 9/10       |
| Structural Integrity  | 9/10       |
| Code Quality          | 9/10       |
| Testability           | 9/10       |
| Operational Readiness | 9/10       |
| Consistency           | 10/10      |
| Security              | 9/10       |
| Production Readiness  | 9/10       |
| Competitive Moat      | 7/10       |
| **Average**           | **9.1/10** |

## Deployment Status — Testnet Pilot LIVE

**Cluster:** gtcx-testnet-pilot, af-south-1, 2x t3.small nodes, K8s 1.30

| Component         | Status        | Details                                                 |
| ----------------- | ------------- | ------------------------------------------------------- |
| EKS cluster       | Running       | 2 nodes, vpc-0fd94813e071191b2                          |
| NATS              | Running (2/2) | TLS enabled, JetStream, cert-manager certs              |
| Protocols         | Running (1/1) | 6 protocols, 64 handlers, port 8300, v0.4.2             |
| cert-manager      | Running       | v1.14.5, self-signed ClusterIssuer                      |
| metrics-server    | Running       | HPA ready                                               |
| EBS CSI driver    | Running       | IRSA configured                                         |
| ALB controller    | Running       | 2 replicas                                              |
| WAF               | Active        | OWASP + SQLi + rate limiting                            |
| ACM               | Active        | gtcxprotocol.org + wildcard                             |
| RDS (operational) | Running       | Encrypted, Secrets Manager                              |
| RDS (audit)       | Running       | Encrypted, deletion protection                          |
| ECR               | 11 repos      | protocols, agx, crx, sgx, crypto + others               |
| AGX               | Not deployed  | NestJS build artifact issue (MODULE_NOT_FOUND in dist/) |
| Crypto            | Not deployed  | No Rust binary in gtcx-core                             |
| ANISA/Intel SDK   | Not deployed  | Need image builds                                       |

## ECR Image Tags (linux/amd64)

| Image          | Tag                 | Status                      |
| -------------- | ------------------- | --------------------------- |
| gtcx-protocols | v0.4.2              | Running on cluster          |
| gtcx-agx       | v0.4.0              | Built, needs NestJS dep fix |
| gtcx-crx       | sha-02dc530 (arm64) | Needs amd64 rebuild         |
| gtcx-sgx       | sha-02dc530 (arm64) | Needs amd64 rebuild         |

## Completed This Session

1. K8s hardening: rolling update, startup probes, seccompProfile, security contexts
2. 4 new Terraform test files: backup, detective, compliance, alb (7/14 modules)
3. cert-manager v1.14.5 installed, NATS TLS live
4. metrics-server installed (HPA ready)
5. EBS CSI driver with IRSA
6. Node group scaled 1→2
7. compliance-db published: github.com/amani-amina-anai/terraform-aws-compliance-db
8. Protocols server deployed and running (6 protocols, 64 handlers)
9. Dockerfile.protocols rewritten for EKS (shamefully-hoist, tsx, baseUrl patch, type:module)
10. Dockerfile.platforms CMD fix (shell form for env var expansion)
11. EKS public access CIDR updated to allow both IPs

## Next Actions

1. **Fix AGX deployment** — NestJS build output has MODULE_NOT_FOUND (likely missing shared package in Turborepo filter). Debug in 6-platforms repo.
2. **Build ANISA/intelligence-sdk images** — need Python/Node Dockerfiles tested
3. **Build crypto image** — needs Rust toolchain in gtcx-core
4. **Rebuild CRX/SGX for amd64** — arm64 images exist, need linux/amd64
5. **Set up Ingress** — ALB controller running, need Ingress resource pointing to protocols service
6. **Calibrate alert thresholds** — now that protocols is serving traffic
7. **Add tftest for remaining 7 modules**

## Open Findings

| #   | Finding                          | Severity | Status                        |
| --- | -------------------------------- | -------- | ----------------------------- |
| 1   | NATS single replica              | Medium   | Open (flip for production)    |
| 2   | Alert thresholds uncalibrated    | Medium   | Unblocked — protocols running |
| 3   | No load testing                  | Medium   | Unblocked — protocols running |
| 4   | AGX MODULE_NOT_FOUND             | Medium   | Open — NestJS build issue     |
| 5   | 7 modules still lack tftest      | Low      | Open                          |
| 6   | EKS version drift (1.31 vs 1.30) | Low      | Open                          |
| 7   | EKS public access has 2 IPs      | Low      | Clean up when IP stabilizes   |

## Resume Instructions

The protocols server is live at port 8300 on the cluster. Next session should:

1. Debug AGX NestJS build — exec into `gtcx-agx:v0.4.0` image and check what's in `/app/platforms/agx/dist/main.js` line 3 to see what module is missing. Likely needs Turborepo to build shared packages too.
2. Create Ingress resource to expose protocols via ALB.
3. Continue with remaining image builds (ANISA, crypto, CRX, SGX).
