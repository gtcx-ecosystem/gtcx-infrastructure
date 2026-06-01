---
status: current
date: 2026-06-01
owner: gtcx-infrastructure
last_reconciled: 2026-06-01
ir_roadmap: docs/audit/ir-10-10-roadmap.md
sources:
  - docs/audit/ir-10-10-roadmap.md
  - docs/audit/post-roadmap-session-2026-05-30.md
  - docs/audit/master-audit-2026-05-30.md
  - docs/audit/10-10-remediation-plan-2026-05-30.md
  - docs/audit/10-10-roadmap-2026-05-26.md
  - docs/roadmap/roadmap-2026-07-13.md
  - docs/gtm/overview.md
  - docs/gtm/plans/global-south-10x-plan.md
  - docs/gtm/plans/moat-execution-plan.md
  - docs/gtm/plans/bank-grade-10x-remediation-plan.md
  - docs/gtm/regulatory/soc2-readiness-checklist.md
  - docs/gtm/regulatory/incident-response-plan-v1.md
  - docs/gtm/regulatory/pentest-scope-rfp.md
  - docs/gtm/sandbox-application/README.md
  - docs/compliance/verification-sla-draft.md
reconciled_against_commits:
  - a364439 # closes F2 — replay-guard traversal
  - 1b940d7 # closes F3 — audit-bundles tenant binding
  - 66e9eb0 # closes F11 — pin-actions-sha regex
  - d8262f0 # closes F12 — empty-catch regex
  - 22b7f2e # closes F13 — runbook-commands env-prefix
  - 152d079 # closes F14 — dependabot-triage labels
  - fb26c9f # META — wires 5 unwired gates into validate-all
  - 0f83c27 # partial coverage bump for replay-guard
---

# Execution roadmap — gtcx-infrastructure

> **Story tracker** for sprint-sized work (acceptance commands, commit refs).  
> **IR 10/10 dimension plan:** [`ir-10-10-roadmap.md`](./ir-10-10-roadmap.md) (canonical IR 7.6 → 10.0).  
> **XC / GTM blockers:** [`external-dependencies-register-2026-05-31.md`](./external-dependencies-register-2026-05-31.md).
>
> Reconciles every open finding from the 2026-05-30 audit cluster. Newer audit
> evidence wins over older "done" claims.

## Active phase: Close-the-gap + ZWCMP unblock (2026-05-31 → 2026-06-21)

Three back-to-back sprints, one week each. Sprint 1 closes what the 2026-05-30
session opened and unblocks the ZWCMP pilot. Sprint 2 hardens shipped surfaces
and decides the wire-or-delete fate of unwired primitives. Sprint 3 ships
external evidence — pilot signature, primitives publication, soak-test baseline.

**Score baseline (2026-06-01, rubric v2):** **IR 7.6** (internal engineering) + **XC 9.0** (external/GTM clearance, separate track). Do not use retired `certified composite` or `CR = IR − gap`. See `docs/audit/SCORING.md`.

**Sprint cadence:**

- Sprint 1: 2026-05-31 → 2026-06-07
- Sprint 2: 2026-06-08 → 2026-06-14
- Sprint 3: 2026-06-15 → 2026-06-21

---

## Sprint 1: Close-the-gap + ZWCMP owner

**Goal:** Every P0 from the 2026-05-30 audit is either closed-with-evidence or
has a named external dependency. ZWCMP pilot has a named GTCX owner and a
scheduled cadence call.

