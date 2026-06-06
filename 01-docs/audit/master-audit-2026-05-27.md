---
title: 'GTCX Infrastructure — Master Audit Report'
status: 'superseded'
superseded_by: '01-docs/05-audit/master-audit-2026-05-30.md'
superseded_on: '2026-05-31'
superseded_reason: 'Older snapshot; later master-audit + post-roadmap-session supersede.'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'chief-auditor'
tier: 'critical'
tags: ['audit', 'master', 'evidence']
review_cycle: 'on-change'
audit_type: master
target_repo: gtcx-infrastructure
audit_date: 2026-05-27
methodology: 'gtcx-agentic docs + gtcx-docs audit-framework'
composite: 6.9
composite_raw: 7.25
investor: 6.8
enterprise: 6.4
sov_dfi: 6.7
p0_count: 4
p1_count: 8
p2_count: 5
caps_fired: 1
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Infrastructure — Master Audit Report (2026-05-27)

**Date:** 2026-05-27  
**Repo:** `gtcx-ecosystem/gtcx-infrastructure`  
**Branch:** `main`  
**HEAD:** `c27f203`  
**Auditor:** Codex CLI  
**Methodology:** `gtcx-agentic` repository docs, `gtcx-agentic/01-docs/agent-specs/gtcx-infrastructure.md`, `gtcx-agentic/01-docs/05-audit/master-audit-2026-05-26.md`, and canonical audit framework files found at `gtcx-docs/03-platform/tools/audit/audit-framework/`.

> Note: `gtcx-agentic/CONVENTIONS.md` points to `../gtcx-agentic/03-platform/tools/audit-framework`, but that directory is absent in this checkout. The canonical framework is present at `gtcx-docs/03-platform/tools/audit/audit-framework`; this audit used that framework plus the available `gtcx-agentic` repo docs.

---

## Executive Summary

The repo remains architecturally strong: WORM Object Lock is live in production and staging, `@gtcx/audit-signer` is published, SIGNAL validation passes at 9.60/10, Kyverno policy validation passes, coverage gates pass for the main gateway and replay surfaces, and production signing is configured to fail closed.

However, the current checkout is not clean enough to certify as production-ready. Four deploy/CI blockers are open: the production Kustomize overlay cannot build, `pnpm build` fails in `@gtcx/docs-site`, `pnpm lint` fails in `@gtcx/replay-protection`, and Terraform formatting fails. Additional high-risk issues include a hardcoded PagerDuty routing key, missing rate limiting on new audit endpoints, absent testnet-pilot WORM bucket evidence, and stale overview documentation.

**Composite Score:** **6.9 / 10** (raw 7.25, capped)  
**Verdict:** Credible beta with strong trust substrate, but current CI/deploy gates block production certification.

Executive summary artifact: [`01-docs/05-audit/master-audit-summary-2026-05-27.md`](./master-audit-summary-2026-05-27.md).

| Lens                         | Score | Band          |
| ---------------------------- | ----: | ------------- |
| Core Weighted Score          |   6.9 | credible beta |
| Investor Lens                |   6.8 | credible beta |
| Enterprise Buyer Lens        |   6.4 | early beta    |
| African Sovereign / DFI Lens |   6.7 | credible beta |

**Cap applied:** overall score capped at 6.9 because there are multiple unresolved high findings on consequential deployment paths.

---

## Scope And Evidence

**Docs read before execution:**

- `README.md`
- `01-docs/05-audit/README.md`
- `01-docs/05-audit/repo-overlay.md`
- `01-docs/05-audit/prompts/master-audit-prompt.md`
- `gtcx-agentic/CONVENTIONS.md`
- `gtcx-agentic/01-docs/agent-specs/gtcx-infrastructure.md`
- `gtcx-agentic/01-docs/05-audit/master-audit-2026-05-26.md`
- `gtcx-agentic/01-docs/05-audit/10-10-roadmap-2026-05-26.md`
- `gtcx-docs/03-platform/tools/audit/audit-framework/AGENT-START.md`
- `gtcx-docs/03-platform/tools/audit/audit-framework/commands/master-audit.md`
- `gtcx-docs/03-platform/tools/audit/audit-framework/SCORING_FRAMEWORK.md`
- `gtcx-docs/03-platform/tools/audit/audit-framework/prompts/master/forensic-master-prompt.md`

