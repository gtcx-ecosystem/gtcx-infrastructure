---
title: 'Vendor Engagement Readiness Pack — SOC 2 + Pen-Test'
status: 'current'
date: '2026-05-27'
owner: 'security-lead'
role: 'chief-auditor'
tier: 'strategic'
tags: ['audit', 'soc2', 'pen-test', 'vendor', 'readiness']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Vendor Engagement Readiness Pack — SOC 2 + Pen-Test

> **Purpose:** A single handoff document for auditors and penetration-test vendors. Everything needed for day-one kickoff without further repo exploration.
> **Status:** Ready for vendor distribution.

---

## Quick Reference

| Item                   | Value                                                                         |
| ---------------------- | ----------------------------------------------------------------------------- |
| Repo                   | `gtcx-ecosystem/gtcx-infrastructure`                                          |
| Primary region         | `af-south-1` (Cape Town, South Africa)                                        |
| Terraform environments | `production`, `staging`, `testnet-pilot`, `zimbabwe-pilot`                    |
| WORM buckets           | `gtcx-worm-audit-production-af-south-1`, `gtcx-worm-audit-staging-af-south-1` |
| Testnet-pilot WORM     | Terraform ready; pending apply (see runbook below)                            |
| Compliance gateway     | `03-platform/tools/compliance-gateway/` — Node.js, port 8500                  |
| Protocol server        | `04-ship/kubernetes/base/services/protocols.yaml` — Node.js, port 8300        |
| Audit signer package   | `@gtcx/audit-signer@0.1.0` on npm                                             |
| Current audit score    | 9.0 / 10 (repo-controlled gates green)                                        |

---

## For the SOC 2 Auditor

### Evidence Inventory

Per-control mapping lives at:

- [`01-docs/10-compliance/soc2-evidence-inventory-2026-05.md`](../compliance/soc2-evidence-inventory-2026-05.md)

**Grade key:**

- 🟢 Strong — code-enforced + tested + runtime-verifiable
- 🟡 Partial — documented but enforcement gap
- 🔴 Gap — control claimed but no current evidence

### Controls Ready for Walkthrough

| Control                            | Evidence Location                                                                                                                  | Grade |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----- |
| CC1.1 Integrity and ethical values | `CONTRIBUTING.md`, `SECURITY.md`                                                                                                   | 🟢    |
| CC1.2 Board oversight              | `01-docs/10-compliance/board-security-committee-charter.md`                                                                        | 🟢    |
| CC1.3 Org structure + reporting    | `01-docs/09-security/security-framework.md`                                                                                        | 🟢    |
| CC1.4 Commitment to competence     | `01-docs/01-agents/onboarding/`, 24 runbooks                                                                                       | 🟢    |
| CC1.5 Accountability               | `01-docs/09-security/security-framework.md`, `04-ship/security/policies/access-control.md`                                         | 🟢    |
| CC2.1 Internal information needs   | `01-docs/README.md`, `03-platform/tools/03-platform/scripts/docs-link-checker.mjs`                                                 | 🟢    |
| CC2.2 Internal communication       | `01-docs/04-ops/runbooks/` — 25 runbooks                                                                                           | 🟢    |
| CC4.1 Monitoring activities        | Grafana dashboards, `03-platform/tools/compliance-gateway/03-platform/src/metrics.mjs`                                             | 🟢    |
| CC4.2 Deficiency communication     | `.github/workflows/dast-zap.yml`, `dr-test-quarterly.yml`                                                                          | 🟢    |
| CC6.1 Logical access security      | `03-platform/tools/compliance-gateway/03-platform/src/auth.mjs`, `03-platform/tools/compliance-gateway/03-platform/src/budget.mjs` | 🟢    |
| CC7.2 System operations            | `04-ship/terraform/`, `04-ship/kubernetes/`                                                                                        | 🟢    |
| CC7.3 Change management            | `.github/workflows/ci.yml`, ADRs                                                                                                   | 🟢    |
| CC8.1 Risk assessment              | `01-docs/05-audit/master-audit-*.md`                                                                                               | 🟢    |

