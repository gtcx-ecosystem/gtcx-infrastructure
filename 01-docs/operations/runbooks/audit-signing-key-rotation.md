---
title: 'Runbook: Audit Signing Key Rotation'
status: 'current'
date: '2026-05-27'
owner: 'platform-engineering'
role: 'security-engineer'
tier: 'critical'
tags: ['security', 'audit', 'key-rotation', 'cryptography']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Runbook: Audit Signing Key Rotation

The Ed25519 keypair that signs every audit record is the substrate's root of trust. Rotation happens on three triggers:

1. **Scheduled** — every 365 days, per the rotation cadence in `01-docs/09-security/credential-rotation-log.md`
2. **Compromise-suspected** — any incident where the private key may have leaked (Sec 3.4 of [`audit-chain-incident-response.md`](./audit-chain-incident-response.md))
3. **Personnel change** — when a holder of the rotation procedure leaves the team

The rotation is **non-destructive** for old records: the old public key is archived (not destroyed), so historical WORM batches remain verifiable forever. Forward chains use the new key.

## Rotation flow at a glance

```mermaid
sequenceDiagram
    autonumber
    participant Op as Operator
    participant Host as Rotation Host (SSM)
    participant KMS as AWS KMS
    participant K8s as kubectl (Secret)
    participant GW as compliance-gateway pods
    participant Arch as Key Archive (WORM S3)
    participant Chain as Audit Chain

    Op->>Host: 2.1 generate Ed25519 keypair
    Host-->>Op: verifies: true
    Op->>KMS: 2.2 encrypt private key
    KMS-->>Op: ciphertext blob
    Op->>K8s: 2.3 patch Secret — add staged-{private,public}-key
    Note over K8s: gateway still uses active key
    Op->>K8s: 2.4 promote staged → active
    Op->>GW: rollout restart
    GW->>K8s: read active-private-key on boot
    Note over GW: now signing with new key
    GW->>Chain: 2.5 sign chain.rotation event<br/>(includes priorPublicKey)
    Chain-->>Op: rotation record landed
    Op->>Arch: 2.6 archive old keypair record
    Op->>K8s: 2.7 remove staged slot
    Note over K8s,GW: rotation complete; old WORM<br/>batches still verify with archived key

    rect rgba(220, 38, 38, 0.08)
        Note over Op,Arch: Undo possible up to step 2.6.<br/>After 2.7 the staged slot is gone — undo<br/>requires another full rotation.
    end
```

The diagram is illustrative; the canonical procedure is the numbered subsections below. If the two ever diverge, the prose wins.

---

## 1. Pre-Rotation Checklist

Run this once **before** touching any key material. Skipping any item is the most common cause of a botched rotation.

- [ ] On-call platform-engineering lead + security lead are both in the same Slack huddle
- [ ] Current audit-trust dashboard shows green (no in-flight incident)
- [ ] Most recent successful WORM batch is < 2 hours old
- [ ] `kubectl auth can-i get secrets -n compliance` returns `yes` for the runbook operator
- [ ] The KMS CMK ARN for the audit-signer key is captured: `aws kms describe-key --key-id alias/gtcx-audit-signer-prod`
- [ ] The current key's archive path is known: `s3://gtcx-key-archive-production-af-south-1/audit-signer/<YYYY>/`
- [ ] A new IAM principal exists for the rotation operation (separate from steady-state read), to avoid token-scope escalation per threat-model E-3

If any item is unchecked, **STOP**. Resolve the gap before proceeding.

---

## 2. Rotation Steps

### 2.1 Generate the new keypair

The generation runs in an isolated EC2 instance (not a developer laptop). The instance has no inbound network, only outbound to KMS.

```bash
# SSM-session into the rotation host
aws ssm start-session --target i-<rotation-host-id>

# Generate the new Ed25519 keypair using audit-signer's helper
node -e "
import('@gtcx/audit-signer').then(m => {
  const kp = m.generateKeypair();
  process.stdout.write(JSON.stringify({
    publicKey: Buffer.from(kp.publicKey).toString('base64'),
    privateKey: Buffer.from(kp.privateKey).toString('base64'),
  }));
});" > /tmp/new-keypair.json

# Verify the generated key works
node -e "
import('@gtcx/audit-signer').then(m => {
  const k = JSON.parse(require('fs').readFileSync('/tmp/new-keypair.json'));
  const signer = m.createSigner({ publicKey: Buffer.from(k.publicKey, 'base64'), privateKey: Buffer.from(k.privateKey, 'base64') });
  const rec = signer.signRecord({ event: 'rotation-test', timestamp: new Date().toISOString() });
  console.log('verifies:', m.verifyRecord(rec));
});"
```

