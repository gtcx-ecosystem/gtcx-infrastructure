---
title: 'Audit Integrity Verification — Design Specification'
status: 'current'
date: '2026-05-27'
owner: 'crypto-security-engineer'
role: 'crypto-security-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Audit Integrity Verification — Design Specification

**Status:** Proposed
**Principle:** AUDITABLE (P3)
**Last updated:** 2026-05-08

## Overview

This document specifies the `/v1/audit/verify` API, which provides cryptographic proof that audit events have not been tampered with. The system constructs Merkle trees over audit events, anchors roots to WORM storage, and exposes verification proofs to any third party without requiring database access.

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Audit Events   │───>│ Merkle Tree  │───>│  Root Anchoring │
│  (gtcx_audit)   │    │ Construction │    │  (S3 WORM + opt │
│                 │    │ (60s window) │    │   blockchain)   │
└─────────────────┘    └──────┬───────┘    └─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ /v1/audit/verify   │
                    │ Returns proof for  │
                    │ any event by ID    │
                    └───────────────────┘
```

## Merkle Tree Construction

### Window Strategy

- A new Merkle tree is constructed every **60 seconds**
- Each tree covers all audit events whose `created_at` falls within that window
- Empty windows produce a sentinel root: `SHA-256("GTCX_EMPTY_WINDOW")`

### Leaf Computation

Each audit event is hashed into a leaf:

```
leaf = SHA-256(
  event_id          || 0x00 ||
  event_type        || 0x00 ||
  did               || 0x00 ||
  payload_hash      || 0x00 ||
  created_at_iso    || 0x00 ||
  nonce
)
```

- `0x00` is a null byte separator to prevent concatenation collisions
- `payload_hash` is `SHA-256(canonical_json(payload))` — the payload itself is not included in the leaf
- `nonce` is the replay-protection nonce already present on each event

### Tree Construction

Events within each window are sorted by `(created_at, event_id)` to produce a deterministic ordering.

```
Pseudocode: build_merkle_tree(events)

  leaves = []
  for event in sort(events, key=(created_at, event_id)):
    leaves.append(compute_leaf(event))

  if len(leaves) == 0:
    return SHA256("GTCX_EMPTY_WINDOW")

  # Pad to next power of 2 with duplicate of last leaf
  while not is_power_of_2(len(leaves)):
    leaves.append(leaves[-1])

  # Build tree bottom-up
  tree = [leaves]
  current_level = leaves
  while len(current_level) > 1:
    next_level = []
    for i in range(0, len(current_level), 2):
      # Domain-separated: 0x01 prefix for internal nodes
      parent = SHA256(0x01 || current_level[i] || current_level[i+1])
      next_level.append(parent)
    tree.append(next_level)
    current_level = next_level

  root = current_level[0]
  return root, tree
