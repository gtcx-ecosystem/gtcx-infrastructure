---
title: 'Penetration-Test Vendor — Outreach Template'
status: 'ready'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['audit', 'pen-test', 'vendor', 'outreach']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Penetration-Test Vendor — Outreach Template

> Copy this template into your email client, customize the bracketed fields, and send.

---

**Subject:** GTCX Infrastructure — Penetration-Test Engagement Kickoff Request

**To:** [vendor-name]@[firm].com

**CC:** [legal-contact], [security-lead]

---

Hi [Vendor Name],

GTCX Infrastructure is ready to kick off its third-party penetration-test engagement. Our internal readiness sprint is complete, all repo-controlled gates are green, and we have a dedicated pen-test overlay with isolated namespace, JetStream subjects, and WORM bucket. We have prepared a single readiness pack with scope, rules of engagement, target inventory, and credential issuance runbook.

**About GTCX Infrastructure**

- **Repo:** `gtcx-ecosystem/gtcx-infrastructure`
- **Target environment:** Staging (`gtcx-staging` namespace) + dedicated pen-test overlay (`gtcx-pen-test` namespace)
- **Target URLs:** `https://api.staging.gtcx.trade`, `https://geotag.staging.gtcx.trade`
- **Current audit score:** 9.0 / 10 internal readiness

**Scope**

| In Scope                         | Out of Scope                                          |
| -------------------------------- | ----------------------------------------------------- |
| OWASP API Top 10                 | Staff social engineering                              |
| Auth bypass and tenant isolation | Production account compromise attempts                |
| Audit-chain tampering            | Destructive AWS account actions                       |
| Resource exhaustion              | Third-party LLM provider attacks outside agreed rules |
| Mesh/network policy review       | Production data or PII                                |
| Container hardening              |                                                       |
| Prompt/tool segregation          |                                                       |

**Readiness Pack**

`https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/docs/audit/vendor-engagement-readiness-pack.md`

The pack includes:

1. Rules of engagement (stop conditions, allowed/prohibited tests, WORM pollution policy)
2. Target inventory (services, namespaces, ports, endpoints, auth models)
3. Scoped credential issuance runbook (7-day bearer tokens with `query:read`, `tools:read`, `providers:read` only)
4. External finding register and closure checklist templates
5. Retest requirements and evidence storage procedures

**Credentials**

We will issue scoped bearer tokens via encrypted channel (Signal, 1Password, or AWS Secrets Manager). No admin or `audit:write` permissions will be granted for the initial test. Tokens expire in 7 days and are renewable on request.

**What We Need From You**

1. Signed Statement of Work with scope, target list, and rules of engagement
2. Proposed test schedule and team roster
3. Draft report delivery timeline
4. Retest procedure and pricing

**Next Step**

Can we schedule a 30-minute kickoff call this week to confirm scope, credentials, and schedule?

Our security lead ([security-lead-email]) will coordinate.

Best,

[Your name]
[Your title]
[Your phone]
[Your email]

---

**Attachments (if sending via email rather than repo link):**

- `vendor-engagement-readiness-pack.md`
- `pen-test-scope-2026.md`
- `external-finding-register-template.md`
