---
session_id: "init-2026-05-27-gtcx-infrastructure"
agent: "baseline-init"
start_time: "2026-05-27T19:40:40.335Z"
end_time: "2026-05-27T19:40:40.335Z"
focus: "Baseline initialization — discovery and enrichment"
---

# Session: Baseline Initialization

## 2026-05-31 — Roadmap Execution: S2-07 KYC Handler Hardening

## What Was Done
- Executed roadmap item S2-07: hardened `tools/kyc-screening` salt handling, idempotency, and S3 key validation.
- Removed the predictable default local-screening salt outside tests; `SCREENING_LOCAL_SALT` must now be set to at least 16 characters unless `NODE_ENV=test`.
- Added a `headObject` idempotency check so an existing sibling `.screening.json` result skips re-screening and avoids overwriting the prior result.
- Added decoded S3 object-key validation that rejects missing, overlong, or control-character-containing keys before screening or writing output.
- Added regression coverage for fail-closed salt behavior, existing-result skips, not-found continuation, and `%0A`/control-character key rejection.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-07 done and reduce remaining P2/P3 gaps.

## Verification
- `pnpm --dir tools/kyc-screening test` — pass; 14 tests.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 24/24 gates green.

## Notes
- Next local roadmap candidates: S2-09 (Alertmanager defaults fail-closed) or S2-10 (frontmatter tier downgrade guard).
- S2-13 remains a human-signature item unless the user provides SOW/sign-off direction.

## 2026-05-31 — Roadmap Execution: S2-06 Evidence HTML Hardening

## What Was Done
- Executed roadmap item S2-06: hardened the regulator-readable HTML evidence renderer against missing CSP and Unicode bidi controls.
- Added `EVIDENCE_HTML_CSP` with restrictive defaults (`default-src 'none'`, `script-src 'none'`, no remote images/fonts/connect/object/form/base/frame ancestors) while still allowing inline CSS for the self-contained report.
- Added the CSP both as an HTTP response header for `/v1/audit/evidence-bundle?format=html` and as an HTML meta tag for archived standalone files.
- Stripped Unicode bidi control characters from visible evidence fields before HTML escaping so actor, target, tenant, and metadata text cannot visually reorder the report.
- Preserved raw NDJSON exactly in the details block so offline signature verification still works.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-06 done and reduce remaining P2 gaps.

## Verification
- `node --test tools/compliance-gateway/tests/evidence-renderer.unit.test.mjs` — pass; 9 tests.
- `node --test tools/compliance-gateway/tests/server.new-routes.integration.test.mjs` — pass outside sandbox; 17 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass outside sandbox; 174 tests; branch coverage 91.87%.
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 24/24 gates green.

## Notes
- Next local roadmap candidates: S2-07 (KYC handler hardening), S2-09 (Alertmanager defaults fail-closed), or S2-10 (frontmatter tier downgrade guard).
- S2-13 remains a human-signature item unless the user provides SOW/sign-off direction.

## 2026-05-31 — Roadmap Execution: S2-08 Node 20.18.0 Enforcement

## What Was Done
- Executed roadmap item S2-08: pinned the Node runtime floor across workspace package manifests and GitHub Actions.
- Updated the nine stale package manifests from `>=20.0.0` to `>=20.18.0` and added the same engine floor to workspace packages that were missing `engines.node`.
- Updated seven workflow `actions/setup-node` calls and the shared composite action defaults to exact `20.18.0`.
- Updated setup/version docs that still advertised `>=20.0.0`.
- Added `tools/scripts/node-version-floor-check.mjs` and wired it into `node tools/scripts/validate-all.mjs` so future drift fails CI.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-08 done and reduce remaining P2 gaps.

## Verification
- `node tools/scripts/node-version-floor-check.mjs` — pass; 16 package manifests and GitHub Actions satisfy `>=20.18.0` / `20.18.0`.
- `node tools/scripts/pin-actions-sha.mjs --check` — pass.
- `node tools/scripts/docs-standard-validator.mjs` — pass.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 24/24 gates green.

## Notes
- Next roadmap candidate: S2-13 (pen-test SOW signature) unless human-signature gating makes S2-06/S2-07/S2-09 better local candidates.
- Full validation should run outside the sandbox because HTTP listener tests can fail with `listen EPERM` inside the sandbox.

## 2026-05-31 — Roadmap Execution: S2-05 Route Metrics

