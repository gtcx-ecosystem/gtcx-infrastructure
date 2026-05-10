## GTCX Infrastructure — Remediation Plan

> **Status:** Active — Sprint 2 in progress
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Scope and normalization

This plan consolidates the in-repo audit corpus under `docs/assessments/`, `docs/audit/`, and `docs/agile/`.

Normalization rule:

1. Live code and CI evidence in this repository take precedence.
2. `docs/audit/master-audit-2026-05-10.md` is the current audit baseline.
3. Earlier cycle docs that claim 9.3-9.7/10 are treated as historical claims, not active proof, when current code or CI does not reproduce the claim.
4. No repo-local `docs/signal/` or `docs/ux/` corpus exists today. That absence is itself tracked as a remediation item.

## A. Executive Summary

### Current scores to target

| Dimension                         |               Current |                        Target | Source                                              |
| --------------------------------- | --------------------: | ----------------------------: | --------------------------------------------------- |
| Core weighted score               |                5.9/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Security                          |                4.5/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Agentic maturity                  |                4.0/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Enterprise / production readiness |                6.3/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Global South resilience           |                6.8/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Ecosystem integration             |                7.5/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Code quality                      |                7.2/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Structural integrity              |                7.2/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Testability                       |                7.8/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Repo / folder hygiene             |                8.1/10 |                         10/10 | `docs/audit/master-audit-2026-05-10.md`             |
| Docs standard compliance          |                8.9/10 |                         10/10 | `docs/audit/docs-standard-compliance-2026-05-10.md` |
| GTM stage                         |              S2 pilot |      Institutional production | `docs/audit/master-audit-2026-05-10.md`             |
| UX / design audit                 | Not baselined in-repo |                         10/10 | No local UX audit artifacts found                   |
| SIGNAL corpus                     | Not baselined in-repo | Level 4 equivalent with gates | No local SIGNAL audit artifacts found               |

### Top 5 ship-stopper risks

1. Consequential protocol mutations are reachable from an unauthenticated natural-language HTTP endpoint in `tools/compliance-gateway/src/server.mjs:43` and `tools/compliance-gateway/src/tools.mjs:17`.
2. The publicly exposed `query.gtcx.trade` tunnel publishes that gateway directly in `infra/kubernetes/base/services/cloudflared/config.yaml:9`.
3. Replay protection silently weakens to process-local state when Redis is absent or down in `tools/replay-protection/src/server.mjs:54`.
4. Audit immutability is asserted, not verified, in `infra/scripts/migrate.sh:228`.
5. CI still allows partial release evidence and only runs a shallow docs check in `.github/workflows/ci.yml:67` and `.github/workflows/ci.yml:85`.

### Estimated sprint count

10 primary remediation sprints, with 2 additional evidence-hardening / external-validation buffers if pen-test, contract-test, or production soak evidence uncovers regressions.

## B. Findings Register

