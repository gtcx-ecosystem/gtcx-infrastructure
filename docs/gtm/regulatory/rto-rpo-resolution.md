# Board Resolution: Recovery Time & Recovery Point Objectives

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Document ID:** GTCX-BRD-DR-001
**Classification:** Confidential — Board Use Only
**Effective Date:** 2026-05-08
**Review Cycle:** Quarterly
**Next Review:** 2026-08-08

---

## 1. Purpose

This resolution establishes the Recovery Time Objective (RTO) and Recovery Point Objective (RPO) targets for all GTCX production components. These targets define the maximum tolerable downtime and data loss for each component and are binding on the engineering and operations teams.

---

## 2. Definitions

| Term    | Definition                                                                        |
| ------- | --------------------------------------------------------------------------------- |
| **RTO** | Maximum acceptable duration between service disruption and restoration of service |
| **RPO** | Maximum acceptable duration of data loss measured from the point of failure       |
| **DR**  | Disaster Recovery                                                                 |
| **SLO** | Service Level Objective                                                           |

---

## 3. Component RTO/RPO Matrix

| Component                           | RTO Target | RPO Target    | Tier | Recovery Strategy                                                            | Dependencies            |
| ----------------------------------- | ---------- | ------------- | ---- | ---------------------------------------------------------------------------- | ----------------------- |
| **API Gateway (ALB + EKS)**         | 5 minutes  | 0 (stateless) | P0   | Route53 failover to secondary region; EKS auto-scaling replaces failed pods  | Route53, ALB, EKS       |
| **Audit Database (RDS PostgreSQL)** | 30 minutes | 5 minutes     | P0   | Cross-region read replica promotion; async replication lag <= 5 min          | RDS, KMS, VPC peering   |
| **Replay Guard**                    | 5 minutes  | 0 (stateless) | P0   | Kubernetes deployment rollout; nonce state reconstructed from audit log      | EKS, Audit DB           |
| **KYC Documents (S3)**              | 1 hour     | 0 (immutable) | P1   | S3 cross-region replication; objects are write-once, never modified          | S3, KMS                 |
| **NATS Event Bus**                  | 15 minutes | 1 minute      | P1   | JetStream cluster recovery; persistent streams replayed from last checkpoint | EKS, persistent volumes |

### Tier Definitions

- **P0 — Critical:** Service outage directly impacts financial transactions or regulatory compliance. Automated failover required.
- **P1 — High:** Service degradation impacts user experience or delays non-critical operations. Manual failover acceptable with documented runbook.

---

## 4. Recovery Procedures

### 4.1 API Gateway

1. Route53 health check detects ALB failure (3 consecutive failures, 10-second interval)
2. DNS failover routes traffic to secondary ALB in eu-west-1 (propagation: ~60 seconds)
3. Secondary EKS cluster serves traffic from pre-deployed pods
4. Operations team verifies secondary region health via dashboard
5. Root cause analysis begins on primary region

**Validation:** HTTP 200 on `/healthz` from secondary region within 5 minutes of primary failure.

### 4.2 Audit Database

1. CloudWatch alarm triggers on RDS instance failure or replication lag > 5 minutes
2. On-call engineer confirms primary is unrecoverable (max 10-minute decision window)
3. Promote cross-region read replica: `aws rds promote-read-replica --db-instance-identifier gtcx-<env>-audit-replica --region eu-west-1`
4. Update application connection strings (via Secrets Manager rotation)
5. Verify write capability: `SELECT pg_is_in_recovery();` returns `false`
6. Re-establish replication after primary region recovery

**Validation:** Write a test audit record and confirm it persists. Verify replication lag was <= 5 minutes at time of promotion.

### 4.3 Replay Guard

1. Kubernetes detects pod failure via liveness probe (30-second cycle)
2. Deployment controller replaces failed pods (rolling update, max 2 minutes)
3. New pods reconstruct nonce state from audit database on startup
4. If entire node pool fails, cluster autoscaler provisions new nodes (3-5 minutes)

**Validation:** POST a test transaction and confirm replay protection is active (duplicate rejection works).

### 4.4 KYC Documents

1. S3 objects are replicated cross-region within 15 minutes of write (SLA)
2. If primary bucket is unavailable, application falls back to replica bucket
3. Application config updated to read from replica bucket ARN
4. No data loss possible — objects are write-once and versioned

**Validation:** Retrieve a known document hash from replica bucket and verify integrity.

### 4.5 NATS Event Bus