### WORM Audit Substrate (CC7.2 / A1.2)

- **Production bucket:** `gtcx-worm-audit-production-af-south-1`
  - Object Lock: `COMPLIANCE` mode, 2557 days
  - Encryption: `aws:kms` with rotation
  - Versioning: Enabled
  - Public access: Fully blocked
- **Staging bucket:** `gtcx-worm-audit-staging-af-south-1`
  - Same configuration as production
- **Signer package:** `@gtcx/audit-signer@0.1.0`
  - Ed25519 signatures
  - Chain-hash continuity verification
  - Published on npm for external verification

### What the Auditor Will Need From Us

1. **Read-only AWS access** to staging (not production) for configuration review.
2. **Kubernetes read-only access** to staging for manifest review.
3. **Sample audit records** from the WORM bucket (already signed and verifiable).
4. **Control owner interviews** — matrix provided below.
5. **Gap letter timeline** — target 4 weeks from kickoff.

### What We Need From the Auditor

1. Signed engagement letter with scope (Type I, trust criteria, period).
2. Auditor's sampling methodology and evidence request list.
3. Draft gap letter review meeting scheduled.
4. Final report delivery date.

---

## For the Pen-Test Vendor

### Scope

| Item               | Detail                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------- |
| Target environment | Dedicated `pen-test` namespace in staging, or isolated testnet-pilot cluster            |
| Target URLs        | `https://api.staging.gtcx.trade`, `https://geotag.staging.gtcx.trade`                   |
| Out of scope       | Production, production data, staff social engineering, third-party LLM provider attacks |
| WORM pollution     | Strictly prohibited — use isolated test subjects only                                   |

### Rules of Engagement

Full rules live at:

- [`01-docs/05-audit/external-assurance-kickoff-2026-05-27.md`](./external-assurance-kickoff-2026-05-27.md)

Summary:

- OWASP API Top 10, auth bypass, tenant isolation, audit-chain tampering, resource exhaustion, mesh/network policy review, container hardening, prompt/tool segregation.
- No destructive AWS account actions.
- Stop condition: any plausible P0 or data exposure stops active exploitation and triggers immediate triage.

### Target Inventory

| Service            | Namespace | Port | Endpoints                                                                                          | Auth Model                                              |
| ------------------ | --------- | ---- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| compliance-gateway | gtcx      | 8500 | `/health`, `/metrics`, `/v1/query`, `/v1/tools`, `/v1/providers`, `/audit/bundles`, `/audit/query` | Bearer tokens via `COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON` |
| gtcx-protocols     | gtcx      | 8300 | 63 handlers across 6 protocols                                                                     | Varies by protocol                                      |
| audit-flush        | gtcx      | —    | NATS consumer → S3 WORM                                                                            | IRSA (no inbound)                                       |
| replay-guard       | gtcx      | —    | Sidecar / Redis nonce store                                                                        | mTLS (Linkerd)                                          |

### Credentials for Testing

Pen-test vendor will be issued:

1. **Scoped bearer token** with `query:read`, `tools:read`, `providers:read` only.
2. **No admin or `audit:write` permissions** — tampering with the audit chain is out of scope for the initial test.
3. **Token expiry:** 7 days from issuance, renewable on request.

Token issuance runbook:

```bash
# Generate a random token
TOKEN=$(openssl rand -hex 32)

# Add to the staging compliance-gateway secret (requires kubectl + cluster access)
kubectl patch secret compliance-gateway-secrets -n gtcx -p \
  '{"stringData":{"COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON":"[{\"token\":\"'"$TOKEN"'\",\"subject\":\"pen-test-vendor\",\"permissions\":[\"query:read\",\"tools:read\",\"providers:read\"],\"label\":\"pen-test-scoped\",\"tenantId\":\"pen-test\"}]"}}'

# Roll the deployment to pick up the new secret
kubectl rollout restart deployment/compliance-gateway -n gtcx
```

**Security note:** The token is transmitted via encrypted channel (Signal, 1Password, or AWS Secrets Manager). It is never sent via unencrypted email or chat.