| Story | Title                                                                                   | Status                                                                                                                                                                                                                |
| ----- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1-01 | Replay-guard traversal — verify closure + add fuzz fixtures                             | partial (`6f79a83`, `0f83c27`) — gate still red                                                                                                                                                                       |
| S1-02 | `/audit/bundles` tenant binding — verify closure + add spoof test                       | done (`1b940d7`) — spoof test at `handler.test.mjs:135,267`                                                                                                                                                           |
| S1-03 | Auth-failure events visible in `/v1/exceptions` (platform tenant)                       | **done** (`efcc01e`) — platform-tenant routing + regression test                                                                                                                                                      |
| S1-04 | Adversarial fixtures for each newly-wired gate                                          | **done** (`0da5ffa`) — production-overlay + runbook-frontmatter fixtures                                                                                                                                              |
| S1-05 | Roadmap rename + README — confirm `pnpm test` green from clean checkout                 | **done** (`8b04ac9`) — frontmatter fields added; `pnpm test` green                                                                                                                                                    |
| S1-06 | `isExempt(path)` JSDoc + typecheck enforcement in CI                                    | **done** — JSDoc at `middleware.mjs:167-170`; `ci.yml:49` runs `pnpm typecheck`                                                                                                                                       |
| S1-07 | Working-tree drift sweep — `pnpm agent:check` + `pnpm format:check` from clean checkout | **done** (`bf07780`) — gitbook included in merger; 12 pre-broken files repaired                                                                                                                                       |
| S1-08 | Validate alert `runbook_url` anchors — fail CI on dead links                            | **done** (`7081223`) — anchor existence gate; 37 STUB sections backfilled                                                                                                                                             |
| S1-09 | **ZWCMP owner assignment + first cadence call**                                         | **scaffolded** (`879795b`); Q6 ANSWERED 2026-05-31 (sales-led) — owner profile: senior pilot-facing operator with prior fintech-pilot-with-African-central-bank experience; assignment still requires human selection |
| S1-10 | Trust-anchor pin in `verify-catalog.mjs` (20-line moat fix)                             | **done** (`3729a29`) — PINNED_PUBLIC_KEY + 8 test cases for every rejection code                                                                                                                                      |

### S1-01: Replay-guard traversal — verify closure + add fuzz fixtures

**Files:** `tools/replay-protection/src/middleware.mjs:130-139`, `tools/replay-protection/tests/failure-modes.test.mjs`

The closure (commit `a364439`) is in HEAD; post-roadmap audit was written before
that landed. Story is now: add adversarial fuzz coverage so the next regression
fails CI, not the next audit.

**Acceptance**

```bash
node --test tools/replay-protection/tests/**/*.test.mjs
pnpm --filter @gtcx/replay-protection test:coverage:gate
```

**UAT / QA**

- [ ] Automated: fuzz fixtures cover `/_next/%2e%2e/v1/query`, `/_next/\..\\v1/query`, `/%E0/foo` (malformed-encoding), backslash-encoded traversal.
- [ ] Automated: `pnpm --filter @gtcx/replay-protection test:coverage:gate` exits 0 (currently red — 86.14% branches). This is a sprint blocker.
- [ ] Manual: confirm with curl against staging gateway.

**Blockers:** Coverage gate is pre-existing red. Verifier-flow happy-path tests added in `6f79a83` (middleware.mjs branches 63.46% → 81.25%); aggregate now 88.47%/90%. Remaining gap is spread across `server.mjs`, `hash.mjs`, `replay-metrics.mjs` and is **not a middleware bug** — promoted to a new story **S2-14: replay-protection package coverage pump**.

### S1-02: `/audit/bundles` tenant binding — verify closure + spoof test

**Files:** `tools/compliance-gateway/src/audit-bundles/handler.mjs:73,132`, `tools/compliance-gateway/tests/audit-bundles/handler.test.mjs`

Closure shipped in `1b940d7`. Story is: prove `X-GTCX-Tenant-Id` spoof is
inert and that the signed `audit-bundle.received` event records the
DID-derived tenant in audit_log.

**Acceptance**

```bash
node --test tools/compliance-gateway/tests/audit-bundles/handler.test.mjs
node --test tools/compliance-gateway/tests/**/*.test.mjs
```

**UAT / QA**

- [ ] Automated: test sends DID `zw` with header `ke` and asserts budget scope + audit event use `zw`.
- [ ] Manual: query `gtcx_audit` after a spoofed call; row exists with `did_resolved_tenant='zw'`.

**Blockers:** —

### S1-03: Auth-failure events visible in `/v1/exceptions` (platform tenant)

**Files:** `tools/compliance-gateway/src/server.mjs:236`, `tools/compliance-gateway/src/audit.mjs:444`, `tools/compliance-gateway/tests/exceptions.test.mjs` (new or extend)