1. JetStream cluster detects member failure and elects new leader (< 30 seconds)
2. If full cluster loss, redeploy NATS from Helm chart with persistent volume recovery
3. Consumers replay from last acknowledged sequence number
4. Verify stream counts match pre-failure watermarks

**Validation:** Publish test event and confirm consumer receives it. Verify no sequence gaps in stream.

---

## 5. Quarterly DR Test Schedule

All DR tests are conducted with regulator witness notification. Test results are retained for 7 years per AUDITABLE principle.

| Quarter | Test Date  | Scope                                    | Regulator Witness              | Status    |
| ------- | ---------- | ---------------------------------------- | ------------------------------ | --------- |
| Q3 2026 | 2026-07-15 | Full failover — all P0 components        | Reserve Bank of Zimbabwe (RBZ) | Scheduled |
| Q4 2026 | 2026-10-15 | Audit DB promotion + API failover        | RBZ                            | Scheduled |
| Q1 2027 | 2027-01-15 | Full failover — all components (P0 + P1) | RBZ                            | Scheduled |
| Q2 2027 | 2027-04-15 | Backup restore-from-scratch test         | RBZ                            | Scheduled |

### DR Test Procedure

1. **Pre-test (T-7 days):**
   - Notify regulator witness of test date and scope
   - Verify secondary region infrastructure is current
   - Confirm on-call rotation covers test window
   - Take baseline metrics snapshot

2. **Execution (T-0):**
   - Simulate primary region failure (disable Route53 health check response)
   - Monitor automatic failover to secondary region
   - Execute manual recovery steps per component procedures above
   - Record all timestamps and actions in incident log

3. **Validation (T+1 hour):**
   - Run full integration test suite against secondary region
   - Verify all RTO targets were met (timestamps from incident log)
   - Verify all RPO targets were met (check replication lag at failover time)
   - Test data integrity across all components

4. **Failback (T+2 hours):**
   - Restore primary region
   - Execute failback procedure
   - Verify primary region health
   - Re-establish replication

5. **Post-test (T+5 business days):**
   - Generate DR test report with pass/fail per component
   - Review with regulator witness
   - File corrective actions for any failures
   - Update runbooks based on lessons learned

### Success Criteria

| Criterion                                | Threshold                    |
| ---------------------------------------- | ---------------------------- |
| API recovery time                        | <= 5 minutes                 |
| Audit DB recovery time                   | <= 30 minutes                |
| Audit DB data loss                       | <= 5 minutes of transactions |
| Replay Guard recovery time               | <= 5 minutes                 |
| KYC document availability                | <= 1 hour                    |
| NATS recovery time                       | <= 15 minutes                |
| NATS data loss                           | <= 1 minute of events        |
| Zero manual intervention for P0 failover | Required                     |
| Integration test pass rate post-failover | 100%                         |

---

## 6. Operational Monitoring

The following metrics are continuously monitored to detect conditions that would trigger recovery:

| Metric                      | Alert Threshold           | Response               |
| --------------------------- | ------------------------- | ---------------------- |
| Route53 health check status | Unhealthy for 30s         | Automatic DNS failover |
| RDS replication lag         | > 3 minutes               | Page on-call engineer  |
| S3 replication pending      | > 100 objects or > 1 hour | Alert operations team  |
| NATS stream lag             | > 10,000 messages         | Alert operations team  |
| Pod restart count           | > 3 in 5 minutes          | Auto-scale + alert     |

---

## 7. Board Sign-Off

By signing below, the board acknowledges and approves the RTO/RPO targets defined in this resolution and authorizes the engineering team to implement and maintain the required infrastructure.

| Name                                       | Role                     | Date             | Signature                                  |
| ------------------------------------------ | ------------------------ | ---------------- | ------------------------------------------ |
| \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** | Chief Executive Officer  | \***\*\_\_\*\*** | \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** |
| \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** | Chief Technology Officer | \***\*\_\_\*\*** | \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** |
| \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** | Chief Risk Officer       | \***\*\_\_\*\*** | \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** |
| \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** | Head of Compliance       | \***\*\_\_\*\*** | \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** |
| \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** | External Auditor         | \***\*\_\_\*\*** | \***\*\*\*\*\*\*\***\_\***\*\*\*\*\*\*\*** |

---

## 8. Document History

| Version | Date       | Author              | Change             |
| ------- | ---------- | ------------------- | ------------------ |
| 1.0     | 2026-05-08 | GTCX Infrastructure | Initial resolution |

---

_This document is subject to the GTCX Information Security Policy and must be stored in accordance with the AUDITABLE principle (7-year retention)._