**Dirty tree exception:** the framework asks for a clean worktree, but the repo already contained:

- `M AGENTS.md`
- `?? 01-docs/05-audit/agile/sprints/current.md`

Those files were not reverted or edited during the audit. The untracked sprint file affects docs-standard validation in this checkout.

---

## Gate Results

| Gate / Check                                                | Result | Evidence                                                                                                  |
| ----------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                            | PASS   | Lockfile up to date; install completed.                                                                   |
| `pnpm typecheck`                                            | PASS   | 3 package typechecks successful via Turbo cache.                                                          |
| `pnpm lint`                                                 | FAIL   | `@gtcx/replay-protection` has 11 errors and 3 warnings.                                                   |
| `pnpm format:check`                                         | FAIL   | 8 files fail Prettier check.                                                                              |
| `pnpm test`                                                 | FAIL   | Docs-standard fails on `01-docs/05-audit/agile/sprints/current.md` missing `status`, `date`, `owner`.     |
| `pnpm test:full`                                            | FAIL   | Replay integration bind failed locally with `listen EPERM 0.0.0.0`; full gate did not reach later checks. |
| `pnpm build`                                                | FAIL   | `@gtcx/docs-site` Starlight `social` schema invalid; `@astrojs/check` also missing.                       |
| `pnpm docs:check-links`                                     | PASS   | 942 links across 396 markdown files resolve.                                                              |
| `pnpm quality:governance:check`                             | FAIL   | Same missing frontmatter in untracked sprint file.                                                        |
| `pnpm audit`                                                | FAIL   | 2 Astro vulnerabilities: 1 moderate, 1 low.                                                               |
| `terraform fmt -check -recursive 04-ship/terraform/`        | FAIL   | `04-ship/terraform/environments/staging/main.tf`, `04-ship/terraform/modules/worm-audit/versions.tf`.     |
| `kubectl kustomize 04-ship/kubernetes/base/`                | PASS   | Builds with `commonLabels` deprecation warning.                                                           |
| `kubectl kustomize 04-ship/kubernetes/overlays/staging/`    | PASS   | Builds with `commonLabels` deprecation warning.                                                           |
| `kubectl kustomize 04-ship/kubernetes/overlays/production/` | FAIL   | Patch targets `audit-flush`, but base resource is removed.                                                |
| `kubectl kustomize 04-ship/kubernetes/overlays/testnet/`    | PASS   | Builds with `commonLabels` deprecation warning.                                                           |
| `kubectl kustomize 04-ship/kubernetes/overlays/pen-test/`   | FAIL   | Namespace ID conflict.                                                                                    |
| Docker compose dev/test/infra config                        | PASS   | All three `config --quiet` checks pass.                                                                   |
| Kyverno policy validator                                    | PASS   | 7 policies structurally valid; service manifests comply.                                                  |
| SIGNAL scorecard validator                                  | PASS   | Overall SIGNAL score 9.60/10.                                                                             |
| Score-evidence ledger                                       | PASS   | Ledger validation passed.                                                                                 |
| Protocol contract test                                      | PASS   | 6 tests pass.                                                                                             |
| Compliance gateway coverage gate                            | PASS   | 160 tests pass; 95.13% statements, 91.60% branches.                                                       |
| Replay protection coverage gate                             | PASS   | 147 tests pass; 93.61% statements, 90.25% branches.                                                       |
| Deployment guard tests                                      | PASS   | 56 tests pass.                                                                                            |
| Local `gitleaks detect --no-git --redact`                   | FAIL   | 2 findings, one likely real PagerDuty routing key and one docs example false positive.                    |
| `npm view @gtcx/audit-signer version`                       | PASS   | Latest `0.1.0`.                                                                                           |
| AWS STS identity                                            | PASS   | Account `348389439381`.                                                                                   |
| WORM Object Lock, production bucket                         | PASS   | `COMPLIANCE`, 2557 days on `gtcx-worm-audit-production-af-south-1`.                                       |
| WORM Object Lock, staging bucket                            | PASS   | `COMPLIANCE`, 2557 days on `gtcx-worm-audit-staging-af-south-1`.                                          |
| WORM Object Lock, testnet-pilot bucket                      | FAIL   | No matching WORM bucket listed or found.                                                                  |
| Staging public `/health` and `/metrics`                     | FAIL   | `https://api.staging.gtcx.trade/*` returns ALB 403.                                                       |
| Testnet public `/health`                                    | FAIL   | `api.testnet.gtcxprotocol.org` does not resolve.                                                          |

