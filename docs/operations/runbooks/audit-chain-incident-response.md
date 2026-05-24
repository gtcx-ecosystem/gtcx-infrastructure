---
title: 'Runbook: Audit Chain Integrity Incident'
status: 'current'
date: '2026-05-24'
owner: 'platform-engineering'
role: 'security-engineer'
tier: 'critical'
tags: ['security', 'audit', 'incident-response']
review_cycle: 'quarterly'
---

# Runbook: Audit Chain Integrity Incident

When `verifyChain` reports `valid: false` against a production NDJSON batch, or the `audit-trust` dashboard shows a chain-integrity failure, this runbook is the response. The substrate's tamper-evidence guarantee is the load-bearing security property — a chain-integrity incident is **P0 by default**.

---

## 1. Incident Classification

| Severity | Trigger                                                                                                                                                                           | Response Time        |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **P0**   | Any `verifyChain` failure on a **production** batch; any `audit-trust` dashboard `chain_integrity` panel red; any audit-flush sidecar reporting `chain_verify_failures_total > 0` | Immediate (< 15 min) |
| **P1**   | `verifyChain` failure on **staging** batch; sink emit rate < 99.9% of expected for ≥ 5 min                                                                                        | < 1 hour             |
| **P2**   | Audit-trust dashboard `flush_lag_seconds` > 60s without a chain-integrity flag                                                                                                    | < 4 hours            |

Every chain-integrity incident, regardless of severity, requires a post-mortem within 5 business days.

---

## 2. First 15 Minutes (P0 path)

```text
1. Acknowledge the alert in PagerDuty
2. Open the audit-trust Grafana dashboard
3. Capture the affected tenant prefix(es) and time window from the dashboard
4. Post in #incidents: "P0 — audit chain integrity failure detected at <timestamp>, tenant=<id>"
5. Page CTO and on-call security lead
6. DO NOT delete, modify, or replay any WORM object — every artifact is evidence
7. Suspend new admissions for the affected tenant via the gateway feature flag (does NOT stop signing of in-flight requests)
```

The suspend step is reversible. The "don't touch evidence" step is the one that's hard to undo if violated.

---

## 3. Investigation

### 3.1 Determine the failure mode

Pull the offending NDJSON object and re-run `verifyChain` locally:

```bash
# Identify the batch
aws s3 ls s3://gtcx-worm-audit-production-af-south-1/tenant=<id>/<YYYY>/<MM>/<DD>/<HH>/

# Download to a clean scratch directory (never to a shared host)
mkdir -p /tmp/audit-incident-$(date +%s)
aws s3 cp s3://.../<batch>.ndjson /tmp/audit-incident-.../batch.ndjson

# Verify locally with the published audit-signer
npx -y @gtcx/audit-signer verify --file /tmp/audit-incident-.../batch.ndjson
```

The verifier returns one of:

| Output                                    | Failure mode                                      | Next step                    |
| ----------------------------------------- | ------------------------------------------------- | ---------------------------- |
| `valid: true`                             | False positive — alert misconfigured              | Sec 3.2                      |
| `valid: false, firstInvalidIndex: 0`      | First record is malformed (likely sink mis-write) | Sec 3.3                      |
| `valid: false, firstInvalidIndex: N (>0)` | Insertion / drop / modification at position N     | Sec 3.4 (active threat path) |
| Verifier errors (parse failure)           | Object corruption in transit/storage              | Sec 3.5                      |

### 3.2 False positive

If the local verifier passes, the dashboard alert is misconfigured or scraping stale state. Confirm the dashboard's source-of-truth is the current audit-flush version. File a follow-up to fix the alert; downgrade severity to P3.

### 3.3 First-record malformation

The audit-flush sidecar batched records but the first one is malformed. Almost always points to a recent audit-flush version bump.

```bash
# Check current audit-flush version
kubectl -n compliance get deploy audit-flush -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check the last image change in audit-flush
kubectl -n compliance rollout history deploy/audit-flush

# Roll back if the malformation correlates with a recent rollout
kubectl -n compliance rollout undo deploy/audit-flush
```

### 3.4 Insertion / drop / modification (active threat path)

If `firstInvalidIndex > 0`, the chain was structurally tampered with after publication. This is the threat model T-1/I-1 path from `docs/security/threat-model-2026-05.md`.

