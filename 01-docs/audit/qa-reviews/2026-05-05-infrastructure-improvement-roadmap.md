---
title: 'Infrastructure QA Review: Roadmap for Improvement & Hardening'
status: 'draft'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Infrastructure QA Review: Roadmap for Improvement & Hardening

- **Date:** 2026-05-05
- **Status:** Draft / Recommendation
- **Reviewer:** Gemini CLI
- **Scope:** GTCX Infrastructure (Terraform, K8s, Docker, Security, Operations)

## Overview

Following a comprehensive audit of the `gtcx-infrastructure` repository, this document outlines strategic recommendations for security hardening, future-proofing, and operational excellence. While the current implementation is highly mature (Production Ready), these areas represent the next evolution of the GTCX ecosystem.

---

## 1. Security Hardening (Defense in Depth)

### 1.1 Policy-as-Code (Admission Control)

**Current State:** Image scanning is performed via Trivy in the deployment pipeline.
**Recommendation:** Implement **Kyverno** or **OPA/Gatekeeper** within the EKS cluster.
**Impact:** Enforces security best practices at runtime (e.g., preventing privileged containers, requiring resource limits, and enforcing network labels) rather than relying solely on shift-left scanning.

### 1.2 Secret Management Maturity

**Current State:** Secrets are managed via `.env` files and `init-secrets.sh` scripts.
**Recommendation:** Transition to the **External Secrets Operator (ESO)**.
**Impact:** Integrates directly with AWS Secrets Manager. Kubernetes pulls secrets as native `Secret` objects without intermediate shell scripts, reducing the risk of credential exposure in CI logs or local environments.

### 1.3 Network Micro-segmentation

**Current State:** Basic network connectivity within the VPC.
**Recommendation:** Implement **Kubernetes NetworkPolicies** or a Service Mesh (e.g., Linkerd).
**Impact:** Enforces Zero-Trust networking. Limits the "blast radius" by ensuring that a compromise in one service (e.g., `protocols`) does not allow lateral movement to sensitive services like `crypto` or the audit databases.

### 1.4 Immutable Audit DB Enforcement

**Current State:** "Never drop `gtcx_audit`" is a documented human rule.
**Recommendation:** Enforce via **RDS Delete Protection** and **IAM Service Control Policies (SCPs)**.
**Impact:** Prevents accidental or malicious deletion of the audit trail, even by users with high-level administrative access, without multi-party authorization.

---

## 2. Future-Proofing & Scalability

### 2.1 Dry-er Terraform (Terragrunt)

**Current State:** Terraform is organized into environment folders.
**Recommendation:** Introduce **Terragrunt**.
**Impact:** Essential for scaling to multiple geographic pilots (ADR-005). Terragrunt keeps the HCL code DRY, simplifies multi-account/multi-region state management, and makes it easier to propagate changes across environments.

### 2.2 Cloud-Agnostic Abstraction (Crossplane)

**Current State:** Infrastructure is tightly coupled to AWS primitives (EKS, RDS, IRSA).
**Recommendation:** Evaluate **Crossplane** for infrastructure management.
**Impact:** Supports the "Sovereign Accessibility" principle (P24). Allows GTCX to be deployed on-premises or on alternative cloud providers in jurisdictions with strict data residency laws without a total rewrite of the IaC layer.

### 2.3 Transition from Bash to a Compiled CLI

**Current State:** Critical deployment and setup logic lives in `deploy.sh` and `setup.sh`.
**Recommendation:** Rewrite operational tooling in **Go** (Cobra) or **Python**.
**Impact:** Improves testability, error handling, and maintainability. Complex logic like canary rollouts and multi-stage rollbacks is safer in a typed language with a robust testing framework.

---

## 3. Operational Excellence

### 3.1 Shadow Migrations & Sandbox

**Current State:** Migrations are run directly against target environments.
**Recommendation:** Implement a **Migration Sandbox** CI job.
**Impact:** Automatically clones the production database snapshot in a temporary environment to test migrations against real-world data volumes before they are applied to production.

### 3.2 Chaos Engineering

**Current State:** `dr-test.sh` exists for manual disaster recovery verification.
**Recommendation:** Integrate **Chaos Mesh** or **AWS Fault Injection Simulator (FIS)**.
**Impact:** Validates the `RESILIENT` principle (P12) by proactively injecting failures (network latency, pod kills) in Staging to ensure automated recovery mechanisms work as expected.

### 3.3 FinOps & Cost Governance

**Current State:** Standard AWS tagging.
**Recommendation:** Implement **Karpenter** for EKS and automated cost-allocation dashboards.
**Impact:** Optimizes compute costs and provides granular visibility into the infrastructure spend per pilot jurisdiction.

---

## 4. Documentation & DX

### 4.1 Documentation Hygiene

**Current State:** 6+ `TODO` and `PLACEHOLDER` tags identified in `01-docs/`.
**Recommendation:** Execute a "Doc Hygiene" sprint to clear placeholders and ensure all `agile-pm` structures are fully populated.
**Impact:** Maintains the "high-signal" standard of the repository and ensures that contributors have accurate information at every level.

### 4.2 Ephemeral Preview Environments

**Current State:** Local development via Docker Compose.
**Recommendation:** Automate the creation of **Preview Environments** on every Pull Request.
**Impact:** Allows stakeholders and QA to test features in a production-like K8s environment before the code is merged to the main branch.

---

## Summary of Priorities

| Priority   | Area        | Task                                        |
| :--------- | :---------- | :------------------------------------------ |
| **High**   | Security    | External Secrets Operator & NetworkPolicies |
| **High**   | Security    | Immutable Audit DB (SCPs)                   |
| **Medium** | Scalability | Terragrunt for Multi-Jurisdiction           |
| **Medium** | Operations  | Migration Sandbox                           |
| **Low**    | DX          | Compiled CLI for Ops Tooling                |
