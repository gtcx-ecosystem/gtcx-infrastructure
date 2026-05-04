# Auto-Dev State — Session Handoff

**Last updated:** 2026-05-04
**Current commit:** post cycle-4
**Session:** Cycle 4 sprint — production readiness + testability

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
| Competitive Moat      | 6/10       |
| **Average**           | **8.9/10** |

## Deployment Status

Testnet-pilot is LIVE in af-south-1:

- EKS cluster: gtcx-testnet-pilot (1 node, t3.small, K8s 1.30)
- VPC: vpc-0fd94813e071191b2 (10.2.0.0/16)
- RDS operational + audit: both running, encrypted
- ECR: 10 repos at 348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-\*
- ALB controller: running (2 replicas)
- WAF: active (OWASP + SQLi + rate limiting)
- ACM: gtcxprotocol.org + wildcard
- K8s manifests: applied, 5 deployments waiting on images (0/2 replicas each)

## Completed This Session (Cycle 4)

1. Added rolling update strategy (maxUnavailable: 0) to all 10 K8s deployments
2. Added startup probes to 9 deployments (all except protocols which already had one)
3. Hardened security contexts: intelligence services (readOnlyRootFilesystem, allowPrivilegeEscalation), Jaeger (full pod+container context), monitoring stack (container contexts)
4. Added tftest for backup module (7 runs)
5. Added tftest for detective module (8 runs)
6. Added tftest for compliance module (9 runs)
7. Added tftest for alb module (7 runs)

## Next Actions (for next session)

1. **Build and push images** — run `./infra/scripts/build-push.sh` (requires app repos to have working Dockerfiles)
2. **Update kustomization overlays** with ECR image references
3. **Apply workloads** — pods start pulling from ECR
4. **Install metrics-server** — HPA needs it for autoscaling
5. **Calibrate alert thresholds** once traffic flows
6. **Publish compliance-db** as standalone Terraform module (separate repo) — this is the moat play
7. **Reconcile EKS version** — code says 1.31, deployed is 1.30
8. **Add tftest for remaining 7 modules** (ecr, event-bus, kyc-documents, secrets, compliance-db, ci)

## Open Findings

| #   | Finding                          | Severity | Blocked On        |
| --- | -------------------------------- | -------- | ----------------- |
| 1   | NATS TLS                         | Medium   | cert-manager      |
| 2   | NATS single replica              | Medium   | Production deploy |
| 3   | Alert thresholds uncalibrated    | Medium   | Live traffic      |
| 4   | No load testing                  | Medium   | Running cluster   |
| 5   | compliance-db not published      | Low      | Separate repo     |
| 6   | EKS version drift (1.31 vs 1.30) | Low      | Upgrade path      |
| 7   | 7 modules still lack tftest      | Low      | Time              |