### Finding Workflow

Vendor findings use this register:

- [`01-docs/05-audit/external-finding-register-template.md`](./external-finding-register-template.md)

Closure checklist:

- [`01-docs/05-audit/external-finding-closure-checklist.md`](./external-finding-closure-checklist.md)

### Retest Requirements

1. Vendor provides retest instructions or a PoC script.
2. Internal team validates the fix.
3. Vendor re-tests and confirms closure.
4. Retest evidence is stored in the WORM bucket with the original finding ID.

---

## Control Owner Matrix

| Domain                              | Primary Owner         | Backup Owner        | Contact               | Evidence Source                                                               |
| ----------------------------------- | --------------------- | ------------------- | --------------------- | ----------------------------------------------------------------------------- |
| Identity, auth, rate limits         | Security Lead         | Platform Lead       | security@gtcx.trade   | `03-platform/tools/compliance-gateway/03-platform/src/auth.mjs`, `budget.mjs` |
| WORM audit chain                    | Compliance Platform   | Security Lead       | compliance@gtcx.trade | `03-platform/tools/audit-signer/`, `03-platform/tools/audit-flush/`           |
| Kubernetes deployability            | Infrastructure Lead   | Platform Lead       | infra@gtcx.trade      | `04-ship/kubernetes/`, `.github/workflows/ci.yml`                             |
| Terraform and AWS controls          | Infrastructure Lead   | SRE                 | infra@gtcx.trade      | `04-ship/terraform/`                                                          |
| DR and recovery                     | SRE                   | Infrastructure Lead | sre@gtcx.trade        | `01-docs/04-ops/runbooks/disaster-recovery-detailed.md`                       |
| Documentation governance            | Quality Evidence Lead | Security Lead       | docs@gtcx.trade       | `03-platform/tools/03-platform/scripts/docs-standard-validator.mjs`           |
| External comms and evidence handoff | Security Lead         | Compliance Lead     | security@gtcx.trade   | `01-docs/05-audit/`, `01-docs/10-compliance/`                                 |

---

## WORM Evidence for Vendor Review

The following signed audit records are available for vendor inspection:

| Record                       | Location                                                                                                  | Verification                                                   |
| ---------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Staging remediation evidence | `s3://gtcx-worm-audit-staging-af-south-1/remediation-evidence/2026-05-27/master-audit-remediation.ndjson` | `node -e "require('@gtcx/audit-signer').verifyAuditBody(...)"` |
| WORM runtime proof           | [`01-docs/05-audit/worm-runtime-evidence-2026-05-27.md`](./worm-runtime-evidence-2026-05-27.md)           | AWS CLI + `@gtcx/audit-signer`                                 |

---

## Engagement Timeline (Proposed)

| Week | SOC 2 Track                                          | Pen-Test Track                                    |
| ---- | ---------------------------------------------------- | ------------------------------------------------- |
| 0    | Kickoff, scope confirmation, NDA                     | Kickoff, rules of engagement, credential issuance |
| 1    | Evidence request list, read-only access provisioning | Reconnaissance, mapping, light touch tests        |
| 2    | Control walkthroughs (CC1–CC4)                       | Active testing, vulnerability identification      |
| 3    | Control walkthroughs (CC6–CC8), gap identification   | Exploitation, evidence capture                    |
| 4    | Gap letter draft review                              | Draft report delivery                             |
| 5    | Gap remediation plan                                 | Retest scheduling                                 |
| 6    | Remediation evidence collection                      | Retest execution                                  |
| 7    | Final report review                                  | Final report + retest evidence                    |
| 8    | Close engagement                                     | Close engagement                                  |

---

## Checklist — Before Sending to Vendor

- [ ] This pack is reviewed by Security Lead.
- [ ] Scope boundaries are agreed by Legal.
- [ ] Staging credentials are generated and tested.
- [ ] WORM evidence samples are verified and accessible.
- [ ] Control owners are notified of upcoming interviews.
- [ ] Incident response channel is ready for any P0 escalations during pen-test.
- [ ] Finding register and closure checklist are linked in vendor contract.