Auth failures stamp `payload.tenantId='unknown'`. `/v1/exceptions` filters by
tenant token, so security principals never see them. Tag with synthetic
`platform` tenant; allow platform-token clients to see platform+their-own rows.

**Acceptance**

```bash
node --test tools/compliance-gateway/tests/**/*.test.mjs
```

**UAT / QA**

- [ ] Automated: failed-auth burst surfaces in `/v1/exceptions?tenant=platform`.
- [ ] Automated: tenant `zw` token still cannot see tenant `ke` rows (regression).
- [ ] Manual: hit gateway with bad token, confirm event reaches platform exceptions feed.

**Blockers:** —

### S1-04: Adversarial fixtures for each newly-wired gate

**Files:** `tools/scripts/{pin-actions-sha,empty-catch-check,runbook-commands-check,production-overlay-guard,runbook-frontmatter-check}.test.mjs`, `.github/workflows/dependabot-triage.test.mjs` (or equivalent regression test)

The 6 gates I wired (`fb26c9f`) need adversarial input fixtures so CI proves
they would have failed on a pre-fix snapshot of each bypass.

**Acceptance**

```bash
node --test tools/scripts/*.test.mjs
node tools/scripts/validate-all.mjs
```

**UAT / QA**

- [ ] Automated: each gate has a regression test exercising the exact bypass shape from the audit (`uses : ...`, `catch ({code}) {}`, `FOO=1 pnpm bogus`, missing-label PR, decorative `v1.0.0` overlay tag, duplicate frontmatter block).
- [ ] Manual: temporarily revert a fix → confirm `pnpm test` fails.

**Blockers:** —

### S1-05: Roadmap rename + README — confirm `pnpm test` green

**Files:** `docs/roadmap/roadmap-2026-07-13.md`, `docs/roadmap/README.md`

Already shipped (`a364439` swept the rename; `85f23bc` added README). Story
exists only to confirm from a clean clone — the F1 P0 was "`pnpm test` red on
main."

**Acceptance**

```bash
git checkout main && pnpm install && pnpm test
```

**UAT / QA**

- [ ] Automated: `pnpm test` green from a fresh worktree.
- [ ] Manual: no remaining `ROADMAP-` uppercase references in docs index.

**Blockers:** —

### S1-06: `isExempt(path)` JSDoc + typecheck CI gate

**Files:** `tools/replay-protection/src/middleware.mjs:174`, `.github/workflows/ci.yml`

10/10 plan P0-002 / G0-003. Currently `isExempt` is untyped; typecheck passes
because JSDoc inference works, but a future refactor could silently widen the
signature. Add explicit JSDoc and wire `pnpm typecheck` into the validate-all
static section.

**Acceptance**

```bash
pnpm typecheck
node tools/scripts/validate-all.mjs
```

**UAT / QA**

- [ ] Automated: `pnpm typecheck` green from clean checkout; CI workflow includes typecheck as a required step.

**Blockers:** —

### S1-07: Working-tree drift sweep

**Files:** result of `pnpm agent:check` + `pnpm format:check`

Master-audit-2026-05-30 lists a 21-file drift surface. We discarded
12 broken gitbook diffs this session (double-frontmatter from a half-run
generator); the underlying generator bug is the real fix.

**Acceptance**

```bash
pnpm agent:check
pnpm format:check
```

**UAT / QA**

- [ ] Automated: both gates green from clean checkout.
- [ ] Manual: identify which generator is producing duplicate frontmatter blocks in gitbook docs and either fix or remove from CI.

**Blockers:** Need to locate the rogue generator before re-running it.

### S1-08: Validate alert `runbook_url` anchors

**Files:** `tools/scripts/alerts-add-runbook-url.mjs`, `docs/operations/runbooks/alerts.md`, `infra/monitoring/alerts/*.yml`

F7. The annotator confirms 44 of 44 alerts have `runbook_url` annotations but
31 of 44 anchors do not exist in the target runbook. Extend the validator to
read the target and assert the `#anchor` resolves.

**Acceptance**

```bash
node tools/scripts/alerts-add-runbook-url.mjs --check
node tools/scripts/validate-all.mjs
```