| ID    | Source audit                                                                    | Dimension                    | Severity | Finding                                                                                                    | Root cause                                                                        | Remediation                                                                                                       | Owner                       | Sprint | Acceptance criteria                                                                                                    | Evidence required                                               |
| ----- | ------------------------------------------------------------------------------- | ---------------------------- | -------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| F-001 | `master-audit-2026-05-10`                                                       | Security / agentic           | P0       | Unauthenticated natural-language endpoint can invoke mutating protocol tools                               | No authn, no authz, no approval boundary between prompt intake and tool execution | Add identity, scoped authorization, read-only vs mutating tool segregation, and human/policy approval gates       | Platform Security           | 1      | Unauthenticated callers cannot reach mutating tools; settlement and credential mutation paths require non-LLM approval | Integration tests, policy tests, gateway config diff, CI pass   |
| F-002 | `master-audit-2026-05-10`                                                       | Security / exposure          | P0       | Public tunnel publishes `query.gtcx.trade` directly to the gateway                                         | External exposure shipped before trust boundary existed                           | Remove or gate public ingress until F-001 is complete; restrict to private/admin access                           | Platform / Infra            | 1      | Public hostname is removed, access-controlled, or protected by zero-trust auth                                         | Tunnel config, ingress policy, smoke test                       |
| F-003 | `master-audit-2026-05-10`                                                       | Security / resilience        | P1       | Replay guard falls back to memory nonce state in production                                                | Fail-open degraded-mode design                                                    | Fail closed in production when Redis is missing or unavailable; keep memory fallback dev-only                     | Platform Security           | 1      | Production service is unready/unhealthy without durable nonce store                                                    | Unit/integration tests, readiness behavior, runbook update      |
| F-004 | `master-audit-2026-05-10`                                                       | Compliance / auditability    | P1       | Audit immutability check is a no-op                                                                        | Migration workflow logs success without live verification                         | Add privilege verification and negative mutation tests for audit tables                                           | Data Platform               | 1      | Release or migration fails if audit tables permit mutation                                                             | SQL verification, CI job, evidence artifact                     |
| F-005 | `master-audit-2026-05-10`                                                       | CI/CD / compliance           | P1       | Release evidence job is intentionally partial                                                              | CI tolerates missing smoke target with `continue-on-error`                        | Require complete release-evidence generation against a real smoke target or split partial path from required path | DevOps                      | 3      | Shipping workflow fails on incomplete evidence                                                                         | Workflow diff, artifact inspection, green CI                    |
| F-006 | `master-audit-2026-05-10`, `documentation-coverage-proposal`                    | Docs / DX / CI               | P1       | Docs CI gate checks only stale `_sop/` refs and old GitHub org URLs                                        | No full docs-standard validator in CI                                             | Add broken-link, frontmatter, naming, empty-dir, and index drift validation as required CI                        | Developer Productivity      | 3      | Docs regressions fail CI deterministically                                                                             | Workflow run, validator output, sample failing PR               |
| F-007 | `master-audit-2026-05-10`                                                       | Code quality                 | P2       | Explicit `any` and weak type boundaries remain in replay-protection surface                                | JS typing shortcuts left in place after hardening                                 | Remove explicit `any`, narrow event/listener contracts, and add lint rule coverage                                | Platform Security           | 2      | No explicit `any` remains in owned replay-protection surface                                                           | `rg -n "any"` clean for targeted paths, lint pass               |
| F-008 | `master-audit-2026-05-10`                                                       | Security / trust             | P1       | No third-party pen-test or equivalent external validation is evidenced                                     | Trust story is self-asserted                                                      | Commission external review of gateway, replay guard, and release/audit evidence paths                             | Security / Leadership       | 4      | External report completed, findings triaged, no open criticals                                                         | Pen-test report, remediation tickets, sign-off                  |
| F-009 | `master-audit-2026-05-10`, `production-readiness-evidence-2026-05-08`           | Operations / DR              | P1       | DR and restore proof are not yet institutional-grade                                                       | Runbooks exist, but recurring restore evidence is incomplete                      | Make DR restore drills scheduled, reproducible, and artifacted in CI and non-prod                                 | SRE                         | 4      | Restore drill passes with retained evidence and measured RTO/RPO                                                       | DR workflow artifacts, restore log, runbook record              |
| F-010 | `2026-05-04-full-audit`, `2026-05-05-cycle-7-final`                             | Production / performance     | P1       | Load-test evidence and live alert calibration are incomplete                                               | Observability exists, but sustained traffic evidence does not                     | Run load tests, calibrate thresholds from observed traffic, and encode thresholds as gates                        | SRE / Performance           | 4      | Target RPS, latency, and error budget thresholds proven and documented                                                 | k6 results, dashboard snapshots, alert threshold PR             |
| F-011 | `2026-05-05-cycle-6`, `2026-05-05-cycle-7-final`                                | Operations                   | P2       | PagerDuty wiring exists, but on-call acknowledgement evidence is incomplete                                | Alert routing configured before operational rehearsal                             | Run incident exercises and capture acknowledgement/escalation evidence                                            | SRE / Security              | 4      | At least one drill proves routing, acknowledgement, and escalation                                                     | Drill record, PagerDuty event log, incident artifact            |
| F-012 | `ecosystem-integration.md`, `master-audit-2026-05-10`                           | Ecosystem integration        | P1       | Direct contracts to protocols, mobile, and intelligence are not enforced by cross-repo CI                  | Shared interfaces are documented but not version-gated                            | Add contract tests for protocol tool APIs, replay header contracts, and telemetry schemas                         | Platform / Ecosystem        | 8      | Contract drift breaks CI before merge                                                                                  | Shared fixtures, schema tests, CI matrix                        |
| F-013 | `cycle-2` through `cycle-7-final`, `master-audit-2026-05-10`                    | Governance / audit integrity | P1       | Historical score claims drift from current live evidence                                                   | Audit scoring was advanced faster than proof gating                               | Introduce score-evidence ledger: no score increase without reproducible artifact and CI link                      | CTO / Repo Lead             | 3      | Every score movement cites a reproducible artifact or is blocked                                                       | Audit ledger, documented scoring rule, review checklist         |
| F-014 | `no local UX corpus`, `AI_NATIVE_PATTERNS.md`                                   | UX / design governance       | P2       | Repo has no local UX audit baseline for operator/control-plane surfaces                                    | Infra work was audited for trust and ops, not operator experience                 | Audit control-plane, runbook, and onboarding UX against AI-native and design-bar standards                        | Platform DX                 | 7      | UX baseline documented; anti-pattern list closed; operator journey tested                                              | UX audit doc, checklist, walkthrough evidence                   |
| F-015 | `no local SIGNAL corpus`, `master-audit-2026-05-10`                             | SIGNAL / agentic maturity    | P1       | Agentic maturity is scored, but no repo-local SIGNAL rubric or gate exists                                 | Maturity judgment is narrative, not instrumented                                  | Create repo-local SIGNAL scorecard tied to policy, approval, provenance, and degraded-mode tests                  | Platform AI Safety          | 5      | SIGNAL score is computed from tests and policy checks, not prose                                                       | Scorecard doc, CI checks, audit mapping                         |
| F-016 | `gtcx-hardening-strategy`, `master-audit-2026-05-10`                            | Innovation / trust           | P2       | Audit trail is append-only by design but not tamper-evident beyond DB controls                             | No cryptographic anchoring layer                                                  | Design and stage Merkle-root or equivalent tamper-evident anchoring for audit ledger                              | Security Architecture       | 9      | ADR accepted; prototype proves anchor generation and verification                                                      | ADR, design doc, prototype evidence                             |
| F-017 | `gtcx-hardening-strategy`, `infrastructure-improvement-roadmap`                 | Architecture / operability   | P2       | Critical control-plane logic remains spread across shell and thin wrappers                                 | Safety-critical operations are hard to unit test and reason about                 | Reduce shell authority surface and move high-risk logic behind typed, testable interfaces                         | Platform Engineering        | 2      | Critical deployment/evidence logic has typed tests and clearer ownership boundaries                                    | Test coverage, module boundaries, ADR/update                    |
| F-018 | `gtm-q2-africa`, `pilot-success-criteria`                                       | Global South resilience      | P1       | Low-connectivity and offline requirements are stated, but proof is incomplete for exposed services         | Pilot criteria exist without repeatable degraded-mode drills                      | Add low-bandwidth, outage, replay, and recovery drills tied to acceptance thresholds                              | Platform / Mobile Interface | 6      | Low-connectivity scenarios pass with no data loss and bounded recovery                                                 | Chaos test output, replay drill logs, pilot acceptance evidence |
| F-019 | `pilot-agreement-template`, `pilot-success-criteria`, `master-audit-2026-05-10` | GTM / compliance             | P1       | Institutional pilot packet is weakened by unresolved trust controls and incomplete DPA/evidence references | Commercial docs outpace live bank-grade controls                                  | Update pilot packet only after trust controls are fixed and evidence links are real                               | GTM / Compliance            | 10     | Pilot agreement, success criteria, and data-flow evidence are internally consistent and auditable                      | Updated pilot pack, DPA checklist, link check                   |
| F-020 | `production-readiness-evidence-2026-05-08`                                      | Ecosystem program            | P2       | Ecosystem blockers are tracked informally across peer repos, not as interface obligations                  | Cross-repo health is reported, not enforced                                       | Convert ecosystem health list into owned dependency matrix with contract owners and escalation paths              | TPM / Platform              | 8      | Every direct dependency has an owner, version contract, and escalation path                                            | Dependency matrix, review cadence, contract docs                |

