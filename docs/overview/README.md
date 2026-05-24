---
title: 'GTCX Infrastructure — Repository Overview'
status: 'current'
date: '2026-05-24'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'strategic'
tags: ['overview', 'metrics']
review_cycle: 'on-change'
---

# GTCX Infrastructure — Repository Overview

> **Last updated:** 2026-05-17
> **Latest audit:** [master-audit-2026-05-17.md](../audit/master-audit-2026-05-17.md)
> **Latest roadmap:** [10-10-roadmap-2026-05-17.md](../audit/10-10-roadmap-2026-05-17.md)
> **Single source of truth:** This document is the canonical entry point. If you find conflicting information, this document wins.

---

## 1. Executive Summary

**For a 10-year-old:** This repo contains the blueprints and tools for building a super-secure computer system that helps people in Africa trade minerals fairly.

**For a CTO:** GTCX Infrastructure is the deployment, operations, and security platform for the GTCX ecosystem. It provides Terraform modules for AWS infrastructure, Kubernetes manifests for container orchestration, Docker images for services, and operational tooling for compliance, anomaly detection, and chaos engineering. The platform is **production-live** in af-south-1 with staging and production environments, but has **critical security gaps** (Vault TLS disabled, container security violations) that block bank-grade certification.

**For an investor:** GTCX Infrastructure is the foundational layer that enables the entire GTCX platform to run securely and scale across African markets. It creates moat through deep ecosystem integration (23 repos onboarded to shared CI), operational maturity (SLOs, chaos tests, WORM audit storage), and regulatory readiness (SOC 2 checklist 70% complete). Current bank-grade score: **5.9/10 (capped)** — honest raw score 7.56/10. The 5.9 cap is caused by a single critical finding (Vault TLS disabled) that can be resolved in 1–2 weeks, uncapping the score to 7.56 and enabling rapid progression to 9.0+ within 3–4 months.

---

## 2. What This Repository Does

### 2.1 Core Capabilities

| Capability                  | What It Does                                                                                 | Who It Serves                        | Evidence                                |
| --------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------- |
| **Infrastructure as Code**  | Provisions VPC, EKS, RDS, WAF, WORM storage, and 20+ Terraform modules across 4 environments | Platform Engineering, DevOps         | `infra/terraform/modules/`              |
| **Container Orchestration** | K8s manifests with Kyverno policies, Linkerd mesh, network policies, and canary deployments  | SRE, Platform Engineering            | `infra/kubernetes/`                     |
| **Replay Protection**       | Offline nonce/timestamp/signature verification for Global South operations                   | gtcx-protocols, gtcx-markets         | `tools/replay-protection/`              |
| **Compliance Gateway**      | Regulatory compliance API for African fintech jurisdictions                                  | gtcx-platforms, external integrators | `tools/compliance-gateway/`             |
| **Deployment Guard**        | Typed deployment gating, canary evaluation, and audit verification                           | SRE, Platform Engineering            | `tools/deployment-guard/`               |
| **Anomaly Detection**       | ML-based audit anomaly detection for security events                                         | Security, Compliance                 | `tools/anomaly-detector/`               |
| **Chaos Engineering**       | Network partition, pod-kill, and AZ-failure resilience tests                                 | SRE, Platform Engineering            | `tools/chaos/`                          |
| **Shared CI Platform**      | SLSA L3 provenance, Cosign signing, ECR registries for 23 repos                              | All GTCX repos                       | `.github/workflows/slsa-provenance.yml` |
| **Secret Management**       | AWS Secrets Manager + External Secrets Operator + auto-rotation                              | All GTCX services                    | `infra/terraform/modules/secrets/`      |

### 2.2 Feature Matrix

