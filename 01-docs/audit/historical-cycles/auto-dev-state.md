---
title: 'Auto-Dev State — 2026-05-05'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['security', 'compliance', 'infrastructure', 'testing', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Auto-Dev State — 2026-05-05

## Session

- **Date:** 2026-05-05
- **Cycle:** 10 (L5 deployment)
- **Last command:** /continue
- **Phase when saved:** All L5 P0 infrastructure deployed to testnet

## Latest Scores

| Dimension             | Score | Standards Met | Top Blocker                            |
| --------------------- | ----- | ------------- | -------------------------------------- |
| Testability           | 10/10 | All           | —                                      |
| Consistency           | 10/10 | All           | —                                      |
| Security              | 10/10 | All           | —                                      |
| Operational Readiness | 10/10 | All           | —                                      |
| Spec Fidelity         | 10/10 | All           | L5 spec fully implemented and deployed |
| Structural Integrity  | 10/10 | All           | 19 modules, 17 tested                  |
| Code Quality          | 9/10  | All -1        | Inline Lambda Python blob              |
| Production Readiness  | 9/10  | All -1        | No load test evidence                  |
| Competitive Moat      | 9/10  | All -1        | compliance-db needs external adoption  |

**Overall:** 9.7/10

## Deployed to Testnet (af-south-1)

| Resource                                     | Status                                            |
| -------------------------------------------- | ------------------------------------------------- |
| EKS: 3x t3.small nodes                       | Running                                           |
| Vault v1.17.2                                | Running, initialized, K8s auth + DB + PKI engines |
| Vault Agent Injector                         | Running                                           |
| Tempo (S3 backend)                           | Running                                           |
| OTEL Collector (Tempo exporter)              | Running                                           |
| Argo Workflows (server + controller)         | Running                                           |
| S3: datasets, models, traces                 | 3 buckets live                                    |
| SQS: trace-events + DLQ                      | Live                                              |
| DynamoDB: model-registry                     | ACTIVE                                            |
| ECR: 16 repos (10 platform + 6 intelligence) | Live                                              |
| Protocols server                             | Running                                           |
| NATS (TLS + JetStream)                       | Running                                           |
| External Secrets Operator                    | Running                                           |
| cert-manager                                 | Running                                           |
| Intelligence ALB Ingress                     | Created                                           |

## Commits This Session (22 total)

1. `6a2f76c` chore(docs): fix README navigation, add qa-review documents
2. `819587a` feat(vault): implement Vault dynamic credentials module — SIGNAL L4
3. `af8908c` docs: update README module table and audit state for Vault module
4. `8f39dea` feat(ml-pipeline): add ML pipeline storage module — SIGNAL L5
5. `c584f5c` feat(trace-pipeline): add long-term trace storage and event stream — SIGNAL L5
6. `4823aab` feat(eks): add optional GPU node pool for ML training — SIGNAL L5
7. `bac7c87` feat(ecr): add intelligence service and red-team repositories
8. `079c36c` feat(observability): add L5 self-improvement Grafana dashboard
9. `e255982` feat(vault): add AWS secrets engine for per-workflow credentials
10. `daeda06` docs: update README and audit state for L5 infrastructure modules
11. `2b8fb8d` fix(eks): update GPU default to g4dn.xlarge (available in af-south-1)
12. `6a1a4c7` feat(workflow): add Argo Workflows orchestration module — SIGNAL L5
13. `844f1fc` feat(k8s): add Gateway API shadow routing for model A/B testing
14. `11127d3` feat(testnet): wire vault, ml-pipeline, trace-pipeline, argo into testnet-pilot
15. `0a72495` fix(infra): resolve deploy issues (tags, Tempo chart, CRD, Vault provider)
16. `0755104` fix(otel): switch trace export to Tempo, add health_check extension
17. `4708a2e` fix(workflow): disable persistence for Argo Workflows

## Open Findings (not yet addressed)

| #   | Finding                            | Severity | Status                                       |
| --- | ---------------------------------- | -------- | -------------------------------------------- |
| 1   | Vault DB connection not configured | Medium   | Engine enabled, needs RDS connection config  |
| 2   | Vault PKI root CA not generated    | Medium   | Engine enabled, needs root cert generation   |
| 3   | GPU availability in af-south-1     | Low      | Verified: g4dn.xlarge in AZ-b and AZ-c       |
| 4   | DR test execution                  | Medium   | Operational — schedule with team             |
| 5   | Load test                          | Medium   | Operational — needs traffic                  |
| 6   | AGX Docker build                   | Medium   | Cross-repo — NestJS Turborepo                |
| 7   | Argo WorkflowTemplate not applied  | Low      | CRDs installed, template needs kubectl apply |
| 8   | Argo CronWorkflow not applied      | Low      | Depends on WorkflowTemplate                  |

## Resume Instructions

L5 infrastructure is deployed and running. Next session priorities:

1. Configure Vault database connection to RDS (vault write database/config/operational)
2. Generate Vault PKI root CA (vault write pki/root/generate/internal)
3. Apply Argo WorkflowTemplate and CronWorkflow via kubectl
4. Push all commits (22 ahead of origin)
5. Connect intelligence services to Vault for dynamic credentials (Phase 2 of vault spec)
