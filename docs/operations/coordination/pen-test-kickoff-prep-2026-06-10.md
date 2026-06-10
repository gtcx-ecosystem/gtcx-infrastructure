---
title: Pen-test kickoff prep — post EXT-INF-002 approval
status: current
date: 2026-06-10
owner: gtcx-infrastructure
program: INIT-GTCX-INFRA-SECAS
storyId: SECAS-S2-01
authorityClass: A
tags: ['coordination', 'pen-test', 'secas-s2', 'ext-inf-002']
---

# Pen-test kickoff prep (SECAS-S2-01)

**Prerequisite:** EXT-INF-002 sovereign approval recorded (`audit/evidence/ext-inf-002-sow-approval-2026-06-10.json`).

**Countersign:** approved 2026-06-10 — [`ext-inf-002-countersign-approval-2026-06-10.json`](../../../audit/evidence/ext-inf-002-countersign-approval-2026-06-10.json).

**Next:** Schedule pen-test window and publish witness JSON.

## Intake pack (attach to vendor kickoff)

| Artifact        | Path                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| Scope           | `audit/pen-test-scope-2026.md`                                                                      |
| RFP             | `audit/pen-test-rfp-2026.md`                                                                        |
| Intake evidence | `audit/pen-test-intake-evidence-2026-05-31.md`                                                      |
| Vendor pack ack | `docs/operations/coordination/outbound/from-gtcx-infrastructure-ext-inf-002-pack-ack-2026-06-07.md` |
| Fleet witness   | `audit/evidence/cross-repo-health/cross-repo-health-probe-latest.json`                              |

## In-scope staging targets (post-DAAS-S1/S3)

- `api.staging.gtcx.trade` — AGX + authority stub routes
- `intelligence-staging.gtcx.trade` — cost router enabled
- `sovereign-staging.gtcx.trade` — fleet probe 200
- compliance-gateway staging (optional — 525 known)

## Post-countersign actions (gtcx-infrastructure)

1. Confirm test window with vendor
2. Publish `audit/evidence/pen-test-window-YYYY-MM-DD.json`
3. Ingest final report to `audit/evidence/pen-test-report-YYYY-MM-DD.json`
4. Close SEC-PENTEST-01 / SECAS-S2-01