The verify step must print `verifies: true`. If not, regenerate.

### 2.2 Encrypt with KMS

The private key never lands on disk in plaintext outside the rotation host's `tmpfs`:

```bash
# Extract private key, encrypt under KMS CMK, immediately remove the plaintext
PRIV=$(jq -r .privateKey /tmp/new-keypair.json)

aws kms encrypt \
  --key-id alias/gtcx-audit-signer-prod \
  --plaintext fileb://<(echo -n "$PRIV" | base64 -d) \
  --query CiphertextBlob \
  --output text > /tmp/new-private-key.ciphertext.b64

# Sanity: confirm we can decrypt it
aws kms decrypt --ciphertext-blob fileb://<(cat /tmp/new-private-key.ciphertext.b64 | base64 -d) --query Plaintext --output text > /dev/null && echo "decrypt OK"

# Wipe plaintext
shred -u /tmp/new-keypair.json
unset PRIV
```

### 2.3 Stage the new key in the production Secret

The audit-signer reads its key material from a Kubernetes Secret named `audit-signer-keys`. We add the new key alongside the old one, then atomically promote.

```bash
# Read the current Secret
kubectl -n compliance get secret audit-signer-keys -o json > /tmp/secret-current.json

# Patch in the new key (still inactive — gateway uses .data.active to pick)
NEW_CIPHERTEXT=$(cat /tmp/new-private-key.ciphertext.b64)
NEW_PUBKEY=$(jq -r .publicKey /tmp/new-keypair.json.archive 2>/dev/null || echo "set from rotation host")

kubectl -n compliance patch secret audit-signer-keys --type=json -p="[
  {\"op\":\"add\",\"path\":\"/data/staged-private-key\",\"value\":\"$NEW_CIPHERTEXT\"},
  {\"op\":\"add\",\"path\":\"/data/staged-public-key\",\"value\":\"$(echo -n "$NEW_PUBKEY" | base64)\"}
]"
```

The staged key is unused until step 2.4 promotes it.

### 2.4 Promote: gateway rolling restart with new key

The gateway picks the active key from `.data.active-private-key`. The promotion is a single atomic Secret patch followed by a rolling restart.

```bash
# Capture the prior active key for archive
PRIOR_PUB=$(kubectl -n compliance get secret audit-signer-keys -o jsonpath='{.data.active-public-key}' | base64 -d)

# Promote: staged → active
kubectl -n compliance patch secret audit-signer-keys --type=json -p='[
  {"op":"replace","path":"/data/active-private-key","value":"'"$(kubectl -n compliance get secret audit-signer-keys -o jsonpath='{.data.staged-private-key}')"'"},
  {"op":"replace","path":"/data/active-public-key","value":"'"$(kubectl -n compliance get secret audit-signer-keys -o jsonpath='{.data.staged-public-key}')"'"}
]'

# Rolling restart — gateway reads the new active key on pod boot
kubectl -n compliance rollout restart deploy/compliance-gateway
kubectl -n compliance rollout status deploy/compliance-gateway --timeout=180s
```

### 2.5 Emit the `chain.rotation` audit event

Once the rolling restart completes, one of the new pods emits a signed `chain.rotation` record that includes the prior public key as evidence of the linkage:

```bash
# Trigger via the rotation tool endpoint (operator-only, requires approval ticket)
curl -X POST https://compliance-gateway-internal.production.local/v1/audit/rotation \
  -H "Authorization: Bearer $ROTATION_TOKEN" \
  -H "X-Approval-Ticket: GTCX-<rotation-ticket>" \
  -H "Content-Type: application/json" \
  -d "{\"priorPublicKey\":\"$PRIOR_PUB\",\"reason\":\"scheduled-365d-rotation\"}"
```