## What Was Done
- Executed roadmap item S2-05: added Prometheus metrics for `/v1/exceptions` and `/v1/audit/evidence-bundle`.
- Added route/status/tenant observations to the existing `compliance_gateway_requests_total` series for both endpoints, including auth-gate failures.
- Added `compliance_gateway_exceptions_served_total` for exception rows returned by tenant and truncation state.
- Added `compliance_gateway_evidence_bundle_records_total` for evidence records returned by tenant and output format (`json` or `html`).
- Added integration coverage proving both endpoints emit their request metrics and endpoint-specific counters.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-05 done and reduce remaining P2 gaps.

## Verification
- `node --test tools/compliance-gateway/tests/server.new-routes.integration.test.mjs` — pass outside sandbox; 16 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass outside sandbox; 174 tests; branch coverage 91.87%.
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Next roadmap candidate: S2-08 (pin Node 20.18.0 across packages and CI workflows).
- HTTP route tests should run outside the sandbox because local listener binding fails with `listen EPERM`.

## 2026-05-31 — Roadmap Execution: S2-04 Trusted-XFF CIDR Enforcement

## What Was Done
- Executed roadmap item S2-04: `sourceIpFromRequest()` now trusts `X-Forwarded-For` only when the socket peer is inside configured trusted proxy CIDRs.
- Added `GTCX_TRUSTED_PROXY_CIDRS`; with no configured CIDRs, XFF is ignored and the socket IP remains authoritative.
- Added IPv4 and IPv6 CIDR matching plus IPv4-mapped socket address normalization for proxy peers.
- Added regression coverage for trusted proxy XFF extraction, spoofed XFF from untrusted peers, malformed XFF fallback, IPv4 CIDR matching, IPv6 CIDR matching, and invalid CIDR handling.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-04 done and reduce remaining P1 gaps.

## Verification
- `node --test tools/compliance-gateway/tests/auth-failure-throttle.unit.test.mjs` — pass; 18 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass; 174 tests; branch coverage 91.87%.
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Next roadmap candidate: S2-05 (Prometheus metrics for `/v1/exceptions` and `/v1/audit/evidence-bundle`).
- Full validation should run outside the sandbox because HTTP listener tests can fail with `listen EPERM` inside the sandbox.

## 2026-05-31 — Roadmap Execution: S2-03 Auth Failure Throttle

## What Was Done
- Executed roadmap item S2-03: bounded `auth-failure-throttle` state and added an atomic record/check helper.
- Added `GTCX_AUTH_FAILURE_MAX_IPS` support with LRU-style eviction so distributed brute-force source IPs cannot grow the in-process `ipState` map without bound.
- Added `recordAndCheckAuthFailure()` so the auth-failure path records a failure and decides whether an audit event may be signed from the same state update.
- Updated `server.mjs` to use the atomic helper and suppress audit signing on the threshold-crossing failure as well as already-throttled failures.
- Added regression tests for threshold-crossing no-sign behavior, LRU cap eviction, and current-IP protection when the cap is tiny.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-03 done and reduce remaining P1/P2 gaps.

## Verification
- `node --test tools/compliance-gateway/tests/auth-failure-throttle.unit.test.mjs` — pass; 12 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass; 174 tests; branch coverage 91.87%.
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Next roadmap candidate: S2-04 (Trusted-XFF CIDR enforcement).
- Full validation was run outside the sandbox because HTTP listener tests can fail with `listen EPERM` inside the sandbox.

## 2026-05-31 — Roadmap Execution: S2-02 Budget Store Wiring

## What Was Done
- Executed roadmap item S2-02: wired `budget-store.mjs` into the hot-path budget API instead of leaving it as an unused primitive.
- Migrated `checkBudget`, `recordSpend`, `getSpend`, and `resetBudget` to async functions backed by `getBudgetStore()`.
- Updated `/v1/query`, `/v1/brief`, `/v1/budget`, `/audit/bundles`, and `/audit/query` to await store-backed budget gates.
- Preserved memory as the default backend while enabling shared Redis enforcement through `GTCX_BUDGET_STORE_BACKEND=redis` and `GTCX_BUDGET_REDIS_URL`.
- Added regression coverage proving the public budget API delegates QPS, spend writes, and spend reads to the active BudgetStore.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-02 done and reduce remaining P1 gaps.

