---
title: 'Cross-Team Response — gtcx-mobile W1 Critical Path'
status: 'current'
date: '2026-05-25'
owner: 'platform-engineering'
role: 'platform-engineering'
tier: 'critical'
tags: ['cross-team', 'mobile', 'mob-w1', 'coordination', 'gtcx-protocols']
review_cycle: 'on-change'
---

# Cross-Team Response — gtcx-mobile W1 Critical Path

**From:** gtcx-infrastructure Platform Engineering  
**To:** gtcx-mobile Engineering Lead, gtcx-protocols Team  
**Date:** 2026-05-25  
**Re:** W1 critical path — 6 tickets, 3 unblock chains

---

## 1. Capacity Confirmation

All four MOB-W1 tickets are **confirmed in scope for W1** (2026-05-26 → 2026-05-30). Total capacity: 8 story points. Sprint owner: Platform Engineering Lead.

| Ticket                      | Priority | Points | Status                        | In Scope?       |
| --------------------------- | -------- | ------ | ----------------------------- | --------------- |
| #49 staging URL + TLS       | P0       | 2      | Ingress fix on main           | ✅ Confirmed W1 |
| #50 /audit/bundles verifier | P0       | 3      | PR #56 rebased, 17 gates PASS | ✅ Confirmed W1 |
| #51 nonce store + replay    | P0       | 1      | Complete in PR #56            | ✅ Confirmed W1 |
| #52 /audit/query            | P0       | 2      | PR #58 rebased, 17 gates PASS | ✅ Confirmed W1 |

No counter-proposal. No scope reduction.

---

## 2. ETAs and Unblock Chain

### #49 — staging URL + TLS

- **ETA deploy:** Tuesday 2026-05-27 (W1 day 2)
- **Day-of-week constraint:** None. Staging deploys are routine. Monday (day 1) is reserved for Sprint 7 kickoff + EXT-003 dependency resolution.
- **Pre-check:** AWS credentials current ✅; Route53 zone `gtcx.trade` delegated ✅. **New blocker identified 2026-05-25:** ACM certificate ARN in `ingress.yaml` references account `293488310036` but active AWS account is `348389439381`. No `*.gtcx.trade` certificate exists in current account. Resolution needed before deploy: either (a) create ACM wildcard cert in `348389439381` for `*.staging.gtcx.trade`, or (b) update ingress to reference correct ARN if cert exists in `293488310036` with cross-account access.
- **Deliverable:** `https://geotag.staging.gtcx.trade/health` returning `{ status: 'ok', version: '<short-sha>' }` + SPKI fingerprint posted on #49.

### EXT-003 — audit-flush container (Sprint 7)

- **ETA image push:** Wednesday 2026-05-28 (W1 day 3)
- **Status:** ✅ **COMPLETE as of 2026-05-25.** Dockerfile verified, `@gtcx/audit-signer@^0.1.0` installed. Image `gtcx-audit-flush:v0.1.0` pushed to ECR `348389439381.dkr.ecr.af-south-1.amazonaws.com/gtcx-audit-flush` (staging tag `v0.1.0-staging` also available). Terraform staging applied: IRSA role `arn:aws:iam::348389439381:role/gtcx-staging-audit-flush-irsa` + S3 WORM write policy created. EKS→DB security group rule created. Optional NATS integration test (`INT-A-1`, 3 pts) can run in parallel and is not a blocker.
- **Risk:** Resolved.

### #50 — /audit/bundles verifier

- **ETA deploy (staging):** Thursday 2026-05-29 (W1 day 4)
- **Dependency resolution:**
  - #49 ✅ (staging URL live by Tuesday)
  - EXT-003 ✅ (image in ECR by Wednesday)
  - gtcx-protocols#60: Production wiring (real TradePass DID resolver URL) lands as a **follow-up commit** once #60 closes. The mock DID resolver is already landed in PR #56; verifier ships with mock resolution and switches to real URL via config change (no redeploy).
- **PR:** [#56](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/56) — 8 commits, **rebased on main** (0701584), all 17 validation gates PASS. Ready for final review and merge once #49 is live.

### #51 — nonce store + replay rejection

- **ETA deploy:** Thursday 2026-05-29 (same PR #56 as #50)
- **Status:** Implementation complete. Ships bundled with #50.

### #52 — /audit/query

- **ETA deploy:** Friday 2026-05-30 (W1 day 5, morning)
- **PR:** [#58](https://github.com/gtcx-ecosystem/gtcx-infrastructure/pull/58) — 7 commits, **rebased on main** (0701584), all 17 validation gates PASS. Ready for review.
- **Note:** Deploy scheduled for **Friday morning** (not afternoon) to give mobile team the afternoon for integration testing before the weekend.

---

## 3. Daily Standup Commitment

Platform Engineering Lead will join `#gtcx-mobile-prod` standup daily at 09:00 GMT Mon–Fri starting 2026-05-26.

**Standup format (infrastructure side):**

1. #49 status (Mon–Tue)
2. EXT-003 image build status (Mon–Wed)
3. PR #56 / #58 review + merge status (Wed–Fri)
4. gtcx-protocols#60 unblock signal (when available)
5. Any blockers flagged immediately (AWS, ECR, Route53)

---

## 4. Open Items from Mobile Team (Our Responses)

| Ask                                      | Response                                                  |
| ---------------------------------------- | --------------------------------------------------------- |
| ETA on #49 deploy                        | **Tuesday 2026-05-27**                                    |
| Capacity comment per issue               | **All 4 tickets confirmed in scope for W1**               |
| Revised #50 ship date when EXT-003 lands | **Thursday 2026-05-29** (EXT-003 Wednesday, #50 Thursday) |

---

## 5. Cross-Repo Chain Status

```
#49 (staging URL + TLS)          → ETA Tue 2026-05-27
    ↓
gtcx-protocols#60 (DID service)   → Mobile team dependency; no infrastructure block
    ↓
#50 (verifier)                   → ETA Thu 2026-05-29 (mock resolver → real on #60 close)
    ↓
#51 (nonce gate)                 → ETA Thu 2026-05-29 (bundled with #50)
    ↓
#52 (/audit/query)               → ETA Fri 2026-05-30 (morning)
    ↓
gtcx-mobile production rollout   → W4 Zimbabwe go-live
```

---

## 6. Risk Update

| Risk                                                  | Severity | Likelihood | Status                                                                             |
| ----------------------------------------------------- | -------- | ---------- | ---------------------------------------------------------------------------------- |
| gtcx-protocols#60 slips → #50 real-DID wiring blocked | High     | Medium     | **Mitigated** — mock resolver landed; real URL is a config change, not a redeploy. |
| EXT-003 audit-flush image slips → #50 blocked         | High     | Low        | **Resolved** — Image `v0.1.0` in ECR as of 2026-05-25.                             |
| AWS creds / zone delegation missing → #49 blocked     | Medium   | Low        | **Pre-checked** — both verified current.                                           |

---

_Response drafted by Platform Engineering. Approved for send._
