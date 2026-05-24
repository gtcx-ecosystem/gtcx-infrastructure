---
title: 'Internal Completion Roadmap (Cycle 2.5)'
status: 'current'
date: '2026-05-22'
owner: 'platform-engineering'
tier: 'critical'
tags: ['agile', 'roadmap', 'sprint-plan', 'internal-only']
review_cycle: 'on-change'
---

# Internal Completion Roadmap — Cycle 2.5

**Cycle window:** 2026-05-22 → 2026-06-12 (rolling, no fixed sprint boundaries while uninterrupted)
**Owner:** Platform Engineering (executed by Claude Opus 4.7 1M as agent-in-loop)
**Predecessor:** [`execution-roadmap-2026-05-22.md`](./execution-roadmap-2026-05-22.md) §Cycle 2
**Purpose:** Close every remaining cycle-2 item that does **not** require an external clock (pen-test report, SOC 2 auditor selection, AWS prod credentials, live cluster access, leadership signature) before the external clocks finish ticking. When the external clocks land, the team's full bandwidth should be free for triage and re-validation, not engineering catch-up.

## Why a separate doc

The main execution roadmap (`execution-roadmap-2026-05-22.md`) mixes internal and external items because that's the actual program. This doc is the **agent-executable subset**: every story below can be completed without leaving this session.

## Cycle 2.5 — Four sprints, prioritized

| Sprint    | Priority | Theme                       | Capacity | Internal?                               |
| --------- | -------- | --------------------------- | -------- | --------------------------------------- |
| **INT-A** | P0       | Close audit residuals       | 8 pts    | 100%                                    |
| **INT-B** | P0       | Substrate completion + ADRs | 10 pts   | 100%                                    |
| **INT-C** | P1       | Distribution prep (drafts)  | 10 pts   | 100% (drafts only; deployment external) |
| **INT-D** | P2       | Compliance prep (drafts)    | 5 pts    | 100% (auditor review external)          |

**Total:** 33 story points, 4 sprints, executable uninterrupted.

## Universal DoD (applies to every story below)

- [ ] Acceptance criteria met with cited evidence
- [ ] Tests added where applicable; suite green
- [ ] `node tools/scripts/validate-all.mjs` → 17/17 pass
- [ ] Conventional commit with `Co-Authored-By` line
- [ ] Docs updated (audit doc, runbook, or ADR — whichever applies)
- [ ] Cross-references resolve

---

# Sprint INT-A — Close Audit Residuals (P0)

**Goal:** Every P1+ residual from the round-4 full audit that I can address from this session is closed.

## [INT-A-1] NATS integration test in `validate.sh --full`

**Priority:** P0 | **Points:** 3

**User story:** As **a CI engineer**, I want **a docker-compose-driven NATS round-trip test** so that **the audit-flush sidecar's broker-success path is gated by CI, not just trusted**.

**Acceptance criteria:**

- [ ] `tools/audit-flush/test/docker-compose.test.yml` starts a single-node `nats:2-alpine` with JetStream enabled.
- [ ] Test script publishes a signed audit record to `gtcx.audit.compliance-gateway.test-tenant` and confirms a durable consumer on the audit-flush package can read it.
- [ ] `validate.sh --full` adds a `nats-integration` gate that calls the test script and tears down the container.
- [ ] Gate passes deterministically on 5 consecutive runs.

**Test scenarios:**

1. Broker healthy → record consumed within 5s → gate passes
2. Broker unreachable → gate fails with clear error
3. Tampered record → audit-flush quarantines (mocks PutObject to verify the prefix)

**Dependencies:** None (audit-flush package exists; nats package soft-loaded).

## [INT-A-2] Audit-flush Dockerfile installs `@gtcx/audit-signer` from npm

**Priority:** P0 | **Points:** 1

**User story:** As **a platform operator deploying audit-flush**, I want **the production image to install `@gtcx/audit-signer` from the npm registry** so that **the runtime `import '@gtcx/audit-signer'` resolves without needing turbo prune vendoring**.

**Acceptance criteria:**

- [ ] `tools/audit-flush/Dockerfile` installs `@gtcx/audit-signer@^0.1.0` in the `deps` stage alongside `nats` and `@aws-sdk/client-s3`.
- [ ] `npm install` succeeds against the public registry (verified by `npm view @gtcx/audit-signer version`).
- [ ] Note about turbo prune vendoring removed (no longer needed).