---

## Core Scorecard

| Dimension                         | Weight | Score | Confidence |  Weighted | Rationale                                                                                                              |
| --------------------------------- | -----: | ----: | ---------- | --------: | ---------------------------------------------------------------------------------------------------------------------- |
| Code Quality                      |     15 |   6.7 | B          |     100.5 | Typecheck and coverage gates pass, but lint/build/format/full validation fail.                                         |
| Repo / Folder Hygiene             |     10 |   7.0 | B          |      70.0 | Strong taxonomy and link checks; docs-standard, Prettier, overview freshness fail.                                     |
| Security                          |     20 |   7.2 | B          |     144.0 | WORM and fail-closed signing are strong; hardcoded PagerDuty key, audit endpoint throttling gap, Astro vulns remain.   |
| Global South Resilience           |     15 |   7.7 | B          |     115.5 | Offline replay and low-bandwidth behavior are tested; testnet-pilot WORM/runtime evidence is missing.                  |
| Ecosystem Integration             |     15 |   7.8 | B          |     117.0 | `@gtcx/audit-signer` live on npm, cross-repo contracts exist; production overlay and runtime endpoints currently fail. |
| Agentic Maturity                  |     10 |   8.2 | B          |      82.0 | SIGNAL 9.60, eval pipeline, signed audit paths; missing endpoint throttling and deploy breakage reduce confidence.     |
| Enterprise / Production Readiness |     15 |   6.4 | B          |      96.0 | WORM and CI breadth are strong, but build, lint, Terraform fmt, production Kustomize, live endpoint checks fail.       |
| **Raw Total**                     |    100 |       |            | **725.0** | **7.25 / 10** before cap.                                                                                              |
| **Capped Total**                  |    100 |       |            |           | **6.9 / 10** after high-finding cap.                                                                                   |

---

## Findings

### P0 — Fix Before Next Deploy

| ID     | Finding                                    | Evidence                                                                                                                                                                                            | Impact                                                                            |
| ------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| P0-001 | Production Kustomize overlay cannot build. | `04-ship/kubernetes/overlays/production/kustomization.yaml:60` applies `audit-flush-patch.yaml`, while `04-ship/kubernetes/base/kustomization.yaml:22-24` comments out `services/audit-flush.yaml`. | Production manifest generation fails; audit-flush deployment cannot be certified. |
| P0-002 | `pnpm build` fails in docs-site.           | `03-platform/tools/docs-site/astro.config.mjs:24-27` uses array-shaped `social`; Starlight expects an object. Build also prompts for missing `@astrojs/check`.                                      | Release/build gate fails.                                                         |
| P0-003 | Workspace lint fails.                      | `03-platform/tools/replay-protection/tests/*.test.mjs`: 11 errors, 3 warnings; import order, unused vars, duplicate key.                                                                            | CI blocks; quality gate not clean.                                                |
| P0-004 | Terraform format gate fails.               | `04-ship/terraform/environments/staging/main.tf:264`, `:297`; `04-ship/terraform/modules/worm-audit/versions.tf:6-7`.                                                                               | Full IaC validation fails; overlay cap limits enterprise readiness.               |

### P1 — High