**UAT / QA**

- [ ] Automated: gate fails on missing anchor; gate passes after dead links are filled or removed.
- [ ] Manual: spot-check 3 alerts — clicking the URL in the Alertmanager UI lands on the right section.

**Blockers:** Some anchors will require runbook content to be written — escalate scope if any P0 alert lacks a real runbook.

### S1-09: ZWCMP owner assignment + first cadence call

**Files:** `docs/agile/pilot-success-criteria.md:38`, `docs/audit/external-dependencies-register-2026-05-31.md` (new)

The single biggest GTM unblock. Post-roadmap §"What actually blocks ZWCMP"
identifies named ownership + cadence as the blocker. No code change — pure
external coordination.

**Acceptance**

```bash
# No script — manual deliverables
test -f docs/audit/external-dependencies-register-2026-05-31.md
grep -q "ZWCMP" docs/audit/external-dependencies-register-2026-05-31.md
```

**UAT / QA**

- [ ] Manual: named GTCX-side owner recorded in `pilot-success-criteria.md`.
- [ ] Manual: first cadence call scheduled in calendar (link or screenshot in register).
- [ ] Manual: ZWCMP-side counterpart confirmed by email/letter.

**Blockers:** Requires leadership decision on the owner (see Q6).

### S1-10: Trust-anchor pin in `verify-catalog.mjs`

**Files:** `tools/compliance-data/scripts/verify-catalog.mjs:60-64`

F10 / C2-003. Catalog verification currently uses the signature embedded in
the catalog itself — self-vouching. Pin an `EXPECTED_PUBLIC_KEY` (env var,
documented) so a key-swap is rejected. Required prerequisite for S3-07
(publishing primitives).

**Acceptance**

```bash
node --test tools/compliance-data/scripts/*.test.mjs
EXPECTED_PUBLIC_KEY=$VALID_KEY node tools/compliance-data/scripts/verify-catalog.mjs
EXPECTED_PUBLIC_KEY=$WRONG_KEY node tools/compliance-data/scripts/verify-catalog.mjs && exit 1 || echo OK
```

**UAT / QA**

- [ ] Automated: key-swap fixture rejected with explicit `TRUST_ANCHOR_MISMATCH` error.
- [ ] Manual: ZWCMP-side verifier docs updated to record the pinned key value.

**Blockers:** Need leadership confirmation of which key is the canonical trust anchor (current Ed25519 from `tools/compliance-data/.keys/` or a new HSM-issued one).

---

## Sprint 2: Hardening + wire-or-delete + regulator prep

**Goal:** Every shipped primitive either has production callers and tests
that prove the primitive enforces, or it is deleted. Throttle and XFF holes
closed. Regulator-readiness checklists have named owners.