## C. Sprint Plan

### Sprint 1. Security + Compliance

**Goal:** Remove all live disqualifiers for institutional trust.

**Exit criteria:**

- F-001 through F-004 are closed with tests and evidence.
- No unauthenticated or ungated mutating AI path remains.
- Production replay protection fails closed on durable-store loss.
- Audit immutability is verified, not asserted.

**Tasks:**

- Implement gateway authentication, scoped authorization, and approval gating for mutating tools. Links: F-001, F-002.
- Split read-only and mutating tool registries and require explicit approval context for state changes. Links: F-001.
- Remove or protect `query.gtcx.trade` until the trust boundary exists. Links: F-002.
- Make Redis mandatory in production replay-guard startup/readiness logic. Links: F-003.
- Add audit DB privilege verification and negative-write validation to migration/release flows. Links: F-004.

**Risks:**

- Downstream protocol APIs may need auth or idempotency adjustments.
- Gateway product expectations may be incompatible with stricter approval gating.

**Rollback plan:**

- Keep gateway read-only mode available while mutating tools remain disabled.
- Revert traffic exposure before reverting authn/authz changes.

### Sprint 2. Code Quality + Architecture

**Goal:** Remove unsafe type shortcuts and reduce safety-critical shell authority.

**Exit criteria:**