| ID     | Finding                                                                | Evidence                                                                                                                                                                      | Impact                                                                      |
| ------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| P1-001 | Hardcoded PagerDuty routing key in repo.                               | `04-ship/docker/observability/alertmanager.yml:180`; detected by local `gitleaks`.                                                                                            | Potential incident-routing secret exposure and alert-spam risk.             |
| P1-002 | New audit endpoints lack the same QPS/budget gate used by `/v1/query`. | `03-platform/tools/compliance-gateway/src/server.mjs:220-244` gates `/v1/query`; `/audit/bundles` and `/audit/query` handlers at `:560` and `:589` do not call `checkBudget`. | Authenticated principal can flood audit ingestion/query paths.              |
| P1-003 | Testnet-pilot WORM bucket not present in AWS account.                  | `aws s3api list-buckets` shows only production and staging WORM buckets; `gtcx-worm-audit-testnet-pilot-af-south-1` returns `NoSuchBucket`.                                   | Testnet live-audit claims are not backed by bucket evidence.                |
| P1-004 | Pen-test Kustomize overlay cannot build.                               | `04-ship/kubernetes/overlays/pen-test/kustomization.yaml:20-22` includes base namespace and `namespace.yaml`, causing namespace ID conflict.                                  | External pen-test environment cannot be generated as documented.            |
| P1-005 | Docs-standard fails on current checkout.                               | `01-docs/05-audit/agile/sprints/current.md` lacks `status`, `date`, and `owner` fields.                                                                                       | `pnpm test` and governance gate fail if the sprint file is committed as-is. |
| P1-006 | Public runtime spot checks fail.                                       | `https://api.staging.gtcx.trade/health` and `/metrics` return 403; `api.testnet.gtcxprotocol.org` does not resolve.                                                           | Overlay-required runtime evidence cannot be collected.                      |
| P1-007 | `pnpm audit` reports Astro vulnerabilities.                            | `astro@5.18.1`, GHSA-j687-52p2-xcff (moderate) and GHSA-xr5h-phrj-8vxv (low).                                                                                                 | Docs-site dependency hygiene blocks a clean audit gate.                     |
| P1-008 | Overview document is stale.                                            | `01-docs/overview/README.md` still points to `master-audit-2026-05-17.md` and claims a 5.9 cap from Vault TLS.                                                                | Executive entry point conflicts with current audit evidence.                |

### P2 — Medium

| ID     | Finding                                                           | Evidence                                                                                                                                       | Impact                                                                                       |
| ------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| P2-001 | Prettier check fails in 8 files.                                  | Includes `01-docs/05-audit/master-audit-2026-05-26.md`, distribution snapshots, and `01-docs/09-security/partner-security-self-assessment.md`. | Formatting noise blocks CI and review confidence.                                            |
| P2-002 | Local secret scan flagged docs fake key.                          | `01-docs/01-agents/workflows/agent-safety-rules.md:225` contained a token-shaped fake API key.                                                 | False positives reduce signal; use non-token-shaped examples or allowlist.                   |
| P2-003 | Kustomize uses deprecated `commonLabels`.                         | All successful Kustomize builds warn about `commonLabels`.                                                                                     | Future Kustomize upgrade risk.                                                               |
| P2-004 | Redis nonce-store coverage remains low inside compliance-gateway. | `03-platform/tools/compliance-gateway/src/nonce-store/redis.mjs`: 52.88% statements, 50% branches.                                             | Redis failover and error-handling behavior are under-tested.                                 |
| P2-005 | `pnpm test:full` is unstable in local sandbox.                    | Replay integration failed with `listen EPERM: operation not permitted 0.0.0.0`; targeted replay coverage passed separately.                    | Full validation can produce environment-dependent failures unless bind behavior is hardened. |

---

## Grade Assessment

### Partnership-Grade

**Current status:** Not certifiable from this checkout until P0 gates are closed.

The control design still supports Partnership-Grade: HTTPS/WAF, auth, WORM, public docs, and partner-facing templates exist. The current failure is execution hygiene: build, lint, Terraform fmt, and production overlay generation must pass before a certifiable Partnership-Grade package can be issued.

### Enterprise-Grade

**Current status:** Blocked.

Enterprise readiness remains blocked by external validations already documented in earlier audits:

- SOC 2 Type I auditor not engaged / attestation not complete.
- Pen-test RFP/SOW not completed.

This audit adds internal blockers that must be cleared before those external engagements are credible: production Kustomize build, docs-site build, lint, Terraform formatting, and hardcoded PagerDuty routing key.

### Investment / Bank / Government Grade

Skipped for certification because Enterprise-Grade is not certifiable. Internal readiness remains strong in substrate design, but current gates prevent credible higher-grade certification.

---

## Audience Lenses

### Investor Lens — 6.8 / 10

The repo still contains valuable primitives: published audit signer, compliance DB module, WORM evidence, CI depth, and SIGNAL scorecard. The execution narrative is weakened by repeated CI regressions and stale public-facing overview material. Investors would see a real platform, but also a team that must tighten release hygiene.

### Enterprise Buyer Lens — 6.4 / 10

Enterprise buyers need clean CI, deployable manifests, live runtime endpoints, external security validation, and no hardcoded operational secrets. This checkout fails too many procurement checks to clear security review today.