| Feature                        | Status        | Evidence                               | Consumed By                  |
| ------------------------------ | ------------- | -------------------------------------- | ---------------------------- |
| VPC + 3-tier subnets           | Production    | `infra/terraform/modules/vpc/`         | All GTCX services            |
| EKS 1.31 + GPU nodes           | Production    | `infra/terraform/modules/eks/`         | All GTCX services            |
| Dual RDS (operational + audit) | Production    | `infra/terraform/modules/database/`    | gtcx-markets, gtcx-protocols |
| WAFv2 (OWASP + rate limit)     | Production    | `infra/terraform/modules/waf/`         | ALB ingress                  |
| WORM S3 audit storage          | Production    | `infra/terraform/modules/worm-audit/`  | Compliance, Security         |
| KMS signing (ECC P-256)        | Production    | `infra/terraform/modules/kms-signing/` | gtcx-platforms               |
| CloudTrail + GuardDuty         | Production    | `infra/terraform/modules/detective/`   | Security                     |
| AWS Config (13 rules)          | Production    | `infra/terraform/modules/compliance/`  | Compliance                   |
| Kyverno policies (7 rules)     | Production    | `infra/kubernetes/base/policies/`      | All K8s workloads            |
| Vault HA (TLS disabled)        | Staging       | `infra/terraform/modules/vault/`       | Secret management            |
| Replay protection verifier     | Production    | `tools/replay-protection/tests/`       | gtcx-protocols               |
| Anomaly detector               | Containerized | `tools/anomaly-detector/tests/`        | Security ops                 |

### 2.3 Business Value Proposition

**Investor:** GTCX Infrastructure creates compounding platform value through shared operational primitives. Every new repo onboarded (23/23 active) deepens the ecosystem moat. The shared CI platform with SLSA L3 provenance and Cosign image signing is not replicable in 90 days by a competitor — it required 6+ months of incremental hardening. The WORM audit storage and dual-DB separation (operational/audit) create institutional trust that accelerates pilot partnerships.

**Enterprise Buyer:** This repo reduces procurement risk by providing bank-grade infrastructure controls out-of-the-box: KMS encryption everywhere, IAM least-privilege with IRSA, VPC flow logs with 7-year retention, and CIS-hardened CloudTrail. The compliance gateway abstracts 11 African jurisdictions' regulatory requirements. Current gaps: Vault TLS must be enabled, pen-test must be completed, and SOC 2 Type 1 must be attained before enterprise procurement.

**African Sovereign / DFI:** The infrastructure is deployed in af-south-1 (South Africa) with Zimbabwe pilot expansion planned. Global South resilience is built into the design: replay-protection works offline, chaos tests validate network partition behavior, and adaptive low-bandwidth mode is in development. The dual-DB architecture ensures audit trails are tamper-evident and jurisdiction-independent. Sovereignty is preserved by keeping cryptographic keys in AWS KMS under local account control.

---

## 3. Core User Personas & Jobs-to-be-Done

#### Persona: Tendai — Platform Engineer — GTCX Internal

**Demographics:** 28–40 years old, highly technical, deploy authority for production, based in Harare/Johannesburg
**Goals:** Keep production running, deploy changes safely, pass security audits
**Pain Points:** Manual infrastructure drift, unclear rollback procedures, secret sprawl across repos
**Jobs-to-be-Done:**

1. _When_ I need to deploy a new service, _I want to_ use a pre-validated Terraform module, _so I can_ avoid misconfiguring security groups or IAM policies
2. _When_ a security alert fires, _I want to_ trace it to a specific K8s pod and Terraform resource, _so I can_ remediate within minutes
3. _When_ an auditor asks for evidence, _I want to_ generate a compliance report from CI, _so I can_ pass the audit without manual documentation

**How This Repo Helps:** Tendai uses `infra/terraform/modules/` to provision infrastructure with security defaults (encrypted storage, least-privilege IAM, VPC isolation). The `tools/deployment-guard/` enforces approval tickets for production changes. The `tools/scripts/audit-with-acceptance.mjs` generates SOC 2 evidence artifacts automatically.

**Workflow Unlocked:** Tendai receives a Jira ticket to onboard a new pilot bank. She copies the `template/` Terraform environment, adjusts variables for the bank's region, runs `terraform plan`, and attaches the plan output to the deployment-gate CLI. The gate checks for approval ticket GTCX-XXX, verifies no destructive changes, and allows apply. Within 30 minutes, the bank's isolated environment is live with WAF, Flow Logs, and WORM audit storage.

#### Persona: Dr. Nkosi — Compliance Officer — African Central Bank

