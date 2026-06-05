---
title: 'Witness — Hub #17 prod W2 sealed + ingress live'
status: complete
date: 2026-06-08
owner: gtcx-infrastructure
hub_blocker: 17
er1: ER-1-10
authority_class: A
---

# Witness — Hub #17 prod W2 sealed + ingress live

## Summary

Prod W2 secrets, ESO, web-app, ALB ingress, ACM `*.gtcx.trade`, and Cloudflare CNAME are **live**. Public intake **201**; exploration retest **PASS**.

## Evidence

| Check                                         | Result                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| SM `gtcx/compliance-os/production/w2`         | 7 keys                                                                     |
| ESO `compliance-os-w2-secrets`                | Ready                                                                      |
| `web-app` pods                                | 2/2 Running                                                                |
| ALB                                           | `k8s-gtcxproductionapi-527ebd7716-1025454332.af-south-1.elb.amazonaws.com` |
| ACM                                           | `eefdabd1` — `gtcx.trade` + `*.gtcx.trade` **ISSUED**                      |
| Cloudflare CNAME                              | `compliance.gtcx.trade` → ALB (DNS only)                                   |
| `curl https://compliance.gtcx.trade/`         | **307**                                                                    |
| Intake POST                                   | **201**                                                                    |
| exploration `w2:prod:retest`                  | **PASS** — `w2-hub-17-retest-latest.json` `ok: true`, status **201**       |
| SM `gtcx/terminal-os/production/api-keys`     | Key aligned with W2 `COMPLIANCE_OS_TERMINAL_API_KEY`                       |
| `terminal-os` prod stack                      | ESO + deployment + ingress `terminal.gtcx.trade` on shared ALB             |
| Cloudflare CNAME                              | `terminal.gtcx.trade` → ALB (DNS only)                                     |
| `curl https://terminal.gtcx.trade/api/health` | **200**                                                                    |
| compliance-os `w2:terminal-patch-proof`       | **PASS** — PATCH **200**, `exportSyncStatus: synced`                       |

## Hub #17 bundle

| #   | Owner               | Status                                                                      |
| --- | ------------------- | --------------------------------------------------------------------------- |
| 1   | exploration-os      | ☑ `w2:prod:retest` **201** @ `compliance.gtcx.trade`                        |
| 2   | gtcx-infrastructure | ☑ prod W2 secrets + `compliance.gtcx.trade` + `terminal.gtcx.trade` ingress |
| 3   | compliance-os       | ☑ `w2-hub-17-cos-patch-latest.json` `ok: true`                              |
| 4   | terminal-os         | ☑ PATCH receiver **200** @ `terminal.gtcx.trade`                            |

**Note:** Terminal prod uses file-backed task store (`LICENCE_INTELLIGENCE_FORCE_FILE=1`) until hub **#18** seals production audit `DATABASE_URL`.

Hub **#17** **closed** — baseline-os locker finalized `2026-06-05` (`from-compliance-os-w2-locker-17-2026-06-04.md`).