The endpoint emits a single `chain.rotation` record signed with the new key, containing `priorPublicKey` as a field. Auditors verify chain continuity by seeing this record at the rotation boundary.

### 2.6 Archive the old key

The old public key is **archived, not destroyed.** Historical WORM batches must remain verifiable forever.

```bash
# Save old keys to the immutable key archive
aws s3 cp \
  /tmp/old-key-record.json \
  s3://gtcx-key-archive-production-af-south-1/audit-signer/$(date +%Y)/rotation-$(date +%Y-%m-%d).json \
  --sse aws:kms \
  --metadata "rotation-ticket=GTCX-<rotation-ticket>"

# Verify the archive is readable (the key archive bucket has Object Lock)
aws s3api head-object --bucket gtcx-key-archive-production-af-south-1 --key audit-signer/$(date +%Y)/rotation-$(date +%Y-%m-%d).json
```

### 2.7 Remove the staged slot

```bash
kubectl -n compliance patch secret audit-signer-keys --type=json -p='[
  {"op":"remove","path":"/data/staged-private-key"},
  {"op":"remove","path":"/data/staged-public-key"}
]'
```

---

## 3. Post-Rotation Verification

| Check                                           | Command                                                                                       | Expected                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Gateway pods are using the new key              | `kubectl exec ... -- curl localhost:9090/metrics \| grep audit_signer_public_key_fingerprint` | Fingerprint matches the new key's SHA-256 |
| audit-trust dashboard is green                  | Open the audit-trust Grafana dashboard                                                        | All five panels green                     |
| `verifyChain` passes on the next emitted batch  | `npx -y @gtcx/audit-signer verify --file ...`                                                 | `valid: true`                             |
| The `chain.rotation` record is in WORM          | `aws s3 ls .../tenant=internal/.../$(date +%Y/%m/%d)/`                                        | A batch from the rotation moment exists   |
| Old WORM batches still verify with archived key | `npx -y @gtcx/audit-signer verify --file <old-batch> --pubkey <archived-pubkey>`              | `valid: true`                             |

If **any** check fails, halt and engage the incident-response runbook. Do not attempt a second rotation while a verification is failing.

---

## 4. Recovery from Failed Rotation

| Failure                                       | Recovery                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Gateway pods fail to start after 2.4 promote  | Revert the active-key patch to the prior values; gateway restarts with old key; no rotation occurred                                                    |
| `chain.rotation` record emit fails (step 2.5) | Retry the endpoint. If it fails 3x, raise a P1 — the substrate is signing with the new key but lacks the documented transition record                   |
| Archive write fails (step 2.6)                | The old key is still in the active-private-key slot until step 2.7 — abort step 2.7 until archive succeeds                                              |
| Post-verification 3.x fails                   | DO NOT remove the staged slot. Investigate. May require rolling back via [audit-chain-incident-response.md](./audit-chain-incident-response.md) Sec 3.4 |

The rotation has a built-in "undo" up until step 2.7. After 2.7, undo requires another full rotation.

---

## 5. Compromise-Suspected Rotation (Emergency Path)

If the rotation is triggered by suspected key compromise, the above procedure runs but with three modifications:

1. **No 24-hour staging window.** The new key is generated, encrypted, staged, promoted, and the old key removed in a single procedure window — typically under 30 minutes.
2. **All in-flight requests are quiesced** before promotion via the gateway feature flag suspending new admissions.
3. **External counsel is engaged in parallel**, not after. Compromise-suspected rotations have a regulatory disclosure clock that starts at detection, not at completion.

The substrate's design accommodates emergency rotation because the old public key archive plus chain.rotation event preserves auditor verifiability of pre-rotation records.

---

## 6. Related

- ADR-016 — Fail-Closed Audit Signing in Production (requires key rotation on compromise)
- ADR-021 — npm Publish Discipline (the @gtcx/audit-signer used by auditors)
- [`audit-chain-incident-response.md`](./audit-chain-incident-response.md) — sibling runbook
- [`01-docs/09-security/credential-rotation-log.md`](../../security/credential-rotation-log.md) — historical rotation record
- [`01-docs/09-security/threat-model-2026-05.md`](../../security/threat-model-2026-05.md) — T-1, E-1, E-3 threat categories