- F-007 and F-017 are closed.
- High-risk operational paths have typed tests or constrained interfaces.

**Tasks:**

- Remove explicit `any` usage and weak listener signatures in replay-protection. Link: F-007.
- Inventory high-risk shell logic and move safety-critical decisions behind typed, testable modules. Link: F-017.
- Document architecture boundaries for control-plane, replay-protection, and gateway responsibility lines.

**Risks:**

- Over-refactoring could create scope creep.

**Rollback plan:**

- Limit code motion to audited surfaces; preserve shell entrypoints while replacing internals incrementally.

### Sprint 3. Tests + CI/CD

**Goal:** Turn evidence, docs, and score movements into hard gates.

**Exit criteria:**

- F-005, F-006, and F-013 are closed.
- CI fails on incomplete release evidence, docs-standard regressions, and unsupported score changes.

**Tasks:**

- Replace partial release-evidence generation with required complete evidence for shipping paths. Link: F-005.
- Add full docs-standard validation to CI. Link: F-006.
- Create score-evidence ledger rules for future audits. Link: F-013.

**Risks:**

- False positives can erode trust in the new gates.

**Rollback plan:**

- Introduce gates in report-only mode for one cycle, then flip to required once noise is removed.

### Sprint 4. Production Readiness + Ops

**Goal:** Prove restore, rollback, load, alerting, and response with artifacts.

**Exit criteria:**

- F-008, F-009, F-010, and F-011 are closed or blocked only on scheduled external review.
- DR, rollback, and load evidence are reproducible.

**Tasks:**

- Institutionalize DR restore testing with stored artifacts. Link: F-009.
- Run load tests and calibrate alert thresholds from observed data. Link: F-010.
- Execute incident drills and capture PagerDuty acknowledgement evidence. Link: F-011.
- Schedule and ingest external security review findings. Link: F-008.

**Risks:**

- Requires staging or testnet stability and external coordination.

**Rollback plan:**

- Run destructive exercises only in non-production.
- Use documented rollback evidence capture for all failed experiments.

### Sprint 5. AI / Agentic Maturity

**Goal:** Convert narrative agentic claims into measurable policy-enforced maturity.

**Exit criteria:**

- F-015 is closed.
- Repo-local agentic maturity scoring exists and is CI-enforced.

**Tasks:**

- Define SIGNAL-equivalent pillars for this repo: identity, approval, provenance, degraded mode, evaluation.
- Map each pillar to executable checks.
- Add policy tests proving intelligence behaves like infrastructure gravity, not a privileged operator shortcut.

**Risks:**

- Metric design can become abstract if not tied to concrete safety checks.

**Rollback plan:**

- Keep the initial scorecard minimal and test-driven; expand only after stable enforcement.

### Sprint 6. Global South Resilience

**Goal:** Prove low-connectivity, intermittent-power, and degraded-mode behavior.

