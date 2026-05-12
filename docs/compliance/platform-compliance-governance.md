# Platform Compliance Governance

**Date:** 2026-05-12
**Owner:** GTCX Infrastructure
**Applies to:** All repos in `gtcx-ecosystem/*`

---

## Principle

Compliance is **inherited at the platform layer**, not duplicated per service.

Just as AWS customers inherit AWS SOC 2 / ISO 27001 for infrastructure and only add application-layer controls, every GTCX service repo inherits `gtcx-infrastructure` platform compliance and only maintains its service-specific layer.

---

## Ownership Matrix

| Compliance Layer    | Owned By                            | What It Covers                                                            | Artifact Location                                       |
| ------------------- | ----------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- |
| **Platform**        | `gtcx-infrastructure`               | VPC, EKS, RDS, WAF, CI/CD, IAM, NetworkPolicies, observability, backup/DR | `docs/compliance/platform/`                             |
| **Shared Services** | `gtcx-infrastructure`               | Compliance gateway, replay protection, audit logging, anomaly detection   | `tools/compliance-gateway/`, `tools/replay-protection/` |
| **Application**     | Each service repo                   | Business logic, API endpoints, data handling, feature-specific privacy    | `docs/compliance/service/` in each repo                 |
| **Customer-Facing** | `gtcx-infrastructure` (coordinated) | DPA templates, trust center, security.txt, responsible disclosure         | `docs/compliance/customer-facing/`                      |

---

## What Service Repos MUST Maintain

Each service repo (e.g., `gtcx-intelligence`, `gtcx-agentic`, `gtcx-agile`) is responsible for:

1. **Application-level risk assessment** — threats specific to their domain
2. **Service-specific API pen-test findings** — business logic bugs, auth bypasses in their handlers
3. **Data handling documentation** — what data they process, retention policies, deletion procedures
4. **Feature privacy impact** — any user-facing feature that collects or exposes PII
5. **Service-level SLOs and error budgets** — availability targets for their pods

Each service repo is **NOT** responsible for:

- Infrastructure pen-testing (EKS, VPC, WAF, RDS) — inherited from platform
- CI/CD security (artifact signing, secret scanning, image verification) — inherited from platform
- Network segmentation policies — inherited from platform
- Backup/DR procedures for shared resources — inherited from platform
- IAM/OIDC provider security — inherited from platform

---

## Compliance Inheritance Model

### For SOC 2

```
┌─────────────────────────────────────────────────────────────┐
│  GTCX Platform SOC 2 Type II Report                         │
│  (gtcx-infrastructure owns)                                 │
│  Covers: CC6 (Logical access), CC7 (System operations),     │
│  CC8 (Change management), CC9 (Risk mitigation)             │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ inherits
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────┴────┐           ┌────┴────┐           ┌────┴────┐
   │g tcx-   │           │g tcx-   │           │g tcx-   │
   │intellig │           │agentic  │           │agile    │
   │ence     │           │         │           │         │
   └────┬────┘           └────┬────┘           └────┬────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ Service Addendums │
                    │ (each repo owns)  │
                    │ CC2 (Communicati  │
                    │ on), CC3 (Risk),  │
                    │ CC4 (Monitoring)  │
                    └───────────────────┘
```

### For Pen-Test

| Test Type               | Owned By              | Scope                                                                                  |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------- |
| Platform pen-test       | `gtcx-infrastructure` | EKS cluster, ALB, WAF, RDS, Redis, CI/CD, container images                             |
| Shared service pen-test | `gtcx-infrastructure` | Compliance gateway (`/v1/query`, `/v1/tools`), replay protection (`/v1/replay/verify`) |
| Service app pen-test    | Each service repo     | Their API handlers, business logic, WebSocket events                                   |

**Rule:** A service repo does not commission a separate infrastructure pen-test. They extend the platform pen-test with their application surface.

---

## Artifact Publishing

`gtcx-infrastructure` publishes compliance artifacts as **GitHub Releases** with `compliance/` prefix:

| Artifact                    | Tag Pattern                   | Consumers                                 |
| --------------------------- | ----------------------------- | ----------------------------------------- |
| Platform pen-test report    | `compliance/pen-test-YYYY`    | All service repos, DFI partners, auditors |
| SOC 2 Type I report         | `compliance/soc2-type1-YYYY`  | Enterprise buyers, auditors               |
| SOC 2 Type II report        | `compliance/soc2-type2-YYYY`  | Enterprise buyers, regulators             |
| Compliance gateway pen-test | `compliance/cg-pen-test-YYYY` | Service repos using the gateway           |
| Shared policies (DPA, MSA)  | `compliance/policies-YYYY`    | Legal, sales, procurement                 |

Service repos reference these in their own compliance docs:

```markdown
## Inherited Platform Compliance

- Platform SOC 2 Type I: [gtcx-infrastructure release compliance/soc2-type1-2026](link)
- Platform pen-test: [gtcx-infrastructure release compliance/pen-test-2026](link)
- Shared CI security: [gtcx-infrastructure docs](link)

## Service-Specific Compliance

- API pen-test: [internal report dated YYYY-MM-DD]
- Data handling: [docs/compliance/service/data-handling.md]
```

---

## Onboarding Checklist for New Service Repos

When a new service repo joins `gtcx-ecosystem/*`, the repo owner must:

- [ ] Set `AWS_ROLE_ARN` and `ECR_REGISTRY` GitHub variables (points to `gtcx-infrastructure` shared role)
- [ ] Copy `docs/compliance/service/README.md` template from `gtcx-infrastructure`
- [ ] Document service-specific data handling and API surface
- [ ] Add service to the platform NetworkPolicy allow-list (PR to `gtcx-infrastructure`)
- [ ] Confirm pod security context (non-root, read-only rootfs) in their K8s manifests
- [ ] Reference platform compliance artifacts in their security docs

They do **NOT** need to:

- Commission their own infrastructure pen-test
- Get their own SOC 2 for shared platform controls
- Maintain duplicate copies of platform policies

---

## Why Not `baseline-os`, `gtcx-agentic`, or `gtcx-agile`?

| Repo                  | Role                                          | Why It Shouldn't Own Platform Compliance                                                                          |
| --------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `baseline-os`         | AI-assisted development acceleration platform | Application-layer dev tooling. Does not control AWS account, K8s cluster, or network boundary.                    |
| `gtcx-agentic`        | Agentic AI service                            | Consumes platform. Owns agent logic, not infrastructure.                                                          |
| `gtcx-agile`          | Agile/project management service              | Consumes platform. Owns project data, not infrastructure.                                                         |
| `gtcx-infrastructure` | Platform layer                                | Controls the security boundary. Already owns all compliance docs, threat models, IaC, CI/CD, and shared services. |

---

## Decision Log

| Date       | Decision                                                 | Rationale                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-12 | Platform compliance centralized in `gtcx-infrastructure` | Boundary of control principle: the repo that owns the AWS account, K8s cluster, and CI pipeline must own the compliance evidence for those resources. Prevents duplication, drift, and gaps. |
