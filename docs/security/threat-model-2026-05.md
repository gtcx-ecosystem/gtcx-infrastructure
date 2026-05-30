---
title: 'Threat Model — Compliance Substrate (STRIDE)'
status: 'current'
date: '2026-05-27'
owner: 'security-lead'
tier: 'critical'
tags: ['security', 'threat-model', 'stride', 'audit', 'compliance']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Threat Model — GTCX Compliance Substrate (STRIDE)

**Scope:** compliance-gateway HTTP API · audit-signer chain · NATS JetStream `gtcx.audit.>` · audit-flush sidecar · WORM S3 bucket · operational + audit PostgreSQL · KMS keys · LLM provider hops.

**Methodology:** Microsoft STRIDE — Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege. Per-component analysis with mitigations cited at file:line where applicable.

**Predecessor:** [`docs/audit/repo-overlay.md`](../audit/repo-overlay.md) · [`docs/compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md)

## Trust boundaries

```
                                  ┌─── External ────────────────────────────────┐
                                  │ Browser / Bot / Tenant operator             │
                                  │ Pen-tester / Regulator / Future auditor     │
                                  └────────────────┬────────────────────────────┘
                                                   │ HTTPS (TLS 1.3 enforced)
                                                   │
─────────────────────────── BOUNDARY A: Internet ──┼─────────────────────────────
                                                   │
                                  ┌─── EKS gtcx namespace ──────────────────────┐
                                  │ ALB + WAFv2 + Kyverno admission             │
                                  │                                             │
                                  │  ┌── compliance-gateway pod ────────────┐  │
                                  │  │ HTTP API · audit-signer · budget    │  │
                                  │  │ JetStream publish                   │  │
                                  │  └────────────┬─────────────────────────┘  │
                                  │               │                            │
                                  │  BOUNDARY B: ─┼─ pod-to-pod (Linkerd       │
                                  │  intra-cluster│  mTLS pending; NetworkPol)  │
                                  │               │                            │
                                  │  ┌── NATS broker pod ────────────────────┐ │
                                  │  │ JetStream durable consumer            │ │
                                  │  └────────────┬──────────────────────────┘ │
                                  │               │                            │
                                  │  ┌── audit-flush pod ─────────────────────┐│
                                  │  │ verifyChain · batch · IRSA AssumeRole  ││
                                  │  └────────────┬───────────────────────────┘│
                                  └───────────────┼────────────────────────────┘
                                                  │
─────────────────────────── BOUNDARY C: VPC → AWS ┼───────────────────────────────
                                                  │ STS-signed PutObject
                                  ┌─── AWS account (af-south-1) ─────────────────┐
                                  │  ┌── S3 WORM bucket ─────────────────────┐  │
                                  │  │ Object Lock COMPLIANCE 2557d          │  │
                                  │  │ KMS encryption (separate CMK)         │  │
                                  │  └───────────────────────────────────────┘  │
                                  │  ┌── KMS · RDS · Secrets Manager ────────┐  │
                                  │  └───────────────────────────────────────┘  │
                                  └─────────────────────────────────────────────┘
                                                  │
─────────────────────────── BOUNDARY D: AWS → LLM ┼───────────────────────────────
                                                  │
                                  ┌─── Third-party LLM providers ───────────────┐
                                  │ Anthropic / Google / OpenAI                 │
                                  └─────────────────────────────────────────────┘
```

Four trust boundaries; threats crossing each are catalogued below.

---

## S — Spoofing

### S-1: Forged bearer token to compliance-gateway

|                |                                                                                                                                                                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Authenticated session on `/v1/query`, `/v1/tools`, etc.                                                                                                                                                                                                   |
| **Adversary**  | External attacker with no valid credentials                                                                                                                                                                                                               |
| **Vector**     | Submit any HTTP request claiming a bearer token                                                                                                                                                                                                           |
| **Likelihood** | High (any internet-facing endpoint)                                                                                                                                                                                                                       |
| **Impact**     | High if successful — could read tenant data, exhaust budget, pollute audit chain                                                                                                                                                                          |
| **Mitigation** | `tools/compliance-gateway/src/auth.mjs:153-160` — `constantTimeEquals` via `timingSafeEqual` prevents timing-based brute force. Tokens are 64+ chars opaque strings; no algorithmic guess. Audit-failure event signed on every miss (`server.mjs:88-95`). |
| **Residual**   | Low — depends on token generation entropy + rotation discipline                                                                                                                                                                                           |
| **Status**     | Mitigated                                                                                                                                                                                                                                                 |

### S-2: Forged JetStream subject publish from inside the cluster

|                |                                                                                                                                                                                                                                                                                  |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Audit chain integrity (records appearing on a tenant's subject from a non-gateway publisher)                                                                                                                                                                                     |
| **Adversary**  | Compromised pod inside `gtcx` namespace                                                                                                                                                                                                                                          |
| **Vector**     | Publish a malicious "signed" record to `gtcx.audit.compliance-gateway.<tenantId>`                                                                                                                                                                                                |
| **Likelihood** | Low (requires lateral movement post-RCE)                                                                                                                                                                                                                                         |
| **Impact**     | High — pollutes audit evidence                                                                                                                                                                                                                                                   |
| **Mitigation** | NATS account-based authentication scopes publish-rights to the compliance-gateway service account only. audit-flush verifies signatures on every record; an unsigned-but-published record fails `verifyChain` and gets quarantined. ADR-014 + ADR-015 codify the trust contract. |
| **Residual**   | Quarantine route catches the attempt; auditor sees the failure, not a silently accepted forgery                                                                                                                                                                                  |
| **Status**     | Mitigated                                                                                                                                                                                                                                                                        |

### S-3: Forged approval ticket on mutating tool call

|                |                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Mutating tool invocation (TradePass issue, PvP execute)                                                                                                                                                                                                                                                                                                                                                         |
| **Adversary**  | Authenticated user without approval rights                                                                                                                                                                                                                                                                                                                                                                      |
| **Vector**     | Submit `X-Gtcx-Approval-Ticket`, `X-Gtcx-Approved-By`, etc. with fabricated values                                                                                                                                                                                                                                                                                                                              |
| **Likelihood** | Medium (any authenticated user could try)                                                                                                                                                                                                                                                                                                                                                                       |
| **Impact**     | High — could execute consequential state change                                                                                                                                                                                                                                                                                                                                                                 |
| **Mitigation** | `tools/compliance-gateway/src/auth.mjs:194-206` requires all four approval headers present; `buildAccessProfile` sets `canMutate: false` unless `approval.valid` is true. Ticket value itself is just a string — but `policy.mjs` only enables mutating tools when `accessProfile.canMutate === true`. **Open gap:** no signature on the ticket itself; trust comes from operator's discretion when minting it. |
| **Residual**   | Medium — depends on operator discipline. Sprint 11 (pen-test triage) likely to surface this.                                                                                                                                                                                                                                                                                                                    |
| **Status**     | Partial — see backlog item SEC-OPEN-001 (signed approval tickets)                                                                                                                                                                                                                                                                                                                                               |

---

## T — Tampering

### T-1: Modify audit record in WORM bucket

|                |                                                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Asset**      | Tamper-evident audit chain                                                                                                                                                                                                                                                                                   |
| **Adversary**  | Insider with `s3:PutObject` on the WORM bucket                                                                                                                                                                                                                                                               |
| **Vector**     | Overwrite an existing NDJSON object                                                                                                                                                                                                                                                                          |
| **Likelihood** | Low (IRSA role grants PutObject + LegalHold only, no DeleteObject)                                                                                                                                                                                                                                           |
| **Impact**     | Bucket-policy-blocked — Object Lock in COMPLIANCE mode prevents even the bucket owner from overwriting within the retention window                                                                                                                                                                           |
| **Mitigation** | `infra/terraform/modules/worm-audit/main.tf` — Object Lock COMPLIANCE mode, 2557-day default retention. Even root account credentials cannot override this in COMPLIANCE mode. `infra/terraform/modules/audit-flush-irsa/main.tf` grants only PutObject + PutObjectLegalHold; no GetObject, no DeleteObject. |
| **Residual**   | Effectively zero within retention window                                                                                                                                                                                                                                                                     |
| **Status**     | Mitigated                                                                                                                                                                                                                                                                                                    |

### T-2: Tamper with NDJSON in flight between audit-flush and S3

|                |                                                                                                                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Audit batch integrity                                                                                                                                                                                               |
| **Adversary**  | Network MITM between EKS and S3 (VPC traffic)                                                                                                                                                                       |
| **Vector**     | Intercept HTTPS PutObject; modify body                                                                                                                                                                              |
| **Likelihood** | Very Low (AWS VPC traffic, TLS 1.3)                                                                                                                                                                                 |
| **Impact**     | If undetected, would poison WORM bucket                                                                                                                                                                             |
| **Mitigation** | All AWS traffic uses TLS 1.3 with AWS-issued certs. Even if MITM succeeded, the modified record would fail `verifyChain` when read; an auditor's verifier catches the tamper regardless of where it was introduced. |
| **Residual**   | Cryptographic verification is the final defense; transport TLS is the first                                                                                                                                         |
| **Status**     | Mitigated                                                                                                                                                                                                           |

### T-3: Modify in-memory audit chain between sign and emit

|                |                                                                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Records that have been signed but not yet emitted to sink                                                                                                                                       |
| **Adversary**  | Memory-scraping malware on the gateway pod                                                                                                                                                      |
| **Vector**     | Read or modify Node.js heap                                                                                                                                                                     |
| **Likelihood** | Very Low (requires pod-level compromise, defeated by Kyverno `readOnlyRootFilesystem` + non-root user + dropped capabilities)                                                                   |
| **Impact**     | Single record affected before emit; the signed bytes already include the publicKey, so even a modified copy would fail signature verification                                                   |
| **Mitigation** | Defense in depth: Kyverno admission requires non-root, read-only rootfs, dropped capabilities, seccomp RuntimeDefault. eBPF runtime monitoring (Falco — planned) would detect unusual syscalls. |
| **Residual**   | Low; signed bytes include publicKey so even modified copies fail downstream verification                                                                                                        |
| **Status**     | Mitigated                                                                                                                                                                                       |

### T-4: Tamper with @gtcx/audit-signer package on npm

|                |                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Asset**      | The published package consumers install                                                                                                                                                                                                                      |
| **Adversary**  | Compromise of GTCX npm credentials                                                                                                                                                                                                                           |
| **Vector**     | Publish a malicious v0.1.1 that backdoors the chain logic                                                                                                                                                                                                    |
| **Likelihood** | Low — bypass-2FA token required for publish (per ADR-021 if we write it; informally per npm config)                                                                                                                                                          |
| **Impact**     | Catastrophic if undetected — every downstream consumer's chain is compromised                                                                                                                                                                                |
| **Mitigation** | npm provenance attestation (planned post-SLSA wiring); npm 2FA on the account; Sigstore signing of the published tarball (future). For now: GitHub Security Advisories on the parent repo enable rapid v0.1.2 cut + npm deprecation of any tampered version. |
| **Residual**   | Medium — the post-publish detection window is real                                                                                                                                                                                                           |
| **Status**     | Partial — see backlog item SEC-OPEN-002 (provenance + Sigstore signing on npm publish)                                                                                                                                                                       |

---

## R — Repudiation

### R-1: Operator denies issuing a credential

|                |                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Non-repudiable evidence of operator action                                                                                                                                                                                                  |
| **Adversary**  | Internal operator after the fact                                                                                                                                                                                                            |
| **Vector**     | "It wasn't me / I never authorized that"                                                                                                                                                                                                    |
| **Likelihood** | Low (insider risk)                                                                                                                                                                                                                          |
| **Impact**     | Medium — affects accountability + audit defensibility                                                                                                                                                                                       |
| **Mitigation** | Every operator action is signed with the operator's bearer token's principal id as `actor`. The signed record is durable in WORM (defeats post-hoc denial). Two-person rule for break-glass (per `docs/security/break-glass-procedure.md`). |
| **Residual**   | Low — cryptographic non-repudiation is the contract                                                                                                                                                                                         |
| **Status**     | Mitigated                                                                                                                                                                                                                                   |

### R-2: GTCX denies tampering with its own audit chain

|                |                                                                                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Third-party verifiability claim                                                                                                                                                                                                                                               |
| **Adversary**  | GTCX itself (in a regulator-vs-GTCX scenario)                                                                                                                                                                                                                                 |
| **Vector**     | "We modified the chain; the auditor's verification was wrong"                                                                                                                                                                                                                 |
| **Likelihood** | N/A — this is the regulator's threat to defend against                                                                                                                                                                                                                        |
| **Impact**     | High if GTCX could plausibly modify its own evidence                                                                                                                                                                                                                          |
| **Mitigation** | The published `@gtcx/audit-signer` library on npm and the published `verifyChain` algorithm are public + reproducible. Any auditor with the NDJSON file + a Node 20 box can verify independently. GTCX cannot "rewrite the verifier"; the verifier is in the auditor's hands. |
| **Residual**   | This is the regulator-facing trust property; substrate is designed exactly to defeat this                                                                                                                                                                                     |
| **Status**     | Mitigated by design                                                                                                                                                                                                                                                           |

---

## I — Information Disclosure

### I-1: LLM provider retains query text beyond contractual window

|                |                                                                                                                                                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Tenant query text (potentially PII per DPIA category 5)                                                                                                                                                                                                                                                                                       |
| **Adversary**  | LLM provider (Anthropic / Google / OpenAI)                                                                                                                                                                                                                                                                                                    |
| **Vector**     | Provider stores prompts for training or retention beyond zero-retention contract                                                                                                                                                                                                                                                              |
| **Likelihood** | Medium (vendor terms vary; some providers' default retention is non-zero)                                                                                                                                                                                                                                                                     |
| **Impact**     | High under GDPR/CCPA                                                                                                                                                                                                                                                                                                                          |
| **Mitigation** | Per [`docs/compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md) DPIA-01: provider TOS audit; zero-retention DPAs in place where possible; per-principal token budget bounds the volume sent. A purpose-built AI gateway with explicit zero-data-retention configuration is a candidate evolution (out of scope for current substrate). |
| **Residual**   | Medium — depends on per-provider contractual posture                                                                                                                                                                                                                                                                                          |
| **Status**     | Partial — see DPIA-01 risk register                                                                                                                                                                                                                                                                                                           |