**Test scenarios:**

1. `docker build -t test/audit-flush tools/audit-flush` succeeds.
2. `docker run --rm test/audit-flush node -e "import('@gtcx/audit-signer').then(m => console.log(m.verifyChain))"` prints the function reference.

**Dependencies:** `@gtcx/audit-signer@0.1.0` on npm registry (✅ landed 2026-05-22).

## [INT-A-3] Audit-flush kustomize wiring for staging + production

**Priority:** P0 | **Points:** 4

**User story:** As **a platform operator**, I want **audit-flush overlay patches for staging and production environments** so that **`kubectl kustomize` produces deployable manifests without the `PLACEHOLDER_OVERRIDE_IN_OVERLAY` strings**.

**Acceptance criteria:**

- [ ] `infra/kubernetes/overlays/staging/audit-flush-patch.yaml` (new) substitutes image + IRSA role ARN + S3 bucket name with `terraform output`–compatible placeholders.
- [ ] `infra/kubernetes/overlays/production/audit-flush-patch.yaml` (new) same.
- [ ] Both overlays' `kustomization.yaml` reference the patch.
- [ ] `kubectl kustomize infra/kubernetes/overlays/staging` and `…/production` build clean (no admission errors).
- [ ] Patches include resource limits sized per env (staging: 200m/256Mi; production: 500m/512Mi).

**Test scenarios:**

1. `kubectl kustomize infra/kubernetes/overlays/staging | grep -c "image: gtcx/audit-flush:"` returns 1.
2. Same for production.
3. `kubectl kustomize` is dry-runnable; no field-strictness errors.

**Dependencies:** Existing `infra/kubernetes/base/services/audit-flush.yaml` (✅) + Terraform module already wired (✅).

### INT-A UAT

| Scenario                  | Steps                                   | Expected                              | Verifier     | Status |
| ------------------------- | --------------------------------------- | ------------------------------------- | ------------ | ------ |
| NATS round-trip           | Run `validate.sh --full`                | `nats-integration` gate passes        | DevOps       | ☐      |
| Audit-flush image builds  | `docker build tools/audit-flush`        | Success; container starts             | Platform Eng | ☐      |
| Staging overlay builds    | `kubectl kustomize overlays/staging`    | No placeholders, audit-flush included | Platform Eng | ☐      |
| Production overlay builds | `kubectl kustomize overlays/production` | Same                                  | Platform Eng | ☐      |

---

# Sprint INT-B — Substrate Completion + ADRs (P0)