**Exit criteria:**

- F-018 is closed.
- Replay, outage, and recovery drills pass with retained auditability.

**Tasks:**

- Add low-bandwidth and intermittent-connectivity drills for replay-guard and dependent request contracts.
- Prove no data loss during reconnect and recovery.
- Tie pilot success metrics to measured degraded-mode evidence.

**Risks:**

- Some proof depends on downstream mobile and protocol behavior.

**Rollback plan:**

- Scope drills to contract boundaries first; only extend to end-to-end once peer repos are aligned.

### Sprint 7. UX + Design

**Goal:** Establish and clear the operator/control-plane UX baseline for this repo.

**Exit criteria:**

- F-014 is closed.
- Operator onboarding, runbook flows, and exposed control-plane interfaces comply with AI-native pattern rules.

**Tasks:**

- Create repo-local UX audit for onboarding, runbooks, CLI/control-plane flows, and exposed service docs.
- Remove anti-patterns that encourage unsafe “AI as button” workflows in operator documentation.
- Measure clone-to-run-to-evidence flow time for a new engineer.

**Risks:**

- This repo has limited UI surface; UX work must stay on operator and engineer journeys.

**Rollback plan:**

- Treat UX baseline as documentation and flow improvement, not UI feature work.

### Sprint 8. Ecosystem Integration

**Goal:** Turn cross-repo assumptions into explicit contracts and escalation paths.

**Exit criteria:**

- F-012 and F-020 are closed.
- Direct dependencies have tested contracts and named owners.

**Tasks:**

- Add contract tests for protocol handler APIs, replay header contracts, and telemetry schemas.
- Publish dependency matrix with owners and escalation paths.
- Add drift-prevention gates for shared contracts.

**Risks:**

- Requires coordination with peer repos and may expose unresolved upstream drift.

**Rollback plan:**

- Start with report-only contract checks on peer branches before making them blocking.

### Sprint 9. Innovation Gaps

**Goal:** Close the highest-value trust innovation gaps without creating unrelated product surface.

**Exit criteria:**

- F-016 is at least design-complete with an accepted ADR and prototype evidence.
- Innovation work remains tied to audit findings, not speculative features.

**Tasks:**

- Design tamper-evident audit anchoring.
- Validate whether typed control-plane consolidation needs additional ADRs beyond Sprint 2.
- Record which innovation items are mandatory for 10/10 trust and which are post-10/10 extensions.

**Risks:**

- Innovation can sprawl unless tightly bounded by audit findings.

**Rollback plan:**

- Keep all innovation work behind ADR and prototype gates until explicitly approved for production rollout.

### Sprint 10. Docs + DX + GTM

**Goal:** Make the repo auditable, operable, and commercially defensible for regulated pilots.

**Exit criteria:**

- F-019 is closed.
- Docs-standard reaches 10/10 and the repo can support a regulator or enterprise audit without follow-up.

**Tasks:**

- Finish remaining docs-standard cleanup and split overlength critical docs where needed.
- Update pilot agreement, success criteria, and evidence references to only point at live controls.
- Prove new engineer clone-to-run-to-deploy under 30 minutes or document blockers with fixes.

**Risks:**

- GTM collateral can drift again if underlying controls are not already fixed.

**Rollback plan:**

- Freeze commercial packet updates until the technical evidence set is final.

## D. Bank-Grade Compliance Checklist

