---
title: 'Audit — Agent Start'
status: current
date: 2026-06-02
owner: gtcx-agentic
role: protocol-architect
tier: standard
tags: ['audit', 'agents', 'exploration-os']
review_cycle: on-change
---

# Audit — Agent Start

> **Canonical home** for ecosystem audit prompts and execution pointers.  
> **Engine:** `gtcx-agentic/03-platform/tools/audit-framework/` (rubric, prompts, hygiene).  
> **Reports:** written to `<target-repo>/01-docs/05-audit/` (per-repo SoR).

---

## Quick start

1. Read [`../03-platform/tools/audit-framework/README.md`](../03-platform/tools/audit-framework/README.md) and [`UNIVERSAL_RUBRIC.md`](../03-platform/tools/audit-framework/UNIVERSAL_RUBRIC.md).
2. Run deterministic hygiene on the target repo: `gtcx-hygiene check` ([`../03-platform/tools/hygiene/README.md`](../03-platform/tools/hygiene/README.md)).
3. Execute the audit protocol (§13 of the rubric).
4. Write `01-docs/05-audit/<audit-type>-YYYY-MM-DD.md` in the **target repo**.

Command registry (migration in flight): `gtcx-docs/tools/audit/audit-framework/commands.json`.

---

## exploration-os — public SIR verifier (moat)

From [`exploration-os/01-docs/05-audit/full-audit-2026-05-30.md`](../../exploration-os/01-docs/05-audit/full-audit-2026-05-30.md) **§5.4**: standalone verifier is the competitive moat (feature **F-33**, handoff **H-F**). Code ships in exploration-os; **no new product build** required for audit-hub work — use this section as **deploy + smoke** guidance.

| Resource                 | Path                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| Verifier source + deploy | [`exploration-os/public/sir-verifier/README.md`](../../exploration-os/public/sir-verifier/README.md) |
| Verifier UI              | `exploration-os/public/sir-verifier/index.html`                                                      |
| Library                  | `exploration-os/mobile-v2/lib/sir-verifier/`                                                         |
| Default public URL       | `https://verify.explorationos.gtcx.trade/sir` (`EXPO_PUBLIC_SIR_VERIFIER_URL`)                       |

### Post-deploy verifier smoke (runbook)

**When:** After infra serves the static verifier over HTTPS (GitHub Pages, Cloudflare Pages, or GTCX bucket). Optional pepper must match mobile `EXPO_PUBLIC_REPORT_SIGNING_PEPPER` for full HMAC checks.

1. Open the deployed verifier URL (see README above).
2. Export a **signed** `.sir.json` from ExplorationOS (mobile: signed SIR package export).
3. Upload the file on the verifier page.
4. **Expect valid:** intact package → chain/signature status **valid** (or equivalent success UI).
5. **Expect invalid:** tamper test — edit one byte in the JSON, re-upload → **tamper detected** / invalid signature (must not show valid).
6. Record result in infra or exploration-os `01-docs/05-audit/` (one line + URL + date); no secrets in git.

**Staging interim URL (Pages, 200):** `https://4d98ac1c.exploration-os-verifier.pages.dev/sir` — use until `verify.explorationos.gtcx.trade` CNAME is live (XR-507).

**Acceptance for audit agents:** Any audit command doc that covers exploration-os deployment MUST link to [`exploration-os/public/sir-verifier/README.md`](../../exploration-os/public/sir-verifier/README.md).

### Re-audit exploration-os — close F-33 / H-F

When re-running `full-audit` (or product audit) on **exploration-os**:

| ID       | Close when                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| **F-33** | Public verifier deployed; post-deploy smoke (above) passes valid + tamper cases                                     |
| **H-F**  | Same — register already marks S6-04/S6-05 **done**; audit narrative should match prod URL, not "no public verifier" |

**Do not** re-open F-33/H-F in new audit findings if:

- `exploration-os/01-docs/strategy/product-feature-register.md` shows H-F **closed**, and
- Prod URL smoke is documented (infra deploy confirmation).

Stale references to update: [`exploration-os/01-docs/05-audit/end-to-end-workflow-assessment-2026-06-01.md`](../../exploration-os/01-docs/05-audit/end-to-end-workflow-assessment-2026-06-01.md) (H-F still listed open).

---

## Related

| Doc                                                                                                                                                | Purpose                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| [`README.md`](./README.md)                                                                                                                         | Index + hygiene           |
| [`../01-docs/05-audit/engineering/duplication-verification-2026-05-31.md`](../01-docs/05-audit/engineering/duplication-verification-2026-05-31.md) | Canonical vs mirror paths |
| [`../01-docs/04-ops/coordination/cross-repo-coordination.md`](../01-docs/04-ops/coordination/cross-repo-coordination.md)                           | Protocol 24 handoffs      |

---

_No new exploration-os build from this hub — deploy checklist and audit scoring only._