**Goal:** Add the Redis-backed adaptive state behind a feature flag (so it's ready when scale warrants without flag-day urgency), and write the ADRs documenting the major substrate decisions Cycle 1 made implicitly.

## [INT-B-1] Redis-backed adaptive policy state (feature-flagged)

**Priority:** P0 | **Points:** 5

**User story:** As **a platform operator running >5 compliance-gateway pods**, I want **adaptive policy state shared via Redis** so that **per-pod independence doesn't cause divergent degradation modes during real load events**.

**Acceptance criteria:**

- [ ] `tools/compliance-gateway/src/adaptive-policy-store.mjs` (new) exports `getStore({ backend: 'memory' | 'redis' })`.
- [ ] Memory backend identical to current behavior.
- [ ] Redis backend uses `ioredis` (soft-loaded — if unavailable, falls back to memory with a logged warning).
- [ ] Feature flag: `GTCX_ADAPTIVE_STORE_BACKEND=redis` enables shared state.
- [ ] Schema: hash `gtcx:adaptive:<env>` with fields `mode`, `consecLatBreaches`, `consecErrBreaches`, `consecRecoveryWindows`, `lastTransitionAt`.
- [ ] Race-safe via Redis `WATCH/MULTI/EXEC` on transitions.
- [ ] Per-store unit tests (memory + redis with `redis-mock` if needed).

**Test scenarios:**

1. Memory backend: behavior unchanged from current.
2. Redis backend (mock): two simulated pods write to the same store; both observe consistent mode after transition.
3. Redis unreachable: backend falls back to memory; warning logged once, not per-tick.
4. Race: concurrent transitions from two pods produce a deterministic outcome.

**Dependencies:** None (additive; default backend unchanged).

## [INT-B-2] ADRs for Cycle 1 substrate decisions

**Priority:** P0 | **Points:** 5

**User story:** As **a future engineer reading this repo**, I want **explicit ADRs for the major substrate decisions Cycle 1 made implicitly** so that **I understand the why, not just the what**.

**Acceptance criteria:**

- [ ] **ADR-014** — NATS JetStream as the audit transport (vs Kafka, vs direct S3 from gateway, vs SNS/SQS).
- [ ] **ADR-015** — Per-tenant JetStream subject routing (vs single-stream + tenant filter).
- [ ] **ADR-016** — Fail-closed audit signing in production (process.exit 78 on missing key vs warn-and-continue).
- [ ] **ADR-017** — Adaptive policy tuning (signed `resilience.policy.adaptation` events on every transition).
- [ ] Each ADR follows `docs/architecture/decisions/adr-template.md` (status, context, decision, consequences, alternatives).
- [ ] All four linked in `docs/architecture/decisions/README.md`.

**Test scenarios:** Lint + frontmatter validator + `docs-link-checker` pass.

**Dependencies:** None.

### INT-B UAT

| Scenario                 | Steps                                        | Expected                                  | Verifier     | Status |
| ------------------------ | -------------------------------------------- | ----------------------------------------- | ------------ | ------ |
| Adaptive memory works    | Unit suite                                   | All existing tests still green            | Platform Eng | ☐      |
| Adaptive Redis works     | Redis backend test                           | Two-pod simulation converges to same mode | Platform Eng | ☐      |
| Feature flag default off | No env var                                   | Memory backend selected                   | Platform Eng | ☐      |
| All ADRs render          | `docs-link-checker`                          | No broken refs                            | Doc Lead     | ☐      |
| ADR registry updated     | Open `docs/architecture/decisions/README.md` | Lists ADRs 014–017                        | Doc Lead     | ☐      |

---

# Sprint INT-C — Distribution Prep Drafts (P1)

**Goal:** Produce deployable-quality drafts for distribution work. The drafts can be reviewed and shipped without further engineering effort.

## [INT-C-1] `@gtcx/audit-signer` launch announcement (blog post draft)

**Priority:** P1 | **Points:** 3

**User story:** As **the GTM partner**, I want **a publish-ready blog post draft for the `@gtcx/audit-signer` launch** so that **I can review-then-ship without writing it from scratch**.

**Acceptance criteria:**

- [ ] `docs/external/blog/audit-signer-launch-2026-05.md` (new) — ~1500 words.
- [ ] Three angles: (a) problem ("audit trails are not tamper-evident"), (b) design (Ed25519 + RFC 8785 JCS + hash-linked chain), (c) substrate (npm + GitHub + Terraform Registry coming).
- [ ] Code examples that copy-paste and work on Node 20.
- [ ] No marketing fluff — match the README's tone.
- [ ] Includes a "what's next" section linking to the Terraform Registry submission and docs site.
- [ ] Reviewed-by checklist for Security Lead (cryptographic accuracy), Platform Eng Lead (technical accuracy), GTM Partner (positioning).

**Test scenarios:**

1. Every code snippet runs against npm-installed `@gtcx/audit-signer@0.1.0` and produces the asserted output.
2. Reading time check: ~6-8 minutes.

**Dependencies:** `@gtcx/audit-signer` on npm (✅).

## [INT-C-2] Public docs site content

**Priority:** P1 | **Points:** 3

**User story:** As **a developer landing on `gtcx.io/compliance` for the first time**, I want **a clear path from "what is this" to "how do I install it"** so that **I can evaluate the substrate in under 10 minutes**.

**Acceptance criteria:**

- [ ] `docs/external/docs-site/` (new directory) — markdown source for the site.
- [ ] `index.md` — overview of the compliance substrate (gateway + audit-signer + compliance-db).
- [ ] `audit-signer.md` — install + quick-start + API reference (mirror of the npm README, deeper).
- [ ] `compliance-db.md` — install + jurisdiction selection + dual-DB architecture.
- [ ] `compliance-gateway-mcp.md` — install + MCP tool list + agent-discoverable workflow.
- [ ] `architecture.md` — one-page diagram + narrative of how the three primitives compose.
- [ ] Frontmatter on every page.
- [ ] Cross-links between pages resolve.

**Test scenarios:**

1. Markdown renders clean in GitHub preview.
2. `docs-link-checker` against this directory passes.

**Dependencies:** None.

## [INT-C-3] Terraform Registry submission package

**Priority:** P1 | **Points:** 2

**User story:** As **the DevOps lead**, I want **a submission-ready package for `terraform-aws-compliance-db` on the Terraform Registry** so that **I can submit with one click rather than figuring out the requirements**.

**Acceptance criteria:**

- [ ] `docs/external/terraform-registry-submission-2026.md` (new) — checklist of Registry requirements with each verified.
- [ ] Validated: `terraform fmt`, `terraform validate`, README contains `## Inputs`, `## Outputs`, `## Resources` sections, semver tag `v0.1.0` exists on the standalone GitHub repo.
- [ ] Submission URL ready: `https://registry.terraform.io/github/<org>/terraform-aws-compliance-db`.
- [ ] Document any gaps the standalone repo has vs Registry requirements (since the standalone repo is at `github.com/amani-amina-anai/terraform-aws-compliance-db`).

**Test scenarios:** N/A (administrative + verification).

**Dependencies:** Existing `infra/terraform/modules/compliance-db/` is the source of truth.

## [INT-C-4] Distribution metrics scaffold

**Priority:** P2 | **Points:** 2

**User story:** As **the platform engineering lead**, I want **a daily snapshot of distribution signal** so that **I have empirical data on whether the publish-strategy is working**.

**Acceptance criteria:**

- [ ] `tools/scripts/distribution-snapshot.mjs` (new) — node script that:
  - Fetches npm download stats for `@gtcx/audit-signer` from `https://api.npmjs.org/downloads/point/...`.
  - Fetches GitHub stars + forks + open issues for `gtcx-ecosystem/gtcx-infrastructure` AND `amani-amina-anai/terraform-aws-compliance-db` via GitHub API.
  - Writes a JSON snapshot to `docs/audit/distribution-snapshots/<YYYY-MM-DD>.json`.
  - Idempotent (re-running same day overwrites).
- [ ] Unit tests for the script's parsing logic (fetchers mocked).
- [ ] GitHub Actions workflow `.github/workflows/distribution-snapshot.yml` runs the script daily.

**Test scenarios:**

1. Mocked fetchers produce a valid JSON snapshot.
2. Snapshot includes `producedAt`, `npm.downloads`, `github.stars`, `github.forks`.
3. Re-run same day overwrites.

**Dependencies:** None.

### INT-C UAT

| Scenario            | Steps                                       | Expected            | Verifier     | Status |
| ------------------- | ------------------------------------------- | ------------------- | ------------ | ------ |
| Blog post quality   | Review by Security Lead + Platform Eng Lead | Both approve        | Both leads   | ☐      |
| Docs site links     | `docs-link-checker docs/external`           | All resolve         | Doc Lead     | ☐      |
| Registry submission | Run checklist                               | All boxes checked   | DevOps Lead  | ☐      |
| Snapshot script     | Run with mocked HTTP                        | Valid JSON produced | Platform Eng | ☐      |

---

# Sprint INT-D — Compliance Prep Drafts (P2)

**Goal:** Two compliance artifacts that the SOC 2 auditor will ask for on day one. Drafts now means the auditor's kickoff is faster.

## [INT-D-1] Data Protection Impact Assessment (DPIA) draft

**Priority:** P2 | **Points:** 3

**User story:** As **the security lead**, I want **a DPIA draft covering compliance-gateway, audit-flush, and the WORM bucket** so that **GDPR Art. 35 / CCPA equivalents are documentable when an enterprise buyer asks**.

**Acceptance criteria:**

- [ ] `docs/compliance/dpia-2026-05.md` (new) — schema-compliant frontmatter.
- [ ] Scope: compliance-gateway HTTP API, JetStream audit topic, WORM S3 bucket, KMS keys.
- [ ] Per-data-flow analysis: data category, purpose, retention, processor location, transfer mechanisms.
- [ ] Risk register table: 8+ identified risks with likelihood/impact/mitigation.
- [ ] Lawful basis per processing activity (consent, legitimate interest, legal obligation, contract).
- [ ] Data subject rights enumeration with how the substrate supports each (access, erasure, rectification, portability, objection).
- [ ] Transfer mechanism for non-EEA processing (since AWS af-south-1 is the primary region).

**Test scenarios:** Doc-standard validator passes; link checker passes.

**Dependencies:** None.

## [INT-D-2] SOC 2 Type 1 evidence inventory

**Priority:** P2 | **Points:** 2

**User story:** As **the security lead preparing for the SOC 2 Type 1 kickoff**, I want **a single table mapping every relevant TSC control to its file:line evidence pointer** so that **the auditor's first request can be answered same-day**.

**Acceptance criteria:**

- [ ] `docs/compliance/soc2-evidence-inventory-2026-05.md` (new) — frontmatter compliant.
- [ ] Table covering at minimum CC1.x, CC2.x, CC5.x–CC9.x with per-control evidence pointer (file path + line range or runbook + dashboard URL).
- [ ] Includes the evidence already mapped in `docs/audit/soc2-engagement-2026.md` plus deeper-cut pointers (e.g., per-test-file for code-quality controls).
- [ ] References the WORM bucket as the durable evidence sink for I3 / I4 controls.
- [ ] Each row marked Strong / Partial / Gap.

**Test scenarios:** Frontmatter + link checker pass; no broken file references.

**Dependencies:** None.

### INT-D UAT

| Scenario                         | Steps                                  | Expected                      | Verifier      | Status |
| -------------------------------- | -------------------------------------- | ----------------------------- | ------------- | ------ |
| DPIA structurally complete       | Read all sections                      | Every Art. 35 element present | Security Lead | ☐      |
| Evidence inventory links resolve | Run link-checker scoped to compliance/ | All resolve                   | Doc Lead      | ☐      |
| Evidence pointers valid          | Spot-check 5 random pointers           | All point to real lines       | Security Lead | ☐      |

---

# Cross-Sprint

## Dependency graph

```
INT-A-2 (Dockerfile npm)  ─┐
INT-A-3 (overlays)         ├──→ Ready for production deploy
INT-A-1 (NATS test)        ─┘

INT-B-1 (Redis adaptive)   ────→ Ready when scale warrants
INT-B-2 (4 ADRs)           ────→ Documents Cycle 1 retro

INT-C-1 (blog)             ─┐
INT-C-2 (docs site)        ─┼──→ Reviewable launch package
INT-C-3 (Registry)         ─┘    (deployment external)
INT-C-4 (metrics)          ────→ Measures distribution effort

INT-D-1 (DPIA)             ─┐
INT-D-2 (SOC 2 evidence)   ─┴──→ SOC 2 kickoff materials
```

## Risk register (Cycle 2.5)

| Risk                                                       | Impact | Probability | Mitigation                                                               |
| ---------------------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------------ |
| Redis adaptive state introduces race we miss in unit tests | Medium | Low         | Feature-flagged off by default; WATCH/MULTI/EXEC is well-trodden pattern |
| Docker compose NATS test flaky in CI                       | Medium | Medium      | Retry with backoff; only at `--full`, not `quick`                        |
| Blog post cryptographic claim wrong                        | High   | Low         | Reviewed by Security Lead before publish (UAT gate)                      |
| DPIA misses a jurisdiction-specific requirement            | Medium | Medium      | Cite each requirement; gaps explicit; iterate with auditor               |
| Evidence inventory pointer rots                            | Low    | Low         | Re-validated as part of the docs-link-checker each PR                    |

## Velocity tracking

| Sprint    | Planned | Delivered | Velocity |
| --------- | ------: | --------: | -------: |
| INT-A     |       8 |         — |        — |
| INT-B     |      10 |         — |        — |
| INT-C     |      10 |         — |        — |
| INT-D     |       5 |         — |        — |
| **Total** |  **33** |         — |        — |

Updated post-execution.

## Exit criteria (Cycle 2.5)

Cycle 2.5 closes when **all** of the following are true:

- [ ] All INT-A stories shipped; `validate.sh --full` `nats-integration` gate passes
- [ ] All INT-B stories shipped; Redis adaptive state passes mocked tests; 4 ADRs in registry
- [ ] All INT-C drafts complete and reviewable
- [ ] All INT-D drafts complete and reviewable
- [ ] `node tools/scripts/validate-all.mjs` → 17/17 throughout
- [ ] Cumulative test count grows by ≥10 with each engineering story
- [ ] Master execution roadmap (`execution-roadmap-2026-05-22.md`) updated to mark Cycle 2.5 closed