## Verification
- `node --test tools/compliance-gateway/tests/budget.unit.test.mjs tools/compliance-gateway/tests/budget-store.unit.test.mjs tools/compliance-gateway/tests/tenant-isolation.unit.test.mjs` — pass; 25 tests.
- `node --test tools/compliance-gateway/tests/audit-bundles/handler.test.mjs tools/compliance-gateway/tests/audit-query/handler.test.mjs` — pass; 53 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass; 174 tests; branch coverage 91.87%.
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Next roadmap candidate: S2-03 (`auth-failure-throttle` bounded map + atomic `recordAndCheck`).
- HTTP server integration tests should be run outside the sandbox because local listener binding can fail with `listen EPERM`.

## 2026-05-31 — Roadmap Execution: S2-01 failClosed Wiring

## What Was Done
- Executed roadmap item S2-01: wired failClosed behavior into production callers instead of leaving the helper as an unused primitive.
- Added package-local failClosed helpers for audit-flush and compliance-gateway so Docker runtime images remain valid when they copy only package `src/` trees.
- Wrapped audit-flush S3 SDK loading with explicit failClosed logging and preserved the existing production throw vs test stub behavior.
- Wrapped compliance-gateway jurisdiction soft imports in explicit failClosed calls and replaced the evidence-renderer malformed-line empty catch with an explicit parse fallback.
- Removed stale empty-catch allowlist entries and made the audit-flush NATS reconnect test wait for actual retry/open state instead of a fixed sleep.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-01 done and reduce remaining P1 gaps.

## Verification
- `node tools/scripts/empty-catch-check.mjs` — pass; 13 allowed empty catches, 0 unallowed.
- `pnpm --dir tools/audit-flush run test:coverage:gate` — pass; 17 tests.
- `pnpm --dir tools/compliance-gateway run test:coverage:gate` — pass; 174 tests; branch coverage 91.87%.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Next roadmap candidate: S2-02 (`budget-store.mjs` wiring), already approved by Q4 as WIRE.
- Sandbox validation can fail integration tests that bind local HTTP listeners with `listen EPERM`; rerun `node tools/scripts/validate-all.mjs` outside the sandbox for canonical evidence.

## 2026-05-31 — Roadmap Execution: S2-14 Coverage Pump

## What Was Done
- Executed roadmap item S2-14: replay-protection package coverage pump.
- Added focused branch coverage for duplicate lowercased header sorting, duplicate query sorting, defensive metric label initialization, and missing request-body handling.
- Hardened `tools/replay-protection/src/server.mjs` so `/v1/replay/verify` returns `400` when the request body field is not a serialized string instead of reaching verifier hashing with invalid input.
- Replaced the replay server's best-effort OTLP empty catch with explicit warning logging and removed the now-stale empty-catch allowlist entry.
- Updated `docs/audit/execution-roadmap.md` and `docs/audit/latest.json` to mark S2-14 done and reflect all validation gates passing.

## Verification
- `pnpm --filter @gtcx/replay-protection test:coverage:gate` — pass; branch coverage 90.45%.
- `node tools/scripts/validate-all.mjs` — pass outside sandbox; 23/23 gates green.

## Notes
- Sandbox validation can fail integration tests that bind local HTTP listeners with `listen EPERM`; rerun `node tools/scripts/validate-all.mjs` outside the sandbox for canonical evidence.
- Next roadmap candidates: S2-01 (`failClosed.mjs` production callers) and S2-02 (`budget-store.mjs` wiring), both already have Q4 decision answered as WIRE BOTH.

## What Was Done
- Synchronized `.baseline/` structure with canonical schema
- Synced `definition.json` from baseline-os
- Discovered 1 architectural patterns from codebase
- Discovered 10 active TODOs/FIXMEs in code
- Scanned package.json for ecosystem dependencies
- Initialized memory files with repo-specific content (not generic templates)

## Files Modified
- .baseline/definition.json (synced)
- .baseline/memory/README.md (updated)
- .baseline/memory/session.md (created)
- .baseline/memory/patterns.md (enriched with discovered patterns)
- .baseline/memory/pitfalls.md (enriched with discovered issues)
- .baseline/memory/dependencies.md (enriched with discovered deps)

## Key Findings
- Tech stack: See patterns.md
- Active issues: See pitfalls.md
- Dependencies: See dependencies.md

## Next Steps
- Review discovered patterns for accuracy
- Resolve TODOs/FIXMEs flagged in pitfalls.md
- Verify ecosystem dependencies in dependencies.md
- Re-run `baseline-init` after significant repo changes