```text
1. DO NOT touch the WORM object. Object Lock COMPLIANCE will refuse modifications anyway, but treat the bucket as evidence.
2. Pull the corresponding JetStream replay from the durable stream:
   nats stream view gtcx-audit-stream --subject "gtcx.audit.compliance-gateway.<tenant>" --since 2h
3. Compare JetStream records vs. WORM batch — the difference is the tampered window.
4. Pull the audit-flush logs for the relevant batch:
   kubectl -n compliance logs deploy/audit-flush --since=2h --tail=10000 | grep <batch-id>
5. Pull the WORM access log (S3 server access logging) for the bucket prefix.
6. Engage CISO. This may be a security incident requiring external disclosure depending on tenant.
```

The substrate's compromise model is documented in `docs/security/threat-model-2026-05.md` T-1. The audit-flush sidecar's JetStream replay is the recovery surface — JetStream retention is set to 7 days specifically to enable this.

### 3.5 Object corruption in transit/storage

Verifier errors on parse mean the NDJSON is not well-formed JSON-per-line. Very rare; usually points to:

- A failed multipart upload that S3 accepted but stitched incorrectly (check S3 ETag against audit-flush's recorded ETag)
- A KMS decryption mismatch (check CloudTrail for KMS errors at the object's creation time)
- A storage-layer corruption (file an AWS support ticket immediately; S3 corruption is rare but not zero)

```bash
# Compare audit-flush's expected ETag with what S3 returned
grep "<batch-id>" /var/log/audit-flush/upload-log.jsonl | jq .uploadedEtag
aws s3api head-object --bucket gtcx-worm-audit-production-af-south-1 --key <key> --query 'ETag'

# If they differ, the object was modified server-side after the sidecar's upload — file AWS support immediately
```

---

## 4. Containment

While investigation proceeds, contain the blast radius:

| Action                                                                     | When to take it                              |
| -------------------------------------------------------------------------- | -------------------------------------------- |
| Suspend new tenant admissions (feature flag)                               | Always, on first P0                          |
| Rotate the signing key (ADR-016 requires this on suspected key compromise) | Sec 3.4 (active threat path) only            |
| Rebuild audit-flush from prior known-good image                            | Sec 3.3 (first-record malformation) only     |
| Cut new tenant onboarding                                                  | Sec 3.4 only                                 |
| Engage external counsel                                                    | When tenant data privacy boundary is at risk |

Key rotation is irreversible and high-cost — only do it under Sec 3.4. The runbook for key rotation is [audit-signing-key-rotation.md](./audit-signing-key-rotation.md).

---

## 5. Recovery

### From a benign failure (Sec 3.2, 3.3)

```bash
# Restart audit-flush
kubectl -n compliance rollout restart deploy/audit-flush

# Verify chain integrity on the next batch
# (audit-trust dashboard will show green within 10 minutes of the rollout)
```

### From an active-threat failure (Sec 3.4)

Recovery is a multi-day process:

```text
1. CISO-led incident response engaged
2. Forensic copy of affected WORM prefix exported to dedicated isolated bucket
3. Signing key rotated per audit-signing-key-rotation.md runbook
4. New chain anchor recorded as a signed `chain.rotation` audit event
5. Affected tenant(s) notified per their data processing agreement
6. Post-mortem published within 5 business days
```

The substrate continues operating after the key rotation. Old WORM objects remain verifiable against the old key (which the runbook archives — not destroys). New objects verify against the new key.

---

## 6. Post-Mortem

P0 post-mortem template lives at `docs/operations/post-mortems/templates/audit-incident-template.md`. Required sections beyond the standard:

- **Threat model coverage gap.** Which STRIDE category was not adequately mitigated? File ADR follow-ups.
- **Detection latency.** Time from compromise to alert firing. If > 60s, an audit-trust SLI is missing.
- **Containment latency.** Time from alert to feature-flag suspension. Target < 15 min.
- **External notifications.** List of tenants/regulators notified, with timestamps.

---

## 7. Related

- ADR-014 — NATS JetStream as Audit Transport (recovery surface)
- ADR-015 — Per-Tenant Subject Routing (containment surface)
- ADR-016 — Fail-Closed Audit Signing (signing posture)
- [`audit-signing-key-rotation.md`](./audit-signing-key-rotation.md) — companion runbook
- [`audit-flush-deployment.md`](./audit-flush-deployment.md) — sidecar operational reference
- [`docs/security/threat-model-2026-05.md`](../../security/threat-model-2026-05.md) — STRIDE source-of-truth
- [`docs/architecture/compliance-substrate-deep-dive.md`](../../architecture/compliance-substrate-deep-dive.md) — Layer 2 architecture