**Demographics:** 45–60 years old, regulatory expertise, limited technical depth, decision authority over fintech licensing
**Goals:** Verify that GTCX meets local and international regulatory standards
**Pain Points:** Opaque infrastructure, inability to verify claims, long procurement cycles due to missing evidence
**Jobs-to-be-Done:**

1. _When_ evaluating a fintech platform, _I want to_ see third-party security validation, _so I can_ recommend licensing approval
2. _When_ reviewing audit trails, _I want to_ verify they are tamper-evident and jurisdiction-compliant, _so I can_ defend my recommendation
3. _When_ assessing cross-border data flows, _I want to_ confirm encryption and residency controls, _so I can_ approve international operations

**How This Repo Helps:** Dr. Nkosi reviews `docs/compliance/soc2-readiness-checklist.md` (70% complete) and `docs/security/nist-800-53-mapping.md` (53 controls mapped). The WORM audit storage module provides 7-year immutable logs. AWS Config compliance rules show real-time compliance status. The pen-test scope document (`docs/audit/pen-test-scope-2026.md`) demonstrates proactive security engagement.

**Workflow Unlocked:** Dr. Nkosi receives a sandbox application from GTCX. She opens `docs/compliance/soc2-readiness-checklist.md` and sees mapped controls with file-path citations. She verifies `docs/security/nist-800-53-mapping.md` for AC-2 (Account Management) and AU-6 (Audit Review). She checks the AWS Config dashboard and sees 8 managed rules all COMPLIANT. She notes the pen-test is pending and schedules a follow-up review for 90 days post-engagement.

#### Persona: Amina — Export Broker — Dar es Salaam

**Demographics:** 35–50 years old, commercially savvy, uses mobile-first tools, margin-focused
**Goals:** Move commodities quickly, verify provenance, minimize compliance overhead
**Pain Points:** Paper-based traceability, delayed payments due to documentation gaps, counterfeit goods
**Jobs-to-be-Done:**

1. _When_ I receive a mineral shipment, _I want to_ verify its digital provenance instantly, _so I can_ release payment without delay
2. _When_ a regulator audits my trade, _I want to_ produce tamper-evident records, _so I can_ avoid penalties
3. _When_ I trade across borders, _I want to_ trust the settlement infrastructure, _so I can_ expand to new markets

**How This Repo Helps:** Amina never interacts with this repo directly, but her entire workflow depends on it. The replay-protection verifier ensures her transactions cannot be replayed across borders. The KMS signing module cryptographically attests to commodity provenance. The compliance gateway automatically generates the regulatory reports she needs for each jurisdiction.

**Workflow Unlocked:** Amina scans a QR code on a cobalt shipment. The gtcx-protocols app verifies the KMS signature against `alias/gtcx-production-signing`. The compliance gateway checks the shipment against DRC and Tanzania regulations. Amina sees "COMPLIANT" in green and releases payment via mobile money. The transaction is logged to WORM audit storage with 7-year retention.

#### Persona: Claude (AI Agent) — Autonomous Contributor — GTCX Ecosystem

**Demographics:** Non-human, consumes structured documentation, executes within safety boundaries
**Goals:** Contribute code/docs safely, maintain ecosystem standards, avoid destructive operations
**Pain Points:** Ambiguous documentation, missing safety rules, stale information
**Jobs-to-be-Done:**

1. _When_ I start a new session, _I want to_ load the repo's identity and safety rules, _so I can_ operate within boundaries
2. _When_ I modify infrastructure, _I want to_ verify my changes against compliance and security policies, _so I can_ avoid introducing vulnerabilities
3. _When_ I generate documentation, _I want to_ follow the ecosystem standard automatically, _so I can_ produce consistent, machine-readable output

**How This Repo Helps:** Claude reads `CLAUDE.md` at repo root for identity and commands. The `docs/agents/` directory contains onboarding, safety rules (three-tier authority structure), and workflow checklists. The `.agent/` directory provides cross-LLM instruction sync. The docs-standard validator (`tools/scripts/docs-standard-validator.mjs`) ensures generated docs comply with naming, frontmatter, and linking rules.