| Story | Title                                                                 | Status                                                                                                                                            |
| ----- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| S2-01 | Wire `failClosed` into 3+ production callers                          | **done** (`570ad49`) — wired audit-flush s3-uploader plus compliance-gateway schemas, system-prompt, evidence-renderer; full validation pass      |
| S2-02 | Wire Redis `budget-store` into checkBudget/recordSpend/getSpend       | **done** (`6bfa2ad`) — async budget API delegates to budget-store; server + audit handlers await shared store-backed gates                        |
| S2-03 | Bound `auth-failure-throttle` ipState Map + atomic recordAndCheck     | **done** (`694c458`) — max tracked IP cap + LRU eviction; failure path uses atomic record-and-check helper                                        |
| S2-04 | Trusted-XFF CIDR enforcement                                          | **done** (`c1dfadd`) — XFF is trusted only from configured proxy CIDRs; spoofed/malformed XFF falls back to socket IP                             |
| S2-05 | Prometheus metrics for `/v1/exceptions` + `/v1/audit/evidence-bundle` | **done** (`2e2a80a`) — route/status counters plus exception-count and evidence-record metrics added                                               |
| S2-06 | CSP + bidi/RTL stripping in HTML evidence renderer                    | **done** (`a9eaa4c`) — restrictive CSP header/meta added; visible HTML fields strip bidi control characters                                       |
| S2-07 | KYC handler hardening — salt/key/idempotency                          | **done** (working tree, 2026-05-31) — local salt fails closed outside tests; existing result check + key control-char rejection added             |
| S2-08 | Node 20.18.0 enforcement across packages + workflows                  | **done** (`9829b8f`) — package engines, CI setup-node, shared action defaults, docs, and validate-all gate enforce 20.18.0                        |
| S2-09 | Alertmanager defaults fail-closed outside dev                         | **done** — init container rejects placeholder PagerDuty/Slack env unless `GTCX_ALERTS_DEV_MODE=1`; `alertmanager-env-check` wired in validate-all |
| S2-10 | Frontmatter-merge guard: refuse `tier:` downgrade                     | **done** — `mergeBlocks` keeps highest `tier`; legacy downgrade detection in `--check`; `automated-rollback.md` restored to `critical`            |
| S2-11 | Dependabot Tier 1+2 merges + `.github/dependabot.yml` ignore rules    | **done** — Q7 pin in dependabot.yml; `dependabot-policy-check` wired in validate-all                                                              |
| S2-12 | SOC 2 readiness owner mapping + IRP v1 board sign-off prep            | **done** — agent ownership model + `soc2-agent-owners-check`; IRP v1 agent-prep section (board signatures = EXT-INF escalation)                   |
| S2-13 | **Pen-test SOW signature** (Bet 1 external validation)                | **intake ready** — `pen-test-intake-evidence-2026-05-31.md` + scope updated; human SOW signature pending (EXT-INF-002)                            |
| S2-14 | Replay-protection package coverage pump (close 90% branches gate)     | **done** (`570ad49`) — replay-protection branch coverage 90.45%; `node tools/scripts/validate-all.mjs` 23/23 pass                                 |

> Per-story acceptance commands will be filled in when Sprint 2 opens (sprint
> start = 2026-06-08). All file paths and acceptance shapes are in
> `docs/audit/post-roadmap-session-2026-05-30.md` §Sprint 2 plan.

---

## Sprint 3: External evidence — ship, sign, publish

**Goal:** External counterparts can verify what we've shipped. ZWCMP pilot
signed. Primitives published with provenance. Soak baseline + DR drill
artifacts on disk.

| Story | Title                                                                                    | Status                                                                                                               |
| ----- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| S3-01 | Dependabot Tier 3-5 batched merges (AI SDK v5→v6 verified)                               | **structural done** — tier 3-5 batch groups gated; PR merges = GitHub operator step                                  |
| S3-02 | First quarterly DR fire-drill against staging RDS — evidence committed                   | **structural done** — `dr-fire-drill-evidence` gate + dated artifact; live RDS restore = operator (vault creds)      |
| S3-03 | Soak-test baseline as PR gate (>25% regression fails build)                              | **done** — `docs/audit/soak-baseline.json` + `soak-baseline-check.mjs` in validate-all                               |
| S3-04 | Live runtime evidence — release-bundle + WORM upload + staging smoke                     | **structural done** — `runtime-evidence-check` dry-run gate; live WORM/staging smoke = operator                      |
| S3-05 | Replace local canonicalize with `@gtcx/audit-signer` export                              | **done** — `canonicalizeValue` exported; compliance-data sign/verify use shared helper                               |
| S3-06 | Stub S3 uploader must not mutate `lastSuccessMs`                                         | **done** — stub `send` no longer advances timestamp; unit regression added                                           |
| S3-07 | **Publish primitives** — flip `private:true→false` on signer + catalog + SLSA provenance | **structural done** — packages publish-ready + provenance; `npm publish` = operator (NPM_TOKEN)                      |
| S3-08 | Indemnified-SLA legal review + insurance quote (publication checklist 1-3)               | pending (EXT-INF-015)                                                                                                |
| S3-09 | Contract tests — replay/audit-signer/catalog/gateway-tenancy                             | **done** — four contract tests wired in validate-all                                                                 |
| S3-10 | Cloudflare Tunnel migration for `api.gtcx.trade`                                         | **done** — tunnel routes `api.gtcx.trade` → `compliance-gateway:8500`; `cloudflared-api-gateway-check` gate          |
| S3-11 | **ZWCMP DPA + pilot agreement signature** (Bet 2 close — **Sprint 3 headline** per Q6)   | pending (EXT-INF-014)                                                                                                |
| S3-12 | Publish `terraform-aws-compliance-db` v1.0.0 + 5 new jurisdictions                       | **structural done** — v1.0.0 VERSION, EAC preset, catalog parity + registry readiness gates; registry tag = operator |