### I-2: Cross-tenant data leakage in response body

|                |                                                                                                                                                                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Tenant data isolation                                                                                                                                                                                                                                                       |
| **Adversary**  | Authenticated tenant A operator                                                                                                                                                                                                                                             |
| **Vector**     | Submit a query that triggers tool calls returning tenant B data                                                                                                                                                                                                             |
| **Likelihood** | Low (tools are scoped per principal)                                                                                                                                                                                                                                        |
| **Impact**     | High — cross-tenant data exposure                                                                                                                                                                                                                                           |
| **Mitigation** | `tools/compliance-gateway/src/tools.mjs:executeWithAccess` passes the accessProfile to every tool; tools filter results by tenant. Soak test (Sprint 5 INT TEN-005) has a cross-tenant-leak assertion. Sprint 8 internal red-team (TEN-V-003) explicitly tests this vector. |
| **Residual**   | Low; will be tested empirically in Sprint 8                                                                                                                                                                                                                                 |
| **Status**     | Mitigated; verification pending                                                                                                                                                                                                                                             |

### I-3: Audit record body leaks PII via `target` field

|                |                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Records in the WORM bucket (retained for 7 years)                                                                                                                                       |
| **Adversary**  | Anyone with future WORM read access                                                                                                                                                     |
| **Vector**     | A long URL containing PII gets signed into `target`                                                                                                                                     |
| **Likelihood** | Was Medium pre-Cycle 1; Low now                                                                                                                                                         |
| **Impact**     | Medium — PII would persist 7 years                                                                                                                                                      |
| **Mitigation** | `tools/compliance-gateway/src/audit-target.mjs` strips query strings + URL fragments + caps at 200 chars before signing. Query body itself is hashed via `payloadHash`, not stored raw. |
| **Residual**   | Very Low — only if a path segment contains PII (operationally avoidable)                                                                                                                |
| **Status**     | Mitigated                                                                                                                                                                               |