**Workflow Unlocked:** Claude starts a session and reads `CLAUDE.md` → `docs/agents/onboarding/orientation.md` → `docs/agents/workflows/agent-safety-rules.md`. It learns that destructive operations (drop DB, delete cluster) require explicit user instruction. It proposes a Terraform change, runs `terraform plan`, and passes the output to the deployment-gate CLI. The gate requires `--approval-ticket=GTCX-XXX`. Claude asks the user for the ticket before proceeding.

---

## 4. Market Context & Opportunity

### 4.1 Addressable Market

- **TAM:** Global trade finance gap for raw materials is estimated at $1.5–2.5 trillion annually (ICC Global Survey on Trade Finance 2023). African commodity trade represents ~15% of this gap.
- **SAM:** African critical minerals trade (cobalt, lithium, copper, gold) — $150–200B annually, with 60–70% involving informal or semi-formal supply chains lacking traceability.
- **SOM:** GTCX target capture — 5% of African critical minerals trade within 5 years, representing $7.5–10B in annual transaction volume facilitated by the platform.

### 4.2 Market Pain Points

1. **Traceability gap:** 80% of African cobalt passes through informal channels with no digital provenance (World Bank 2022). This enables child labor, environmental damage, and capital flight.
2. **Compliance burden:** Exporters spend 15–25% of transaction value on documentation and regulatory compliance (AfCFTA Implementation Report 2023). Paper-based processes create delays of 30–90 days.
3. **Counterparty risk:** Without verifiable audit trails, buyers cannot trust seller claims. This increases financing costs by 200–500 basis points for frontier market trade.
4. **Infrastructure fragility:** Intermittent connectivity, power outages, and regulatory fragmentation make cloud-first solutions from Western vendors unreliable or non-compliant with data residency requirements.

### 4.3 Category-Defining Opportunity

If GTCX succeeds, it becomes the **operational backbone for ethical commodity trade in Africa** — the AWS + Stripe + Chainalysis for frontier markets. If it fails, the status quo persists: informal trade dominates, compliance costs remain prohibitive, and African economies leak value to offshore intermediaries.

This repo is the foundation of that success. Without production-grade infrastructure, none of the downstream GTCX products (markets, protocols, intelligence) can operate safely or scale. The dual-DB architecture, WORM audit storage, and offline replay protection are not features — they are prerequisites for institutional trust.

---

## 5. Go-to-Market Enablers

### 5.1 Pilot Readiness

**Ready for sandbox pilot:** Yes — Zimbabwe testnet is active with public API enabled for evaluation.
**Ready for production pilot:** Partial — staging is fully deployed (76 resources), production backend is bootstrapped (S3 + DynamoDB locks), but Vault TLS must be enabled and pen-test completed before bank/government production use.

### 5.2 Regulator Engagement

Evidence available for regulator review:

- SOC 2 readiness checklist (70% complete, `docs/compliance/soc2-readiness-checklist.md`)
- NIST 800-53 mapping (53 controls, `docs/security/nist-800-53-mapping.md`)
- ISO 27001 scope document (`docs/gtm/regulatory/iso27001-isms-scope.md`)
- AWS Config compliance rules (13 rules, all COMPLIANT)
- CloudTrail production logs (KMS-encrypted, 7-year retention)
- Pen-test scope and vendor shortlist (`docs/audit/pen-test-scope-2026.md`)

### 5.3 Partner Integration

Integration patterns supported:

- **npm packages:** `@gtcx/replay-protection`, `@gtcx/compliance-gateway`, `@gtcx/deployment-guard`
- **Terraform modules:** 20+ modules published as local references (future: Terraform Registry)
- **Docker images:** Multi-stage builds for Node.js services, published to ECR with scan-on-push
- **K8s manifests:** Kustomize overlays for development/staging/production/testnet
- **API contracts:** OpenAPI specs in `docs/api/` (where applicable)

### 5.4 Sales Collateral

Technical specifications available for sales reference:

- `docs/architecture/anomaly-detection.md`
- `docs/engineering/gtcx-platforms-m3-contract.md`
- `docs/security/security-architecture.md`
- `docs/operations/runbooks/` (25 runbooks)

---

## 6. Technical Overview

### 6.1 Technology Stack

