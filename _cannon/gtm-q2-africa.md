# GTM Q2 Africa — gtcx-infrastructure

**Date:** 2026-03-09
**Scope:** 4-infrastructure — how this repo's work directly enables or blocks Q2 Ghana GTM, and the one thing it must deliver

---

## The Q2 Goal and Infrastructure's Role

Target: verified metric tons of commodity transacted through a cooperative proof point in Ghana. The cooperative demonstrates the technology to aggregators and DFIs. The infrastructure layer is the invisible enabler — if it works, no one notices. If it breaks, the pilot fails publicly.

The cooperative proof point requires: a working deployment that cooperatives can actually use, data that regulators and DFIs can trust, and a system that survives Ghana's network conditions (unreliable connectivity, 2G/3G mobile, intermittent power).

---

## What Infrastructure Must Be Live for the Cooperative Proof Point

### 1. A Running Deployment (Currently Blocked)

Right now, there is no environment that can be deployed to. The Terraform has VPC and database modules but no EKS cluster. The K8s manifests have no cluster to apply to. The deploy script has no cluster to target.

**Minimum viable infrastructure for Q2:**

- AWS EKS cluster in af-south-1 (Cape Town) — closest region to Ghana, lowest latency
- ALB with ACM-managed TLS certificate
- ECR repositories for api and crypto images
- RDS operational + audit instances (via the existing database module)
- VPC wiring all of the above together (via the existing vpc module)

None of this is Terraform code yet. It is 2–3 weeks of work.

### 2. A Database That Can Be Trusted

The audit database design (separate RDS instance, immutable, 90-day retention) is the right architecture for a compliance product that needs to produce verifiable records for regulators. But the init scripts that create the schema don't exist. The database starts empty.

For Q2, the audit database must have: schema for trade events, GCI compliance records, PANX consensus results, and GeoTag location attestations. This is the evidence chain that DFIs audit before disbursing financing.

### 3. Observability Sufficient for Pilot Operations

During a pilot, something will break. Without observability, the team is blind. The Prometheus + Grafana + Loki stack is designed and configured — but no dashboards, no alert rules, no on-call routing exist. For Q2, minimum viable observability is:

- Alert on pod restarts
- Alert on database connection failures
- Dashboard showing transaction throughput by cooperative
- Log aggregation queryable by support team

### 4. Network Connectivity for Edge Operations

The edge node concept (SQLite, 30-day offline, sync endpoint) is designed for cooperative offices without reliable internet. This is not a nice-to-have for Ghana — it is a necessity. Cooperative agents will register commodity lots, run GeoTag attestations, and issue GCI compliance scores while offline. The edge runtime needs to be buildable and deployable before the pilot launches. Currently, it is a README and an empty Dockerfile target.

---

## What Is NOT Ready in This Repo That Blocks Q2

| Gap                                     | Severity | Blocks What                                     |
| --------------------------------------- | -------- | ----------------------------------------------- |
| No EKS Terraform module                 | Critical | Everything runs on a cluster that doesn't exist |
| No ALB/ACM Terraform                    | Critical | Platform not reachable externally               |
| No ECR repositories                     | Critical | No place to push built images                   |
| No instantiated ghana-pilot environment | Critical | Deployment target undefined                     |
| No DB init scripts                      | High     | Database starts with no schema                  |
| Edge node Dockerfile missing            | High     | Cooperative offline capability absent           |
| No ANISA/PANX K8s manifests             | High     | Intelligence unavailable at pilot               |
| VaultMark, PvP K8s manifests missing    | Medium   | Two protocols undeployable                      |
| No Grafana dashboards                   | Medium   | Blind during pilot operations                   |
| No alert rules                          | Medium   | Failures silent until user reports them         |
| Staging not differentiated              | Low      | No safe pre-production validation gate          |

---

## Priority Q2 Tasks for This Repo

Listed in execution sequence — each unblocks the next:

**Week 1: Make deployment possible**

1. Write EKS Terraform module — managed node groups, private subnets, OIDC for IRSA
2. Write ALB Terraform module — internet-facing, ACM certificate, HTTPS redirect
3. Write ECR Terraform module — repositories for api, crypto, intelligence services
4. Instantiate `environments/ghana-pilot/` with af-south-1 region

**Week 2: Make the deployment complete** 5. Write DB init scripts — schema for audit events, compliance records, trade data 6. Add VaultMark and PvP K8s manifests (copy tradepass.yaml pattern) 7. Add network policy rules for any new services 8. Build and push api/crypto images to ECR as proof of pipeline

**Week 3: Make the deployment observable and resilient** 9. Add Grafana dashboard — pod health, transaction throughput, error rates 10. Add Prometheus alert rules — pod restarts, DB connections, latency 11. Fix canary error detection in deploy.sh (Prometheus query, not grep) 12. First full deploy to ghana-pilot environment with approval ticket

**Week 4: Edge capability** 13. Implement the edge-runtime Dockerfile target 14. Define SQLite schema matching the main database schema 15. Implement the sync protocol between edge and central

---

## The One Thing This Repo Must Deliver to Unblock Q2

**A complete, runnable `environments/ghana-pilot/` Terraform environment.**

Everything else — dashboards, edge nodes, intelligence services — is important but can be done in parallel or after initial deployment. The single blocker is the absence of a K8s cluster with a load balancer and a database that GTCX services can be deployed to and reached from.

Without this, every other team's work — 6-platforms backend services, 5-intelligence integration, 3-protocols deployments — has nowhere to run in Ghana.

The VPC module is done. The database module is done. What's missing is the EKS cluster that connects them and the ALB that exposes the result to the internet. This is a concrete, scoped, unambiguous deliverable. It represents approximately 2 weeks of infrastructure work. It is the infrastructure team's entire Q2 mandate.

---

## Ghana-Specific Infrastructure Considerations

**AWS af-south-1 (Cape Town) limitations:** No ElastiCache, no MSK (Kafka), limited instance types compared to us-east-1. The Terraform modules must be written to work with the service subset available in Cape Town.

**Latency reality:** Johannesburg → Accra is ~30ms. Not ideal for real-time consensus operations. PANX consensus flows should be designed for asynchronous operation, not synchronous HTTP round-trips from Ghana to South Africa.

**Mobile network conditions:** Cooperative agents will be on 2G/3G. API responses > 100KB will fail. The edge node is not optional — it is the primary interface for field operations. Infrastructure must support offline-first from day one, not as a later optimization.

**Power reliability:** Edge nodes must survive power loss and restart cleanly. SQLite as the edge store (designed in compose) handles this correctly. The sync protocol must be idempotent — network reconnection after power outage should not duplicate or lose transactions.

**Data sovereignty:** Ghana's data protection law (Act 843) requires that personal data on Ghanaian nationals be stored in Ghana or in countries with adequate protection frameworks. South Africa (af-south-1) is likely compliant but should be confirmed before the pilot. This is a legal requirement that the infrastructure configuration must satisfy, not just a design preference.
