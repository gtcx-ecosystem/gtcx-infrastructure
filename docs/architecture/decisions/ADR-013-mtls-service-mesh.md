---
title: 'ADR-007: mTLS and Service Mesh Architecture'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'standard'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'on-change'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-007: mTLS and Service Mesh Architecture

## Status

**Accepted** — Phase 1 complete (documentation + policy templates). Phase 2 (cert-manager + Linkerd sidecar injection) scheduled Q3 2026. Phase 3 (deny-by-default authorization) templates prepared in `infra/kubernetes/overlays/*/linkerd/`.

## Context

Current intra-cluster communication uses plain HTTP. A strict trust-bearing audit flagged this as a gap (no mTLS / service mesh). We need encrypted, authenticated pod-to-pod traffic without destabilizing the existing stack.

## Decision

**Phase 1 (Immediate):** Document and prepare — no committed binaries, no runtime changes.
**Phase 2 (Q3 2026):** cert-manager + Linkerd sidecar injection.
**Phase 3 (Q4 2026):** Full mesh policy with deny-by-default + per-service authorization.

## Options Considered

| Option        | Complexity  | Resource Cost          | AWS Native | Verdict                                                           |
| ------------- | ----------- | ---------------------- | ---------- | ----------------------------------------------------------------- |
| Istio         | High        | High CPU/mem sidecars  | No         | Rejected — overkill for our pod count                             |
| Linkerd       | Medium      | Low (~10-20MB/sidecar) | No         | **Selected** — CNCF graduated, low overhead, CLI-driven debugging |
| AWS App Mesh  | Medium      | Medium                 | Yes        | Rejected — ties us to AWS VPC CNI; harder to test locally         |
| Cilium (eBPF) | Medium-High | Low (kernel-level)     | Partial    | Alternative if Linkerd fails; requires kernel 5.10+               |

## Phase 2 Implementation Plan

1. **cert-manager** deployed via Helm
   - Self-signed CA for dev/staging
   - ACM PCA or Let's Encrypt for production
2. **Linkerd** control plane installed
   - `linkerd install | kubectl apply -f -`
3. **Data plane injection** enabled per-namespace
   - Annotate `gtcx` and `intelligence` namespaces: `linkerd.io/inject: enabled`
4. **Validation**
   - `linkerd check`
   - `linkerd viz stat deploy` — confirms mTLS is active

## Phase 3 Policy Plan

- **Deny-by-default:** Only allowlisted service identities can communicate
- **Per-service authorization:** Replay-guard → protocols allowed; protocols → postgres allowed
- **Audit:** Linkerd tap logs forwarded to OpenTelemetry collector

## Risks

- **Sidecar resource overhead:** Budget ~25m CPU / 20Mi mem per pod
- **Cold-start latency:** Linkerd proxy init container adds ~1-2s to pod startup
- **Debugging complexity:** `linkerd viz tap` required for traffic inspection

## References

- Linkerd getting started: https://linkerd.io/getting-started/
- cert-manager docs: https://cert-manager.io/docs/
- Existing NetworkPolicy: `infra/kubernetes/overlays/production/network-policies.yaml`