| Control area                        | Current state                                                                                               | Gap                                                                                                                                    | Required remediation                                                     | Evidence link / target proof                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Encryption at rest                  | RDS, S3, ECR, and EKS encryption are documented as implemented                                              | Need a consolidated bank-grade evidence bundle, not scattered claims                                                                   | Generate a single encryption proof pack per environment                  | `docs/audit/master-audit-2026-05-10.md`, Terraform module outputs, CI evidence artifacts                 |
| Encryption in transit               | Public ingress and internal services exist; public gateway path is unsafe from an authorization perspective | No proven protected control path for consequential AI actions; no repo-proven service-to-service trust policy for gateway -> protocols | Close F-001/F-002 and document internal trust requirements               | `tools/compliance-gateway/src/server.mjs:43`, `infra/kubernetes/base/services/cloudflared/config.yaml:9` |
| Key rotation / KMS                  | KMS-backed storage is present in prior audits                                                               | Rotation evidence is not assembled as an audit pack                                                                                    | Add scheduled evidence capture and control checklist                     | Terraform/KMS configs, rotation records                                                                  |
| Audit logging / immutability        | Append-only audit design exists                                                                             | Live immutability verification is missing                                                                                              | Close F-004; stage cryptographic anchoring via F-016                     | `infra/scripts/migrate.sh:228`, audit verification job                                                   |
| Data residency / PII / redaction    | Pilot docs and templates call out af-south-1 and no AI training on customer data                            | DPA/data-flow references are not yet an institutional evidence packet                                                                  | Update pilot packet after control fixes and link real data-flow evidence | `docs/assessments/pilot-agreement-template.md`, `docs/assessments/pilot-success-criteria.md`             |
| Supply chain / SBOM / signed builds | Trivy, dependency audit, Terraform validation, and artifact upload exist                                    | Signed build / attestation proof is not evidenced in current audit set; release evidence path is partial                               | Close F-005 and expand build provenance evidence                         | `.github/workflows/ci.yml`, release-evidence artifacts                                                   |
| Secrets management                  | External secret patterns and secret references exist                                                        | Secret-zero and operator-path proof is incomplete                                                                                      | Confirm only approved secret injection paths remain and evidence them    | Secrets modules, runbooks, ESO manifests                                                                 |
| Separation of duties                | Production deploy requires approval ticket in script                                                        | No in-repo proof that deployer != approver or that prod access is JIT-governed end-to-end                                              | Add deploy/access evidence pack and review control ownership             | `infra/scripts/deploy.sh:122`, JIT access policy docs                                                    |

## E. Global South Resilience Checklist

| Area                         | Current state                                                | Gap                                                                              | Required proof                                                |
| ---------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Offline / delayed replay     | Replay-protection semantics and mobile header contract exist | Production degraded mode weakens on Redis loss                                   | Redis fail-closed tests, reconnect drill evidence             |
| Low-bandwidth operation      | Pilot and GTM docs recognize 2G/3G constraints               | No measured low-bandwidth drill artifacts for exposed services                   | Throttled-network replay/query drills with pass thresholds    |
| Graceful degradation         | Chaos artifacts and runbooks exist                           | No unified degraded-mode certification for gateway/replay/control-plane surfaces | Degraded-mode test matrix and CI or scheduled exercise output |
| Intermittent power recovery  | Edge and replay concepts assume resumable operation          | No explicit power-loss recovery proof in this repo                               | Restart/recovery drill showing no audit loss                  |
| Multilingual operations      | Strategic need is documented at ecosystem level              | No repo-local operator language baseline or runbook translation plan             | Operator-language requirements and ownership list             |
| Low-end device compatibility | This repo is infrastructure, not the mobile app              | Contract proof with mobile is missing                                            | Cross-repo contract test evidence with `gtcx-mobile`          |

## F. AI / Agentic Maturity Ladder

| Pillar                          | Current level | Evidence                                                                                  | Next level move                                                     | Where intelligence should feel like gravity                         |
| ------------------------------- | ------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Routing / cost optimization     | Level 2       | Multi-provider routing and fallback exist in `tools/compliance-gateway/src/server.mjs`    | Keep routing, but subordinate it to policy and identity             | Provider choice and fallback should be invisible to operators       |
| Identity / authorization        | Level 0       | No auth boundary on `/v1/query`                                                           | Add strong caller identity and scoped authz                         | Intelligence should never exist as an anonymous operator            |
| Consequential action governance | Level 0       | Mutating tools are mixed with read-only tools in `tools/compliance-gateway/src/tools.mjs` | Separate read-only and mutating actions and require approval proofs | Intelligence may assist, but it must not self-authorize action      |
| Provenance / explainability     | Level 1       | Tool calls and tool results are returned in responses                                     | Persist signed decision/audit records for all consequential flows   | Operators should see why a recommendation exists when it matters    |
| Degraded mode safety            | Level 1       | Replay guard exposes Redis health metrics, but weakens on failure                         | Fail closed and prove degraded-mode behavior                        | Resilience should be automatic, not operator guesswork              |
| Evaluation / gating             | Level 0       | No repo-local SIGNAL gate or scorecard                                                    | Close F-015 with executable maturity checks                         | Intelligence quality should be enforced in CI, not narrated in docs |