### I-4: Side-channel leak via `/v1/budget` response

|                |                                                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Per-tenant cost information                                                                                         |
| **Adversary**  | Cross-tenant operator attempting to enumerate other tenants' spend                                                  |
| **Vector**     | Query `/v1/budget` with tenant A's token; the response could include tenant B's tenant identifier in error messages |
| **Likelihood** | Low                                                                                                                 |
| **Impact**     | Low (cost figures alone are not PII)                                                                                |
| **Mitigation** | `getSpend(subject, tenantId)` scopes returns to the caller's own tenant by argument; no enumeration path            |
| **Residual**   | Effectively zero                                                                                                    |
| **Status**     | Mitigated                                                                                                           |

---

## D — Denial of Service

### D-1: LLM cost amplification by single principal

|                |                                                                                                                                                                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | LLM provider budget                                                                                                                                                                                                                                                               |
| **Adversary**  | Authenticated user with valid token (insider risk or stolen credential)                                                                                                                                                                                                           |
| **Vector**     | Loop high-cost queries through `/v1/query`                                                                                                                                                                                                                                        |
| **Likelihood** | Medium                                                                                                                                                                                                                                                                            |
| **Impact**     | High — could burn $1000s/day at frontier-tier pricing                                                                                                                                                                                                                             |
| **Mitigation** | `tools/compliance-gateway/src/budget.mjs` enforces per-principal QPS + daily USD budget (10 QPS / $5/day default). 429 with `Retry-After` once exceeded; signed `query:throttled` audit record on every throttle. Per-tenant override possible via `GTCX_PRINCIPAL_BUDGETS_JSON`. |
| **Residual**   | Bounded by the configured per-principal cap; even a fully compromised token can spend at most one principal's daily budget                                                                                                                                                        |
| **Status**     | Mitigated                                                                                                                                                                                                                                                                         |

