---
title: 'gtcx-infrastructure — Repo Audit Overlay'
status: 'current'
date: '2026-05-27'
audit_date: 2026-05-22
target_repo: gtcx-infrastructure
owner: 'platform-engineering'
tier: 'critical'
tags: ['audit', 'overlay', 'infrastructure', 'governance']
review_cycle: 'quarterly'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# gtcx-infrastructure — Repo Audit Overlay

> Base framework: [`gtcx-agentic/audit/SCORING_FRAMEWORK.md`](https://github.com/gtcx-ecosystem/gtcx-agentic/blob/main/audit/SCORING_FRAMEWORK.md)
>
> This overlay adds infrastructure-specific stricter caps and evidence requirements to the ecosystem baseline. The base framework remains canonical; this overlay only _raises_ the bar, never lowers it.

## Repo

- **Repo name:** `gtcx-infrastructure`
- **Overlay owner:** Platform Engineering
- **Effective date:** 2026-05-22
- **Status:** Active
- **Replaces:** First overlay for this repo (prior audits implicitly used the ecosystem default).

## Why This Overlay Exists

`gtcx-infrastructure` owns the Terraform IaC, Kubernetes manifests, audit substrate, secrets management, and CI/CD pipelines for every other GTCX service. A regression here has higher blast radius than a regression in a single product repo. It also exposes infrastructure-specific surfaces (IAM blast radius, drift, default-deny network posture, signed-image admission, WORM audit immutability) that don't appear in the ecosystem baseline scoring questions.

The overlay codifies what the team already does informally: hold infra to a bar that protects every consuming service.

## Additional Scope Rules

- **Workflow-level audit, not just package-level.** Every audit cycle must trace at least one end-to-end consequential workflow (e.g., compliance-gateway → JetStream → audit-flush → WORM S3 → external verification with `@gtcx/audit-signer`) and assert that each hop is independently verifiable.
- **Cross-repo dependency check.** Every release audit verifies that consumers (`gtcx-protocols`, `gtcx-platforms`, `gtcx-intelligence`) still resolve the workspace contracts we publish (`@gtcx/audit-signer`, `terraform-aws-compliance-db`). Breaking changes here cascade.
- **Live runtime spot-check.** At least one runtime endpoint per environment must be hit during the audit (`/health`, `/v1/audit/chain`, `/metrics`) with results captured in the audit doc.

## Additional Dimension Questions

### Trust Root Integrity (new)

- Are all trust anchors (KMS keys, audit signing keys, Vault unseal keys) explicit, owned by an IAM principal, and independently verifiable?
- Can any local fallback create a shadow authority? (e.g., dev-mode ephemeral keys leaking into staging/production.)
- Are proof references (signed audit records, Object Lock retention) durable, replay-safe, and externally verifiable with no GTCX-side trust step?

### IaC Posture (new)

- Are all `terraform apply` paths gated by per-environment state isolation (separate S3 backend per env)?
- Is drift detection scheduled? When was the last `terraform plan -detailed-exitcode` against live state?
- Are provider versions locked via `.terraform.lock.hcl` committed to the repo?
- Are IaC security linters (`tflint`, `tfsec`, `checkov`, `kube-linter`) part of CI?

### Admission Enforcement (new)

- Does every Kyverno policy declared in `infra/kubernetes/base/policies/` have a matching producer in CI (e.g., `require-signed-images.yaml` → Cosign signing in `build-push-ecr.yml`)?
- Are admission policies scoped to ALL environment namespaces (`gtcx-testnet`, `gtcx-staging`, `gtcx-production`) — not just production?

### Audit-Flow Verifiability (new)

- Is the full gateway → sink → WORM → external-verifier path reproducible from a clean room?
- Can a third party run `npm install @gtcx/audit-signer && verifyChain(fromNdjson(<bucket-key>))` and validate an arbitrary record without any GTCX-side help?
- Is the gateway fail-closed when the signing path is unavailable in production? (Exit 78 / EX_CONFIG, not warn-and-continue.)

## Additional Hard Caps (stricter than the ecosystem baseline)

These caps OVERRIDE the ecosystem caps when they're stricter; they never relax the baseline.

- **`Security` ≤ 6.5 if any Kyverno policy is unenforced by its producer pipeline.**
  Rationale: an unenforced policy is worse than no policy — it lulls operators into believing a guarantee that isn't held.
- **`Security` ≤ 6.5 if any CI workflow uses long-lived AWS access keys while another workflow in the same repo uses OIDC.**
  Rationale: inconsistent credential models leak through the weakest workflow.
- **`Enterprise / Production Readiness` ≤ 7.0 unless `terraform fmt -check -recursive` passes across all environments AND drift detection has run in the last 30 days.**
- **`Enterprise / Production Readiness` ≤ 7.0 if any environment commits operator IP addresses to tfvars** (personal-IP-as-firewall is fragile + leaks geolocation).
- **`Global South Resilience` ≤ 7.0 if NAT Gateway is single-AZ in any environment overlay claiming HA.**
- **`Agentic Maturity` ≤ 8.0 if `AUDIT_SIGNING_KEY_B64` is not required in production deployments via fail-closed startup check.** (As of 2026-05-22 this is enforced — `tools/compliance-gateway/src/server.mjs` exits EX_CONFIG 78.)
- **`Code Quality` ≤ 8.0 if any workspace package's coverage gate threshold differs from 90 without a documented rationale.** (See `docs/audit/coverage-gate-rationale.md`.)

## Additional Lens Guidance

### Investor Lens

- The 23-repo ecosystem integration is the platform moat. Penalize any audit that scores `Ecosystem Integration` highly without verifying that at least two sibling repos consume this repo's published artifacts (`@gtcx/audit-signer` on npm, `terraform-aws-compliance-db` on GitHub).
- "Pioneering and AI-native" is the only long-term competitive advantage (per global CLAUDE.md). Score `Agentic Maturity` against whether the SIGNAL scorecard's evidence pointers resolve to live, verifiable artifacts — not aspirational claims.

### Enterprise Buyer Lens

- An enterprise buyer of `gtcx-infrastructure` is buying the SUBSTRATE, not the front-end. Weight `Control Environment` higher when infra is shared across multiple regulated workloads.
- Pen-test + SOC 2 Type 1 are unconditional gates for OECD bank tier 1. Do not score `Security and Auditability` above 8.5 until at least the pen-test SOW is signed.

### Sovereign / DFI Lens

- The dual-DB (operational + audit) + WORM Object Lock + jurisdiction-plugin-driven retention is the differentiator under the DFI lens. Score `Governance and Trust` highly only if the audit substrate is end-to-end externally verifiable (the audit-flush sidecar must be deployed, not scaffolded).
- `Mission and Regional Fit` should reflect actual jurisdiction-plugin coverage (the `infra/terraform/modules/compliance-db/plugins/` catalog), not the ambition to cover them.

## Evidence Requirements (beyond the base framework)

- **Runtime evidence:**
  - Output of `npm view @gtcx/audit-signer` (proves the published artifact is live).
  - Output of `aws s3api get-object-lock-configuration --bucket gtcx-worm-audit-<env>-<region>` (proves Object Lock COMPLIANCE mode is set).
  - One signed audit record retrieved from the WORM bucket and verified with `verifyChain(fromNdjson(...))`.
- **Audit evidence:**
  - `docs/audit/master-audit-<DATE>.md` and `docs/audit/full-audit-<DATE>.md` both current within 90 days.
  - `docs/audit/signal-scorecard.json` aligned with master audit's narrative.
  - `docs/audit/score-evidence-ledger.json` with file:line pointers that still resolve.
- **Deployment evidence:**
  - `terraform fmt -check -recursive` pass log for each environment.
  - `kubectl kustomize` build success for `base/` and every overlay (`development`, `staging`, `production`, `testnet`, `pen-test`).
- **Cross-repo dependency evidence:**
  - At least one sibling repo's `package.json` or `*.tf` showing live use of a published gtcx-infrastructure artifact.

## Approval and Change Control

This overlay can be modified only by:

1. A Platform Engineering–owned ADR documenting the change.
2. A pull request that updates this file AND the relevant prompts / examples under `gtcx-agentic/audit/`.
3. Review by at least one non-author on Platform Engineering.

Loosening a cap is a P0 review; tightening a cap or adding a question is a standard review.

## Relationship to Ecosystem Baseline

- This overlay is additive. The ecosystem baseline (`SCORING_FRAMEWORK.md`) remains authoritative for everything not explicitly stricter here.
- When this overlay conflicts with a baseline rule, the stricter rule wins.
- This overlay is referenced from `docs/audit/master-audit-<DATE>.md` Phase 0 (Pre-Flight); auditors must read both.
