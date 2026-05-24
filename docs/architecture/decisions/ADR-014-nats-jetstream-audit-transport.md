---
title: 'ADR-014: NATS JetStream as the Audit Record Transport'
status: 'accepted'
date: '2026-05-22'
owner: 'platform-engineering'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['architecture', 'infrastructure', 'audit', 'messaging', 'compliance']
review_cycle: 'on-change'
---

# ADR-014: NATS JetStream as the Audit Record Transport

## Status

Accepted

## Date

2026-05-22

## Context

The compliance-gateway emits one signed audit record per consequential decision (auth success/failure, query success/failure, query throttled, policy adaptation). The records must reach the WORM S3 bucket durably, in order per chain, even when the gateway pod restarts, even when S3 has a transient outage. Direct PutObject from the gateway was rejected by Round 1 because S3 latency would bleed into `/v1/query` request latency.

We needed a transport with at-least-once delivery, durable consumer (records survive sidecar restart), per-tenant subject hierarchy, low operational overhead (NATS already running for protocol pub/sub), and sub-millisecond publish latency on the gateway side.

## Decision

We use NATS JetStream as the audit record transport, with the compliance-gateway publishing to per-tenant subjects (`gtcx.audit.compliance-gateway.<tenantId>`) and a separate audit-flush sidecar consuming those subjects with a durable consumer, batching to WORM S3.

## Alternatives Considered

| Option                        | Pros                                                                                                         | Cons                                                                                 |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Direct PutObject from gateway | Simple; no extra component                                                                                   | S3 latency on hot path; blocking on outage; no per-tenant batching                   |
| Kafka                         | Proven at high scale; strong ordering                                                                        | Heavy operational overhead; Zookeeper or KRaft adds complexity; not already in stack |
| SNS+SQS                       | AWS-native; well understood                                                                                  | Two services to manage; SQS doesn't preserve order across partitions; vendor lock-in |
| Redis Streams                 | Already in stack (replay-protection); lightweight                                                            | No durable consumer semantics matching JetStream; persistence semantics differ       |
| **NATS JetStream**            | Already deployed; durable consumer; subject hierarchy maps to per-tenant routing; tiny operational footprint | Less battle-tested at extreme scale than Kafka; requires NATS 2+                     |

## Consequences

**Positive:**

- Gateway publish latency is sub-ms; `/v1/query` is unaffected by S3 backpressure
- Per-tenant subject hierarchy gives clean tenant isolation in transport without filtering complexity
- One broker handles audit + protocol + replay traffic — single operational surface
- Durable consumer means audit-flush pods restart without loss
- JetStream's at-least-once delivery is correct for audit: duplicates are bounded by record `id` (deduplicable on read; tamper-evident chain validates either way)

**Negative:**

- JetStream is a single-region resource by default; cross-region durability requires JetStream mirroring (planned post-pilot)
- Adds a hop between signing and WORM. The signing chain is verifiable independent of the transport, so chain integrity is preserved, but failure modes are now distributed
- Gateway and audit-flush must agree on subject format. We codify `gtcx.audit.<service>.<tenantId>` in ADR-015

**Neutral:**

- Operational ownership stays with the existing NATS-running team
- Audit-signer chain semantics are independent of transport; we could swap NATS for Kafka later without changing record format

## References

- ADR-015 — Per-tenant JetStream subject routing
- ADR-016 — Fail-closed audit signing in production
- `tools/audit-flush/src/nats-consumer.mjs` — durable consumer implementation
- `tools/compliance-gateway/src/audit-sink.mjs` — gateway-side publisher
- NATS JetStream documentation: https://docs.nats.io/nats-concepts/jetstream