| Layer                   | Technology                          | Version   | Purpose                           |
| ----------------------- | ----------------------------------- | --------- | --------------------------------- |
| Language (Primary)      | TypeScript                          | 5.x       | Tooling, automation, services     |
| Language (Secondary)    | Go                                  | 1.22+     | Terraform provider tests          |
| Runtime                 | Node.js                             | >= 20.0.0 | TypeScript execution              |
| Package Manager         | pnpm                                | 9.15.0    | Workspace monorepo                |
| Build Tool              | Turbo                               | 2.x       | Task orchestration                |
| Testing                 | Node.js native test runner + c8     | 20.x      | Unit + coverage                   |
| IaC                     | Terraform                           | 1.7+      | AWS infrastructure                |
| Container Orchestration | Kubernetes (EKS)                    | 1.31      | Service deployment                |
| Policy Engine           | Kyverno                             | 1.11+     | Admission control                 |
| Service Mesh            | Linkerd                             | 2.14+     | mTLS (pending ADR-007)            |
| Observability           | Prometheus + Grafana + Tempo + Loki | Latest    | Metrics, dashboards, traces, logs |
| Cryptography            | AWS KMS (ECC P-256)                 | —         | Signing, encryption               |
| Secret Management       | AWS Secrets Manager + ESO           | —         | Secret rotation, K8s sync         |

### 6.2 Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        GTCX ECOSYSTEM                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ gtcx-markets│  │gtcx-protocols│  │gtcx-intelligence│          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│              ┌───────────┴───────────┐                          │
│              │   GTCX INFRASTRUCTURE  │  ← THIS REPO             │
│              │  (Shared CI / Platform) │                          │
│              └───────────┬───────────┘                          │
│                          │                                       │
│     ┌────────────────────┼────────────────────┐                 │
│     │                    │                    │                  │
│  ┌──┴──┐            ┌────┴────┐         ┌────┴────┐            │
│  │ AWS  │            │ Docker  │         │ K8s/EKS │            │
│  │(af-south-1)│      │ Images  │         │(Kyverno)│            │
│  └──┬──┘            └────┬────┘         └────┬────┘            │
│     │                    │                    │                  │
│  VPC│EKS│RDS│WAF│WORM  ECR Registry      Linkerd Mesh          │
│  CloudTrail│Config│KMS  (scan-on-push)   (pending)              │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Package Inventory

| Package            | Path                        | Purpose                              | Maturity   | Coverage              | Key Consumer         |
| ------------------ | --------------------------- | ------------------------------------ | ---------- | --------------------- | -------------------- |
| replay-protection  | `tools/replay-protection/`  | Offline nonce/signature verification | Production | 85% stmts, 69% branch | gtcx-protocols       |
| compliance-gateway | `tools/compliance-gateway/` | Regulatory compliance API            | Beta       | Measured              | gtcx-platforms       |
| deployment-guard   | `tools/deployment-guard/`   | Deployment gating + canary eval      | Beta       | Measured              | SRE                  |
| anomaly-detector   | `tools/anomaly-detector/`   | ML-based audit anomaly detection     | Beta       | Basic                 | Security ops         |
| compliance-data    | `tools/compliance-data/`    | Jurisdiction compliance datasets     | Production | N/A                   | compliance-gateway   |
| infra-migrations   | `infra/migrations/`         | Database migration tooling           | Production | N/A                   | Platform Engineering |

### 6.4 Ecosystem Integration Map

| Downstream Repo   | What It Consumes                             | Integration Pattern               |
| ----------------- | -------------------------------------------- | --------------------------------- |
| gtcx-platforms    | KMS signing, IRSA role, ECR registry         | Terraform output + IAM trust      |
| gtcx-protocols    | replay-protection (npm), shared CI           | npm dependency + GitHub Actions   |
| gtcx-intelligence | ECR registry, shared CI role                 | IAM + ECR pull                    |
| gtcx-markets      | compliance-gateway (future), shared CI       | npm dependency (planned)          |
| All repos (23)    | Shared CI composite actions, SLSA provenance | GitHub Actions reusable workflows |

---

## 7. Compliance, Security & Bank-Grade Posture

### 7.1 Current Certification State