### African Sovereign / DFI Lens — 6.7 / 10

The regional design is credible: af-south-1, WORM Object Lock, replay windows for low-connectivity regions, and jurisdiction-aware retention. The DFI score is held down by testnet-pilot bucket absence, public endpoint failures, and missing external verification against a live WORM record.

---

## Top Remediation Items

| Priority | Item                                                                                                                                                      | Owner                | Target     | Score Impact                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | ---------- | ------------------------------------------------- |
| P0       | Reconcile `audit-flush` Kustomize resources: either restore the base resource with AMD64 image support or remove/replace production and pen-test patches. | Platform Engineering | 2026-05-28 | Lifts production deploy blocker.                  |
| P0       | Fix docs-site build: change Starlight `social` to object form, add `@astrojs/check`, and upgrade/pin Astro to patched version.                            | Docs Platform        | 2026-05-28 | Restores `pnpm build`; closes npm audit findings. |
| P0       | Fix replay-protection lint errors and Prettier drift.                                                                                                     | Platform Engineering | 2026-05-28 | Restores `pnpm lint` and `pnpm format:check`.     |
| P0       | Run `terraform fmt` on failing files and add/check drift evidence for the last 30 days.                                                                   | Infra Lead           | 2026-05-28 | Lifts infra overlay Enterprise cap.               |
| P1       | Remove or rotate PagerDuty routing key, replace with `${PAGERDUTY_*}` env placeholder, and run `gitleaks detect`.                                         | Security Lead        | 2026-05-28 | Reduces secret exposure risk.                     |

Detailed 10/10 remediation plan: [`01-docs/05-audit/10-10-remediation-plan-2026-05-27.md`](./10-10-remediation-plan-2026-05-27.md).

---

## One-Point Uplift Conditions

To raise the core score from 6.9 to ~8.0:

1. `pnpm lint`, `pnpm format:check`, `pnpm build`, `pnpm test`, and `terraform fmt -check -recursive 04-ship/terraform/` all pass on a clean checkout.
2. Production and pen-test Kustomize overlays build without errors.
3. PagerDuty routing key is removed/rotated and local secret scan is clean or explicitly allowlisted for fake docs examples.
4. `/audit/bundles` and `/audit/query` have per-principal rate limiting or an equivalent audit-specific limiter.
5. Live runtime evidence is collected: staging `/health`, staging `/metrics`, WORM object-lock config, and at least one WORM NDJSON record verified with `@gtcx/audit-signer`.

To raise the Enterprise lens above 8.0:

1. SOC 2 Type I auditor engaged with kickoff evidence.
2. Pen-test SOW signed, kickoff complete, and first findings/remediation workflow active.
3. Runtime endpoint evidence and deployment evidence are available without special local assumptions.

---

## Coordination Record

Work was reported to `baseline-os` coordination:

- Repo: `gtcx-infrastructure`
- Item: `Master audit 2026-05-27`
- Status: `completed`
- Item ID: `gtcx-infrastructure-1779888378810`

---

## Protocol Compliance Notes

The audit followed the evidence collection, scoring, cap application, and remediation-path requirements from the canonical audit framework, with these explicit notes:

- Phase 2 doc cleanup was skipped because the repo has only `/01-docs/` and no competing `_sop`, `_cannon`, `wiki`, or `documentation` roots.
- The protocol expects all verification gates to pass after cleanup. They do not pass in this checkout; the failing gates are recorded as findings and cap triggers rather than hidden.
- `gtcx-agentic/CONVENTIONS.md` points to a missing `gtcx-agentic/03-platform/tools/audit-framework` path, so the canonical framework available at `gtcx-docs/03-platform/tools/audit/audit-framework` was used.
- Phase 7 overview was refreshed to point at this audit and the 2026-05-27 remediation plan.

---

## Conclusion

GTCX Infrastructure remains a serious platform substrate, not a paper architecture. The cryptographic audit chain, WORM buckets, coverage gates, SIGNAL validation, Kyverno policy validation, and cross-repo contracts are real.

The current checkout should not be certified as production-ready. The failure mode is execution discipline: several gates that should be boring and deterministic are currently red. Close the four P0s first, then rerun the master audit and external-grade evidence collection.

_Generated: 2026-05-27_