```

Note: Leaf nodes use `SHA-256(0x00 || data)` and internal nodes use `SHA-256(0x01 || left || right)` to prevent second pre-image attacks (RFC 6962 domain separation).

### Storage

Each computed root is stored in the `merkle_roots` table:

```sql
CREATE TABLE merkle_roots (
  window_start  TIMESTAMPTZ NOT NULL,
  window_end    TIMESTAMPTZ NOT NULL,
  root_hash     BYTEA       NOT NULL,
  event_count   INTEGER     NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (window_start)
);
```

## Root Anchoring

### S3 WORM Anchor (Required)

Every computed root is written to the WORM audit bucket:

```
s3://gtcx-{env}-worm-audit/merkle-roots/{YYYY}/{MM}/{DD}/{window_start_iso}.json
```

Payload:

```json
{
  "window_start": "2026-05-08T12:00:00Z",
  "window_end": "2026-05-08T12:01:00Z",
  "root_hash": "a3f2...b891",
  "event_count": 47,
  "algorithm": "SHA-256",
  "version": 1
}
```

Object Lock in COMPLIANCE mode guarantees this file cannot be modified or deleted for the retention period (minimum 7 years).

### Blockchain Anchor (Optional)

For environments requiring third-party-verifiable proof:

- Batch merkle roots into a daily super-root (Merkle tree over the day's 1440 window roots)
- Publish the daily super-root as an OP_RETURN transaction on Bitcoin or an Ethereum event log
- Store the transaction ID in `merkle_anchors` table

This is optional and configurable per environment. The S3 WORM anchor is sufficient for regulatory compliance.

## Verification API

### Endpoint

```
GET /v1/audit/verify?eventId={id}
```

### Response

```json
{
  "event_id": "evt_abc123",
  "verified": true,
  "window": {
    "start": "2026-05-08T12:00:00Z",
    "end": "2026-05-08T12:01:00Z"
  },
  "leaf_hash": "d4e5...f678",
  "merkle_root": "a3f2...b891",
  "proof": [
    { "position": "left", "hash": "1a2b...3c4d" },
    { "position": "right", "hash": "5e6f...7a8b" },
    { "position": "left", "hash": "9c0d...1e2f" }
  ],
  "anchors": {
    "s3_worm": {
      "bucket": "gtcx-production-worm-audit",
      "key": "merkle-roots/2026/05/08/2026-05-08T12:00:00Z.json",
      "object_lock_retain_until": "2033-05-08T12:01:00Z"
    },
    "blockchain": null
  }
}
```

### Verification Algorithm

Any party can verify an event's inclusion without database access:

```
Pseudocode: verify_proof(leaf_hash, proof, expected_root)

  current = leaf_hash

  for step in proof:
    if step.position == "left":
      current = SHA256(0x01 || step.hash || current)
    else:
      current = SHA256(0x01 || current || step.hash)

  return current == expected_root
```

The verifier:

1. Receives the proof from the API
2. Fetches the anchored root from S3 WORM (or blockchain) independently
3. Recomputes the root from the leaf using the proof path
4. Compares: `computed_root == anchored_root`

If they match, the event was present in the original tree and has not been tampered with.

## Tamper Detection

### Continuous Verification

A background worker runs every 60 seconds:

1. Reads the most recent `merkle_roots` row from the database
2. Fetches the corresponding anchor from S3 WORM
3. Compares: `db_root == worm_root`
4. Emits metric `audit_merkle_root_match{result="match|mismatch"}`

### CloudWatch / Prometheus Alarm

```
AuditMerkleRootMismatch:
  expr: audit_merkle_root_match{result="mismatch"} > 0
  severity: critical
```

A mismatch means either:

- The database has been tampered with (the root was recomputed from altered events)
- The WORM anchor was written incorrectly (bug in the anchoring pipeline)

Both require immediate investigation. The WORM anchor is the source of truth.

### Response Procedure

1. Alert fires, pages on-call SRE
2. Identify the affected window(s) by querying `merkle_roots` for mismatches
3. Re-derive the Merkle tree from raw events in the database
4. Compare against the WORM anchor — if they differ, the database was altered
5. Restore from the last known-good state using WORM-anchored data
6. File incident report per break-glass procedure

## Third-Party Verification

Any external auditor can verify audit integrity without database access:

1. Request proof via `GET /v1/audit/verify?eventId={id}`
2. Independently fetch the WORM anchor from S3 (read-only access granted via IAM policy)
3. Run `verify_proof(leaf_hash, proof, worm_root)`
4. If blockchain anchoring is enabled, verify the daily super-root on-chain

This provides non-repudiation: GTCX cannot retroactively alter audit records because the roots are anchored in immutable storage controlled by Object Lock COMPLIANCE mode.

## Metrics

| Metric                                | Type      | Description                              |
| ------------------------------------- | --------- | ---------------------------------------- |
| `audit_merkle_tree_build_duration_ms` | Histogram | Time to build each window's tree         |
| `audit_merkle_tree_leaf_count`        | Histogram | Number of events per window              |
| `audit_merkle_root_match`             | Counter   | Root comparison results (match/mismatch) |
| `audit_verify_request_total`          | Counter   | Verification API requests                |
| `audit_verify_request_duration_ms`    | Histogram | Verification API latency                 |
| `audit_worm_anchor_write_total`       | Counter   | WORM anchor writes (success/failure)     |