| Standard / Framework          | Status      | Evidence                                                               | Gap                                               |
| ----------------------------- | ----------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| FIPS 140-3                    | Partial     | `use_fips_endpoint` enabled; af-south-1 unavailable                    | af-south-1 lacks FIPS endpoints                   |
| SOC 2 Type 1                  | In Progress | Checklist 70% complete (`docs/compliance/soc2-readiness-checklist.md`) | Auditor not engaged; pen-test pending             |
| STRIDE Threat Model           | Present     | `docs/security/threat-model.md`                                        | Not independently validated                       |
| Penetration Test              | Pending     | Scope defined, vendor shortlist ready                                  | RFP not sent                                      |
| SLSA Build L3                 | Active      | `slsa-provenance.yml` generates attestations                           | Not all packages published with provenance        |
| Code Coverage (critical path) | Partial     | replay-protection 85%; redis-nonce-store 22%                           | redis-nonce-store and did-verify need improvement |

**Honest bank-grade scores (from master audit §9):**

| Dimension             | Score      | Rating                              |
| --------------------- | ---------- | ----------------------------------- |
| Core (capped)         | **5.9/10** | Prototype with notable control gaps |
| Security              | 7.5/10     | Credible beta                       |
| Enterprise Readiness  | 7.8/10     | Credible beta                       |
| Investor Lens         | 7.4/10     | Credible beta                       |
| Enterprise Buyer Lens | 7.52/10    | Credible beta                       |
| Sovereign / DFI Lens  | 7.65/10    | Credible beta                       |

### 7.2 Security Controls

Key controls active in production:

- **Authentication:** IRSA (pod-level IAM), GitHub OIDC (CI auth), MFA enforcement policy
- **Encryption:** KMS at rest (RDS, S3, EBS, ECR), TLS 1.2+ on ALB, RDS SSL enforced
- **Network:** 3-tier VPC, VPC endpoints, WAFv2, NetworkPolicies, VPC Flow Logs
- **Audit:** CloudTrail (KMS-encrypted, 7yr retention), GuardDuty, AWS Config (13 rules)
- **Containers:** Kyverno policies (non-root, read-only fs, drop ALL, signed images)
- **Supply Chain:** SLSA L3 provenance, Cosign signing, SBOM generation, ECR scan-on-push
- **Secrets:** AWS Secrets Manager, External Secrets Operator, 30-day Lambda rotation

**Critical gaps:**

- Vault TLS disabled (`infra/terraform/modules/vault/main.tf:219`)
- 3 containers violate Kyverno policies (Promtail root, Cloudflared/Postgres mutable fs)
- No pen-test executed

### 7.3 Audit Trail

| Document                                                                                  | Date       | Score                     |
| ----------------------------------------------------------------------------------------- | ---------- | ------------------------- |
| [master-audit-2026-05-17.md](../audit/master-audit-2026-05-17.md)                         | 2026-05-17 | 5.9/10 (capped)           |
| [master-audit-2026-05-12-updated.md](../audit/archive/master-audit-2026-05-12-updated.md) | 2026-05-12 | 8.85/10 (prior, inflated) |
| [10-10-roadmap-2026-05-17.md](../audit/10-10-roadmap-2026-05-17.md)                       | 2026-05-17 | Target: 10.0              |

---

## 8. Onboarding

### 8.1 For New Developers

1. **Prerequisites:** Node.js >= 20.0.0, pnpm 9.15.0, Terraform >= 1.7, AWS CLI, kubectl
2. **Clone and install:** `git clone` → `pnpm install`
3. **Build:** `pnpm build`
4. **Run tests:** `pnpm test` (quick validation) → `pnpm test:full` (comprehensive)
5. **Run verification:** `bash infra/scripts/validate.sh quick`
6. **Read ADRs:** `docs/architecture/decisions/` — start with ADR-007 (mTLS mesh) and ADR-009 (deprecation)
7. **Pick a first issue:** Look for `good-first-issue` labels or start with docs-standard improvements

### 8.2 For Autonomous Agents

- **Conventions:** Conventional commits (`type(scope): subject`), lowercase imperative, no emojis
- **Architecture boundaries:** Never modify migrations that have run in any environment; never apply Terraform to production without `--approval-ticket=GTCX-XXX`
- **Verification gates:** `pnpm test`, `pnpm lint`, `pnpm typecheck` must pass; docs-standard validator must pass
- **Safety rules:** Read `docs/agents/workflows/agent-safety-rules.md` — three-tier authority (Autonomous / Requires Approval / Never)
- **Entry point:** `CLAUDE.md` at repo root