## G. Ecosystem Integration Map

The local evidence file `docs/audit/production-readiness-evidence-2026-05-08.md` lists a broader ecosystem set that currently spans 18 peer repos in addition to this one. Only direct, evidenced couplings are treated as hard dependencies here.

| Repo / system                            | Relationship to GTCX Infrastructure | Shared contract                                                     | Drift risk                                                                     | Prevention                                              |
| ---------------------------------------- | ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `gtcx-protocols`                         | Direct dependency                   | `/v1/{protocol}/{handler}` HTTP contract used by compliance gateway | Tool schema or auth drift can silently break or over-authorize gateway actions | OpenAPI or schema contract tests, auth contract tests   |
| `gtcx-mobile`                            | Downstream client / security peer   | `X-GTCX-*` replay and integrity header contract                     | Signature, nonce, or hash semantics drift breaks offline replay                | Shared fixtures and end-to-end conformance tests        |
| `gtcx-intelligence` / ANISA surfaces     | Direct platform peer                | Telemetry, deployment, and ingress expectations                     | Metrics/schema drift weakens observability and agentic evidence                | Shared telemetry schema tests and healthcheck contracts |
| `6-platforms` / AGX-adjacent services    | Direct deployment peer              | SLOs, rollout patterns, image and service contracts                 | Deployable service expectations drift from infra manifests                     | Deployment smoke tests and manifest schema validation   |
| `compliance-os` / evidence consumers     | Governance peer                     | Evidence bundle and audit artifact formats                          | Evidence consumers diverge from artifact schema                                | Versioned JSON schema and artifact contract checks      |
| `sensei-ai` / intelligence support repos | Supporting peer                     | Model or observability deployment conventions                       | Runtime or metric incompatibility                                              | Version pinning and smoke tests                         |

## H. Evidence & Verification Protocol

| Dimension                   | Metric                                                                                                    | How measured                                                                | Gate that prevents regression                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| Security + compliance       | 0 open P0/P1 trust findings                                                                               | Integration tests, authz tests, audit-verification job, external review     | Required CI security jobs + approval tests        |
| Code quality + architecture | 0 explicit `any` in owned critical paths; typed tests for safety-critical modules                         | ESLint, targeted `rg`, unit tests, architecture review                      | Lint/typecheck + path-specific policy checks      |
| Tests + CI/CD               | 100% required workflows green; no partial release evidence on ship path                                   | GitHub Actions artifacts and status checks                                  | Required checks on `main` and release branches    |
| Production readiness + ops  | DR restore pass, rollback pass, load-test pass, alert acknowledgement proven                              | DR workflow, canary rollback workflow, k6 artifacts, incident drill records | Scheduled workflow + release checklist gate       |
| AI / agentic maturity       | Agentic score computed from policy checks; 0 anonymous consequential actions                              | SIGNAL-equivalent scorecard and policy/integration tests                    | Agentic-policy CI job                             |
| Global South resilience     | Degraded-mode drills pass with no data loss and bounded recovery                                          | Replay/outage/network simulation artifacts                                  | Scheduled resilience exercise + release checklist |
| UX + design                 | New engineer can clone -> run -> inspect evidence in <30 min; no AI-native anti-patterns in operator flow | Time-boxed walkthrough and UX audit checklist                               | Onboarding acceptance checklist in CI/docs review |
| Ecosystem integration       | All direct contracts versioned and tested                                                                 | Cross-repo contract suite                                                   | Contract-test matrix                              |
| Innovation gaps             | Trust-critical innovation ADRs accepted and prototyped                                                    | ADR review and prototype verification                                       | Architecture review gate                          |
| Docs + DX + GTM             | Docs-standard 10/10; pilot packet links only to live evidence                                             | Docs validator, link checker, commercial packet review                      | Docs gate + release review checklist              |

## Approval gate

Execution does not begin until this plan is approved. On approval, Sprint 1 starts first and no later sprint advances until its exit criteria are evidenced.