### D-2: NATS JetStream stream backpressure |

|                |                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Asset**      | Gateway request-handling latency                                                                                                                                                                                                                                                                 |
| **Adversary**  | NATS broker outage or audit-flush sidecar lagging                                                                                                                                                                                                                                                |
| **Vector**     | JetStream stream fills up; publish blocks or fails                                                                                                                                                                                                                                               |
| **Likelihood** | Low                                                                                                                                                                                                                                                                                              |
| **Impact**     | Medium — gateway publish takes longer, but audit-flush will catch up                                                                                                                                                                                                                             |
| **Mitigation** | Per ADR-014: gateway publish is sub-ms-bounded; if JetStream is unreachable, gateway falls back to stdout sink mirror (audit-sink.mjs line 90 publishes to stdout regardless of NATS state). audit-flush horizontal scale via replicas. Stream `max_age` set per environment to bound retention. |
| **Residual**   | Bounded transient; recovers on NATS reconnect                                                                                                                                                                                                                                                    |
| **Status**     | Mitigated                                                                                                                                                                                                                                                                                        |

### D-3: WORM bucket cost explosion via tenant flooding

|                |                                                                                                                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Asset**      | S3 storage costs (no deletion possible within retention window)                                                                                                                                                                |
| **Adversary**  | Authenticated tenant looping audit-triggering queries                                                                                                                                                                          |
| **Vector**     | Generate millions of audit records — each becomes a WORM object that cannot be deleted for 7 years                                                                                                                             |
| **Likelihood** | Low (per-principal budget caps query rate; each query produces ≤ 3 audit records)                                                                                                                                              |
| **Impact**     | Medium — cost growth                                                                                                                                                                                                           |
| **Mitigation** | Per-principal QPS + daily budget (D-1) caps the upstream record rate. audit-flush batches 500-1000 records per object, so per-tenant volume is amortized. Per-tenant prefix in WORM allows future cost attribution per tenant. |
| **Residual**   | Low; cost is bounded by aggregate D-1 caps                                                                                                                                                                                     |
| **Status**     | Mitigated                                                                                                                                                                                                                      |