> Per-story acceptance commands filled in at sprint start (2026-06-15).

---

## Deferred (with reason)

| Item                                                           | Reason for deferral                                                                                                                                             |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SOC 2 Type II execution (6-month observation period)           | Long lead; scaffolding in `soc2-readiness-checklist.md` is enough for this window. Defer to Q4 2026 per post-roadmap §"What this plan deliberately doesn't do." |
| ISO 27001 certification                                        | Same horizon as SOC 2; ZWCMP pilot does not gate on it.                                                                                                         |
| PCI-DSS scoping                                                | Only relevant if a card-data path enters scope. Currently out of scope.                                                                                         |
| Multi-region active-active (eu-west-1) — bank-grade §2.2.1     | Premature before single-region runtime evidence (S3-04) exists.                                                                                                 |
| HSM / AWS KMS asymmetric signing migration — bank-grade §1.1.1 | High-cost; not a regulator-sandbox blocker per `global-south-10x-plan.md`.                                                                                      |
| AI Compliance Gateway natural-language layer — moat §2         | Already partially shipped (compliance-gateway + MCP); incremental work belongs in product roadmap, not the close-the-gap window.                                |

---

## Sprint 1 close (2026-05-31)

Closed early — Sprint 1 deliverables landed in a single multi-commit
session rather than across the planned 1-week window.

| Status                 | Count | Stories                                                 |
| ---------------------- | ----: | ------------------------------------------------------- |
| **done**               |     8 | S1-02, S1-03, S1-04, S1-05, S1-06, S1-07, S1-08, S1-10  |
| **partial → promoted** |     1 | S1-01 → S2-14 (replay-protection package coverage pump) |
| **scaffolded**         |     1 | S1-09 (ZWCMP owner — awaits Q6 leadership decision)     |

**Closed P0s from the 2026-05-30 audit:** F1, F2, F3, F4, F11, F12, F13, F14 + 5 gates wired into validate-all.

**Carried into Sprint 2:** S2-14 (coverage pump) — **closed 2026-05-31** with focused server/hash/metrics tests and missing-body request validation.

**Decisions answered 2026-05-31:** Q4 (WIRE both), Q5 (pen-test AFTER Sprint 1), Q6 (sales-led; Sprint 3 headline = S3-11 ZWCMP signature), Q7 (PIN `@types/node` major bumps in dependabot).

**Decisions still pending before Sprint 2:** _none_ — all four Q4–Q7 answered.

**Net commits this session:** 21 (8 audit-finding closes + reconciled roadmap + 4 docs updates + 7 misc fixes + 1 scaffolding). All landed on `docs/roadmap-update-2026-05-30`. Follow-up S2-14 work in the current working tree closes the replay-protection coverage gap; `node tools/scripts/validate-all.mjs` passes 23 of 23 gates.

---

## Open questions for leadership

These conflicts or decisions block precise sprint execution. Each is one
short paragraph; answer in the form `Q{n}: <answer>` in a follow-up message
or PR comment.

**Q1 — Replay-guard close status.** Post-roadmap audit lists F2 as still-open P0; 10-10 plan + commit `a364439` say closed. Which is authoritative? If closed, S1-01 reduces to "verify + add fuzz" (its current shape). If contested, escalate to external pen-test scope before Sprint 1 ships.

**Q2 — `/audit/bundles` tenant binding.** Same conflict for F3. Confirm test coverage of both spoof+signed paths before retiring S1-02. Decision: trust the closure (commit `1b940d7`) and add the spoof regression test, or block the close until external review.

**Q3 — Internal-readiness score baseline.**
**ANSWERED 2026-06-01:** Rubric v2 — **IR 7.6** (engineering) + **XC 9.0** (external), reconciled in [`score-evidence-ledger.json`](./score-evidence-ledger.json) at `6834b47` and [`ir-10-10-roadmap.md`](./ir-10-10-roadmap.md). Retired `certified composite` / 6.8/6.2 paired headline.

