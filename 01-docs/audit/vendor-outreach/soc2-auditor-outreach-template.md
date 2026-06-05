---
title: 'SOC 2 Type I Auditor — Outreach Template'
status: 'ready'
date: '2026-05-27'
owner: 'security-lead'
role: 'security-lead'
tier: 'critical'
tags: ['audit', 'soc2', 'vendor', 'outreach']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# SOC 2 Type I Auditor — Outreach Template

> Copy this template into your email client, customize the bracketed fields, and send.

---

**Subject:** GTCX Infrastructure — SOC 2 Type I Engagement Kickoff Request

**To:** [auditor-name]@[firm].com

**CC:** [legal-contact], [compliance-lead]

---

Hi [Auditor Name],

GTCX Infrastructure is ready to kick off its SOC 2 Type I engagement. Our internal readiness sprint is complete and all repo-controlled gates are green. We have prepared a single readiness pack that contains everything needed for day-one execution.

**About GTCX Infrastructure**

- **Repo:** `gtcx-ecosystem/gtcx-infrastructure`
- **Primary region:** `af-south-1` (Cape Town, South Africa)
- **Current audit score:** 9.0 / 10 internal readiness
- **Trust primitives:** WORM Object Lock in production + staging, published `@gtcx/audit-signer` npm package, SIGNAL validation 9.60/10, Kyverno policy validation, coverage gates for gateway and replay surfaces

**Readiness Pack**

The pack is published in our repo and will remain accessible throughout the engagement:

`https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/01-docs/05-audit/vendor-engagement-readiness-pack.md`

It includes:

1. Control owner matrix (primary + backup owners for every domain)
2. Per-control evidence inventory mapped to AICPA TSC 2017 CC1.x–CC9.x
3. WORM audit substrate evidence (production + staging buckets, Object Lock COMPLIANCE mode, signed NDJSON verification)
4. Proposed 8-week engagement timeline
5. Pre-send checklist (already completed)

**Scope Request**

We are seeking a **SOC 2 Type I** report covering the **Security** Trust Service Criterion for the period beginning **[start date]** through **[end date]**. We are open to expanding to Availability and Confidentiality in a follow-on engagement.

**Access We Will Provide**

- Read-only AWS IAM role to staging (not production)
- Kubernetes read-only access to staging for manifest review
- Sample signed audit records from the WORM bucket
- Control owner interview scheduling

**What We Need From You**

1. Signed engagement letter with scope, period, and trust criteria
2. Auditor's sampling methodology and day-one evidence request list
3. Draft gap letter review meeting scheduled
4. Final report delivery date commitment

**Next Step**

Can we schedule a 30-minute kickoff call this week to confirm scope, timeline, and evidence access?

Our compliance lead ([compliance-lead-email]) will coordinate scheduling.

Best,

[Your name]
[Your title]
[Your phone]
[Your email]

---

**Attachments (if sending via email rather than repo link):**

- `vendor-engagement-readiness-pack.md`
- `soc2-evidence-inventory-2026-05.md`
- `worm-runtime-evidence-2026-05-27.md`