### D-4: Prompt injection causing the LLM to loop tool calls

|                |                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | LLM cost + gateway latency                                                                                                                                                                                                                              |
| **Adversary**  | Anyone submitting query text                                                                                                                                                                                                                            |
| **Vector**     | Craft a query that causes the model to invoke tools in an infinite loop within `maxSteps`                                                                                                                                                               |
| **Likelihood** | Medium                                                                                                                                                                                                                                                  |
| **Impact**     | Bounded by `maxSteps: 5` in `generateText` config                                                                                                                                                                                                       |
| **Mitigation** | `tools/compliance-gateway/src/server.mjs` sets `maxSteps: 5` — model cannot exceed 5 tool calls per query. Combined with D-1 budget cap, blast radius is bounded. ADR-016 system prompt + delimited untrusted-context further reduce injection success. |
| **Residual**   | Low                                                                                                                                                                                                                                                     |
| **Status**     | Mitigated                                                                                                                                                                                                                                               |

---

## E — Elevation of Privilege

### E-1: Container escape on compliance-gateway pod

|                |                                                                                                                                                                                                                                                                                                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | Node access; lateral movement to other pods                                                                                                                                                                                                                                                                                                        |
| **Adversary**  | Attacker exploiting Node.js or dependency CVE                                                                                                                                                                                                                                                                                                      |
| **Vector**     | RCE within the gateway pod's process space                                                                                                                                                                                                                                                                                                         |
| **Likelihood** | Low (current dep count is small; Trivy scans every CI build)                                                                                                                                                                                                                                                                                       |
| **Impact**     | High if escape succeeds — could pivot                                                                                                                                                                                                                                                                                                              |
| **Mitigation** | Kyverno admission policies enforce `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, dropped capabilities (`drop: [ALL]`), seccomp `RuntimeDefault`. Container runs as uid 1001. No privileged mode. No host network. NetworkPolicies default-deny egress except DNS + intra-namespace. Pen-test (Sprint 7) will explicitly test this surface. |
| **Residual**   | Low                                                                                                                                                                                                                                                                                                                                                |
| **Status**     | Mitigated; will be tested empirically                                                                                                                                                                                                                                                                                                              |

### E-2: IRSA token theft → audit-flush S3 access

|                |                                                                                                                                                                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Asset**      | WORM bucket PutObject (and only PutObject)                                                                                                                                                                                                                                                   |
| **Adversary**  | Compromised audit-flush pod                                                                                                                                                                                                                                                                  |
| **Vector**     | Steal the projected SA token, assume the IRSA role                                                                                                                                                                                                                                           |
| **Likelihood** | Low (requires pod-level compromise of an already-restricted container)                                                                                                                                                                                                                       |
| **Impact**     | Bounded — role grants only PutObject + KMS:Encrypt; no GetObject, no DeleteObject. Object Lock prevents overwrite anyway.                                                                                                                                                                    |
| **Mitigation** | `infra/terraform/modules/audit-flush-irsa/main.tf` deliberately narrow: PutObject, PutObjectLegalHold, KMS:Encrypt. The role cannot READ records, cannot delete records. Even a fully compromised sidecar could only ADD records (which would still fail signature verification downstream). |
| **Residual**   | Effectively zero blast radius                                                                                                                                                                                                                                                                |
| **Status**     | Mitigated                                                                                                                                                                                                                                                                                    |

### E-3: Token-scope escalation via JSON config injection

|                |                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Asset**      | Permissions a principal carries                                                                                                                                                                                    |
| **Adversary**  | Anyone with read access to the auth config secret                                                                                                                                                                  |
| **Vector**     | Inject malicious JSON into `COMPLIANCE_GATEWAY_AUTH_TOKENS_JSON` that grants extra permissions to a chosen subject                                                                                                 |
| **Likelihood** | Very Low (config is a Kubernetes Secret; access controlled by RBAC + IRSA)                                                                                                                                         |
| **Impact**     | High if successful — could grant `query:mutate` to an attacker-controlled token                                                                                                                                    |
| **Mitigation** | The secret lives in Kubernetes Secrets (or AWS Secrets Manager via External Secrets Operator). RBAC restricts who can read the namespace's secrets. Audit log on Secret reads (CloudTrail + Kubernetes audit log). |
| **Residual**   | Depends on RBAC discipline + Secret access audit                                                                                                                                                                   |
| **Status**     | Mitigated by RBAC + CloudTrail                                                                                                                                                                                     |

---

## Cross-cutting properties

### CC-1: Fail-closed in production

Per ADR-016, the gateway exits EX_CONFIG 78 in production without `AUDIT_SIGNING_KEY_B64`. The `/health` endpoint reports 503 when signing is disabled in production. This means production deploys cannot quietly serve traffic without producing tamper-evident evidence — closing the original Round-1 audit's silent-unsigned-audit failure mode.

### CC-2: Independent verifiability

The published `@gtcx/audit-signer` on npm is the verifier the auditor will run. GTCX cannot substitute a different verifier without it being detectable (signature would not match the documented algorithm). This means GTCX's own threat-model claim is itself externally checkable.

### CC-3: Defense in depth

Every consequential decision passes through three layers (auth → policy → tool segregation) plus audit. A failure in any single layer is contained by the others. The 226 unit + integration tests on the gateway exercise each layer's failure independently.

---

## Backlog items (SEC-OPEN)

These are threats with mitigations classified Partial — sized work items go into the next pen-test triage cycle (Sprint 11).

| ID           | Threat ref | Item                                                                                               | Effort | Target             |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------- | ------ | ------------------ |
| SEC-OPEN-001 | S-3        | Signed approval tickets (Ed25519 over `ticket + approvedBy + reason + idempotencyKey + timestamp`) | M      | Post-pen-test      |
| SEC-OPEN-002 | T-4        | npm publish provenance attestation + Sigstore signing                                              | S      | Pre-v0.2.0 publish |
| SEC-OPEN-003 | I-1        | LLM provider DPA audit + per-vendor retention proof                                                | M      | Sprint 8 parallel  |
| SEC-OPEN-004 | All        | Linkerd mTLS sidecar runtime injection (ADR-013)                                                   | L      | Q3 2026            |

## Review and update cadence

- **On any new component** added to the trust boundary diagram → re-run STRIDE against it.
- **On any new processor** (LLM vendor, storage, audit consumer) → add the boundary, re-analyze I-_ and E-_ threats.
- **Quarterly** (next: 2026-08) → revalidate every "Mitigated" claim against the live code; demote to "Partial" if any backing test or control has been removed.
- **Post-pen-test** → reconcile findings against this document; any pen-test P0/P1 not already in this model gets added with its own analysis.

## References

- ADR-014 — NATS JetStream Audit Transport
- ADR-015 — Per-Tenant JetStream Subject Routing
- ADR-016 — Fail-Closed Audit Signing in Production
- ADR-017 — Adaptive Policy Tuning with Signed Transitions
- ADR-018 — Pen-Test Contained-Blast-Radius Overlay
- [`docs/compliance/dpia-2026-05.md`](../compliance/dpia-2026-05.md) — GDPR/CCPA DPIA (companion analysis at the data-protection layer)
- [`docs/audit/pen-test-rfp-2026.md`](../audit/pen-test-rfp-2026.md) — pen-test engagement (validates this model empirically)
- [`docs/operations/slo-definitions.md`](../operations/slo-definitions.md) — SLOs (define "healthy" against which DoS threats are measured)
- Microsoft STRIDE methodology: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