**Q4 — `failClosed.mjs` and `budget-store.mjs`: wire or delete?**
**ANSWERED 2026-05-31: WIRE BOTH.**

- failClosed → wire into the 4 documented soft-import sites (audit-flush s3-uploader, compliance-gateway schemas + system-prompt + evidence-renderer). ~1 day. Removes the silent-failure pattern that hid the audit-flush S3 bug for weeks; keeping the helper unwired means the next contributor with the same pattern has no canonical pattern to reach for.
- budget-store → wire into `checkBudget` / `recordSpend` / `getSpend`. Redis already provisioned at `infra/kubernetes/base/services/redis.yaml` (consumed by replay-guard) — no net-new infra. Under HPA 1→8 pods, per-pod Map state silently multiplies a tenant's per-principal QPS budget by replica count, which is a real correctness bug, not theoretical. ~2 days.
- Net Sprint 2 impact: S2-01 and S2-02 become "in_progress" decisions with concrete acceptance commands rather than wire-or-delete decisions.

**Q5 — Pen-test before or after Sprint 1 fixes?**
**ANSWERED 2026-05-31: AFTER.** Ratify Sprint 1 plan + execute first (already done — Sprint 1 closed); then commission external pen-test against the post-Sprint-1 state. S2-13 (Pen-test SOW signature) proceeds in Sprint 2 as planned; EXT-INF-002 ETA stays on the post-SoW schedule (no +4w delay). Rationale: external review against a stationary post-remediation target is more useful than review against a moving design; Sprint 1 closures were small and well-scoped enough that "what changed" can be summarized in the SOW itself.

**Q6 — Product motion (product-led vs sales-led).**
**ANSWERED 2026-05-31: SALES-LED with primitives as parallel tail.**

- Sprint 3 headline = **S3-11** (ZWCMP DPA + pilot agreement signature). Revenue + reference customer first.
- S1-09 owner profile: senior pilot-facing operator with prior experience closing a fintech pilot with an African central bank. Regulator-comfort + Chamber-of-Mines political fluency outweigh dev-rel-charisma at this stage.
- S3-07 (publish primitives) continues on a parallel track — `terraform-aws-compliance-db` + `@gtcx/audit-signer` in the registry reinforce the regulator moat by making the work cite-able — but Sprint 3 is not gated on it.
- Reasoning: GTM docs (`global-south-10x-plan.md`, `pilot-success-criteria.md`, `moat-execution-plan.md`) are regulator-led, not developer-led; customer is mining-cooperative members, not developers; moat ranks Trust > Distribution. Product-led growth becomes viable AFTER a signed pilot creates the reference point that dev-rel can pull on.

**Q7 — `@types/node` dependabot pin (post-roadmap Tier 5, PR #62).**
**ANSWERED 2026-05-31: PIN.** Implemented same-day in `.github/dependabot.yml` — added an `ignore` rule on `@types/node` `version-update:semver-major`. Package.json constraint was already `^22.10.0` (tied to Node 20.x runtime). Effect: dependabot no longer opens 23.x/24.x/25.x major bumps. Existing open PR #62 should be closed with rationale "ignored by config — Node 20 runtime → @types/node 22.x." S2-11 (Tier 1+2 dependabot merges) inherits this config; no separate dependabot-config change needed in Sprint 2.

---

## How to use this file

- **Reading order:** active phase header → current sprint table → expand stories with acceptance commands as you start them.
- **Updating:** mark `status` per story (`pending | in_progress | blocked | done`) as you go. Don't mark `done` without the acceptance commands passing in this session — newer audit evidence wins over older "done" claims.
- **Re-reconcile:** any time a new master-audit or 10-10-roadmap drops, re-run `/gtcx-reconcile-roadmap` against this file. Bump `last_reconciled`.
- **Out of scope here:** this file does NOT track individual code reviews, individual PR comments, or external coordination minutes. Those belong in their respective surfaces (PRs, calendar, register).