### 8.3 For Business Stakeholders

- **What this repo enables:** Secure, scalable infrastructure for the entire GTCX ecosystem across African markets
- **When it will be ready for your use case:** Sandbox pilots ready now; production pilots require M1 completion (Vault TLS + pen-test engagement, 1–2 weeks)
- **What risks remain:** Vault TLS disabled (being fixed); no pen-test yet (RFP ready); SOC 2 Type 1 pending (3–6 months)
- **Who to contact:** Platform Engineering for technical questions; Security Lead for compliance questions

---

## 9. Technical Roadmap

### 9.1 Current Milestone

**M0 → M1: Cap Lift** (target: Core 5.9 → 7.0)

The repo is executing M1, focused on resolving the critical findings that cap the bank-grade score at 5.9.

Key deliverables:

- Enable Vault TLS
- Fix 3 container security context violations
- Send pen-test RFP

### 9.2 Next 90 Days

1. **Week 1–2:** Vault TLS + container hardening (M1 completion)
2. **Week 3–8:** Coverage improvements, eval pipeline, cross-repo package adoption, adaptive low-bandwidth (M2 engineering)
3. **Week 9–12:** Pen-test execution + initial remediation, SOC 2 gap analysis kickoff (M3 external)

### 9.3 Path to 10.0

Per the [10/10 roadmap](../audit/10-10-roadmap-2026-05-17.md):

| Milestone         | Target Core | Key Unlocks                                                      |
| ----------------- | ----------- | ---------------------------------------------------------------- |
| M1: Cap Lift      | 7.0         | Vault TLS, container fixes, pen-test RFP sent                    |
| M2: Hardening     | 8.0         | Coverage ≥80%, eval pipeline CI, package adoption, low-bandwidth |
| M3: Certification | 9.0         | Pen-test clean, SOC 2 gap clean, mTLS mesh, anomaly production   |
| M4: Reference     | 10.0        | SOC 2 Type 1, red team, bug bounty, 99.99% uptime                |

**Critical path:** Vault TLS → pen-test → SOC 2 Type 1 → 10.0
**Total estimated time:** 6–9 months

---

## 10. Reference & Navigation

### 10.1 Key Documents

| Document                                                   | Purpose                  | Audience                         |
| ---------------------------------------------------------- | ------------------------ | -------------------------------- |
| `docs/audit/master-audit-2026-05-17.md`                    | Bank-grade certification | Security, compliance, investors  |
| `docs/audit/10-10-roadmap-2026-05-17.md`                   | Path to 10.0             | Engineering, product, executives |
| `docs/architecture/system-architecture-spec.md`            | System architecture      | Engineers, architects            |
| `docs/security/threat-model.md`                            | Threat model             | Security engineers, auditors     |
| `docs/compliance/soc2-readiness-checklist.md`              | SOC 2 evidence           | Compliance, buyers               |
| `docs/gtm/regulatory/regulatory-notification-templates.md` | Regulatory templates     | Compliance, legal                |
| `docs/operations/runbooks/`                                | Operational runbooks     | SRE, on-call engineers           |
| `docs/architecture/decisions/adr-index.md`                 | Architecture decisions   | Engineers, architects            |
| `CLAUDE.md`                                                | Agent onboarding         | AI agents, new developers        |
| `CONTRIBUTING.md`                                          | Contribution guide       | Open-source contributors         |

### 10.2 Contact & Escalation

| Role                | Responsibility             | Contact              |
| ------------------- | -------------------------- | -------------------- |
| Repo Lead           | Technical ownership        | Platform Engineering |
| Security Reviewer   | Security-sensitive changes | Security Lead        |
| Compliance Reviewer | Compliance evidence        | Compliance Officer   |
| Product Owner       | Feature prioritization     | Product Lead         |

---

_This document is generated from repo state and audit artifacts. For the canonical source of truth on scores and findings, see [master-audit-2026-05-17.md](../audit/master-audit-2026-05-17.md)._
