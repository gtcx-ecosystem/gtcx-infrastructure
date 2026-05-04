# Auto-Dev State — Session Handoff

**Last updated:** 2026-05-04
**Current commit:** 020a26e
**Session:** Full audit + 6 sprints + testnet deployment

## Scorecard (Cycle 3)

| Dimension             | Score      |
| --------------------- | ---------- |
| Spec Fidelity         | 9/10       |
| Structural Integrity  | 9/10       |
| Code Quality          | 9/10       |
| Testability           | 8/10       |
| Operational Readiness | 9/10       |
| Consistency           | 10/10      |
| Security              | 9/10       |
| Production Readiness  | 8/10       |
| Competitive Moat      | 6/10       |
| **Average**           | **8.7/10** |

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

## Completed This Session

1. Full 6-phase audit (architecture, security, GTM, hygiene, prod readiness, sprint plan)
2. Sprint 1: EKS lockdown, NATS auth, image pinning, secrets consolidation, Lambda timeout, IRSA fix, DynamoDB split
3. Sprint 2: CloudTrail+GuardDuty, ALB TLS, deploy.sh fix, Dockerfile lockfile, latency SLOs, NetworkPolicy overlays
4. Sprint 3: Delete \_delete/ (4.8MB), fix baseline config, fix all \_sop paths, Alertmanager escalation, FK constraints, SQL injection fix
5. Sprint 4: DB secret outputs, Loki 365-day retention
6. Sprint 5: Terraform native tests, CI link checker, VPC endpoints
7. Sprint 6: AWS Config rules, WAF, DR runbook
8. Cycle 3: tftest for 3 modules, CI covers all 11 modules, compliance-db moat module, edge-proxy removed
9. Deployment: testnet-pilot fully provisioned, kubectl working, base manifests applied
10. Build-push script created

## Next Actions (for next session)

1. **Build and push images** — run `./infra/scripts/build-push.sh` (requires app repos to have working Dockerfiles)
2. **Update kustomization overlays** with ECR image references
3. **Apply workloads** — pods start pulling from ECR
4. **Install metrics-server** — HPA needs it for autoscaling
5. **Calibrate alert thresholds** once traffic flows
6. **Push deploy fixes to origin** — 5 commits since last push (EKS version, backup region, WAF fix, public API, build-push script)
7. **Publish compliance-db** as standalone Terraform module (separate repo)

## Open Findings

| #   | Finding                         | Severity | Blocked On         |
| --- | ------------------------------- | -------- | ------------------ |
| 1   | NATS TLS                        | Medium   | cert-manager       |
| 2   | NATS single replica             | Medium   | Production deploy  |
| 3   | Alert thresholds uncalibrated   | Medium   | Live traffic       |
| 4   | No load testing                 | Medium   | Running cluster    |
| 5   | compliance-db not published     | Low      | Separate repo      |
| 6   | EKS should upgrade 1.30 -> 1.31 | Low      | Sequential upgrade |
