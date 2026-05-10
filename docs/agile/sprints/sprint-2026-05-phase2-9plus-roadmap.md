# Sprint Phase 2: 9+ Production-Readiness Roadmap

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

**Goal:** Close the 5 remaining trust-bearing audit gaps to move `gtcx-infrastructure` from 7.5 → 9+.

**Target completion:** 4–6 weeks (can be parallelized across 3 work streams)
**Definition of Done:** Each item has committed, tested, pushed code; CI passes; evidence artifacts uploaded.

---

## Work Stream A: Cryptographic Identity (DID Verification)

**Owner:** Security / Crypto engineer
**Estimated effort:** 2–3 weeks
**Risk:** High — depends on external DID resolver availability

### Item 1: Replace DID Stub with Real Cryptographic Verification

**Current state:** `verifyDidSignature` returns `false` for all requests. `verifyDidSignatureStubBypass` is required for tests.

**Target state:** Production can verify ES256 JWT signatures over the canonical envelope hash using a resolved DID document.

#### Approach A1 (Preferred): Integrate `@gtcx/crypto` when available

- Wait for `@gtcx/crypto` package to publish DID resolver + JWT verifier
- Replace `verifyDidSignature` body with:
  1. `resolveDid(integrity.did)` → DID document
  2. `extractPublicKey(didDoc, integrity.keyId)` → JWK
  3. `verifyJwt(integrity.signature, jwk, { audience: integrity.audience })`
  4. Validate `jwt.payload.envelopeHash === integrity.envelopeHash`

#### Approach A2 (Interim — if `@gtcx/crypto` is >4 weeks out)

Use `jose` (npm: `jose`) — a production-grade, zero-dependency JWS/JWT library (Mozilla, widely audited).

```javascript
import { importJWK, jwtVerify } from 'jose';

export async function verifyDidSignature(integrity) {
  // 1. Structural validation (keep existing)
  // 2. Resolve DID → fetch DID document from well-known endpoint
  // 3. Extract public key JWK from DID document by keyId
  // 4. Verify JWT signature
  const { payload } = await jwtVerify(integrity.signature, publicKey, {
    clockTolerance: 30,
    audience: integrity.audience,
  });
  // 5. Verify payload envelopeHash matches integrity.envelopeHash
  return payload.envelopeHash === integrity.envelopeHash;
}
```

**Acceptance criteria:**

- [ ] Unit test: valid JWT over matching envelope hash → `true`
- [ ] Unit test: valid JWT over tampered envelope hash → `false`
- [ ] Unit test: expired JWT → `false`
- [ ] Unit test: wrong audience → `false`
- [ ] Integration test: mobile-signed request accepted by replay-guard server
- [ ] `REPLAY_GUARD_ALLOW_STUB_SIGNATURE` env var removed from CI and tests
- [ ] Performance test: verifyDidSignature completes in <50ms p99

**Dependencies:**

- `@gtcx/crypto` package OR `jose` npm package
- DID resolver endpoint (e.g., `https://did.gtcxprotocol.org/1.0/identifiers/{did}`)
- Test DID + private key for CI fixtures

**Risk mitigation:**

- If DID resolver is down, cache resolved DID documents in Redis with 1h TTL
- If key rotation occurs, stale cache returns `false` (fail-closed), forcing client retry with new key

---

## Work Stream B: Infrastructure Hardening

**Owner:** Platform / DevOps engineer
**Estimated effort:** 2–3 weeks
**Risk:** Medium — requires staging cluster access

### Item 2: Implement mTLS with Linkerd

**Current state:** ADR-007 approved; no sidecars running.

**Target state:** All pods in `gtcx` and `intelligence` namespaces have Linkerd sidecars; `linkerd viz stat` shows TLS=ok for all meshed traffic.

#### Phase B1: Staging Validation (Week 1)

```bash
# 1. Install Linkerd CLI
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check

# 2. Inject data plane into staging namespaces
kubectl annotate ns gtcx-staging linkerd.io/inject=enabled
kubectl annotate ns intelligence-staging linkerd.io/inject=enabled

# 3. Restart deployments to pick up sidecars
kubectl rollout restart deployment -n gtcx-staging
kubectl rollout restart deployment -n intelligence-staging

# 4. Verify
linkerd viz stat deploy -n gtcx-staging
# Expected: all rows show MESHED=yes, SUCCESS=100%, TLS=ok
```

#### Phase B2: Production Rollout (Week 2)

- Repeat Phase B1 for `gtcx-production` and `intelligence-production`
- Roll out one namespace at a time with 1h observation window
- Monitor `linkerd viz top` for latency spikes
- If p99 latency increases >10ms, investigate and tune Linkerd proxy resources

#### Phase B3: Lockdown Policy (Week 3)

- Enable `LINKERD2_PROXY_TLS_ACCEPT_` and mesh-wide mTLS
- Add `ServerAuthorization` resources for service-to-service allowlists
- Document expected mesh topology in `docs/architecture/mesh-topology.md`

**Acceptance criteria:**

- [ ] `linkerd check` passes in staging and production
- [ ] `linkerd viz stat deploy -n gtcx` shows TLS=ok for all deployments
- [ ] `linkerd viz tap deploy/gtcx-replay-guard` shows encrypted traffic
- [ ] No p99 latency regression >10ms vs pre-mesh baseline
- [ ] Rollback procedure documented: `kubectl annotate ns gtcx linkerd.io/inject-`

**Dependencies:**

- Cluster admin access to install Linkerd control plane
- cert-manager or Linkerd's built-in identity issuer
- Staging environment available for soak testing

**Risk mitigation:**

- Staging soak test for 1 week before production
- Rolling restart per-deployment (not namespace-wide blast)
- Pre-allocated sidecar resource limits: 100m CPU / 128Mi mem

---

### Item 3: Purge Terraform Binaries from Git History

**Current state:** `.github/workflows/ci.yml` rejects new Terraform artifacts; historical binaries remain in commit graph.

**Target state:** `git log --all --full-history -- '**/.terraform/**'` returns empty.

#### Execution Plan

```bash
# 1. Coordinate team freeze — everyone pushes current work
# 2. Admin creates backup fork
git clone https://github.com/gtcx-ecosystem/gtcx-infrastructure.git gtcx-infrastructure-purge
cd gtcx-infrastructure-purge

# 3. Run filter-repo
git filter-repo \
  --path-glob 'infra/terraform/**/*.tfstate*' \
  --path-glob 'infra/terraform/**/.terraform/**' \
  --path-glob 'infra/terraform/**/.terraform.lock.hcl' \
  --invert-paths

# 4. Verify
git log --all --full-history -- '**/.terraform/**'
git log --all --full-history -- '**/*.tfstate*'

# 5. Force-push (requires disabling branch protection temporarily)
git push origin --force --all
git push origin --force --tags

# 6. Notify team to re-clone
```

**Acceptance criteria:**

- [ ] `git log --all --full-history -- '**/.terraform/**'` returns empty
- [ ] `git log --all --full-history -- '**/*.tfstate*'` returns empty
- [ ] Repo size reduced (check `git count-objects -vH` before/after)
- [ ] CI still passes after history rewrite
- [ ] All open PRs rebased onto rewritten history

**Dependencies:**

- Repo admin access to disable branch protection for force-push
- Team coordination (everyone must re-clone)
- Backup of original repo before purge

**Risk mitigation:**

- Backup fork created before any destructive operation
- Perform during low-activity window (weekend)
- Run `git-filter-repo` in a fresh clone, not the working directory

---

### Item 4: Audit DB Write-Failure Alerts

**Current state:** `postgres-exporter` sidecar monitors audit DB; no Prometheus alert rules for write failures or event volume drops.

**Target state:** AlertManager fires `critical` if audit DB is unreachable or event volume drops >50% for 5m.

#### Implementation Plan

Add to `infra/monitoring/alerts/audit-trust-alerts.yml`:

```yaml
- alert: AuditDBWriteFailure
  expr: |
    pg_up{job="gtcx-postgres-audit-exporter"} == 0
  for: 1m
  labels:
    severity: critical
    team: platform
  annotations:
    summary: 'Audit PostgreSQL is down'
    description: 'The audit database (gtcx-postgres-audit) has been unreachable for >1 minute. Replay events may be lost.'

- alert: AuditEventVolumeDrop
  expr: |
    (
      rate(replay_protection_total[5m])
      > 0
    )
    and
    (
      rate(pg_stat_user_tables_n_tup_ins{relname="replay_events"}[5m])
      == 0
    )
  for: 5m
  labels:
    severity: warning
    team: platform
  annotations:
    summary: 'Audit event volume dropped'
    description: 'Replay protection is accepting requests but no rows are being inserted into gtcx_audit.replay_events. Check postgres-sink connectivity.'
```

**Acceptance criteria:**

- [ ] `promtool check rules infra/monitoring/alerts/audit-trust-alerts.yml` passes
- [ ] Alert definitions committed and deployed to AlertManager
- [ ] Alert routing configured: `critical` → PagerDuty/Slack #incidents; `warning` → Slack #alerts
- [ ] Simulated test: scale postgres-audit to 0 replicas → alert fires within 2m

**Dependencies:**

- AlertManager configured in cluster
- Slack/PagerDuty webhook secrets available
- `postgres_exporter` metrics already scraping (already in place)

**Risk mitigation:**

- Use `warning` (not `critical`) for volume-drop to avoid alert fatigue during low-traffic periods
- Exclude `skipHashVerification: true` requests from volume-drop check if needed

---

## Work Stream C: Deployment Safety

**Owner:** SRE / Release engineer
**Estimated effort:** 1–2 weeks
**Risk:** Low — uses existing scripts

### Item 5: Prove Canary/Rollback End-to-End in CI

**Current state:** `dr-test.sh` runs in CI (backup/restore). `capture-rollback-evidence.sh` exists but is not exercised after a simulated failed deployment.

**Target state:** CI pipeline intentionally deploys a broken image, confirms rollback, and uploads rollback evidence.

#### Implementation Plan

Extend `.github/workflows/dr-test.yml` with a `canary-rollback` job:

```yaml
canary-rollback:
  runs-on: ubuntu-latest
  environment: staging
  steps:
    - uses: actions/checkout@v6

    - name: Deploy known-good image
      run: |
        kubectl set image deployment/gtcx-replay-guard \
          replay-guard=gtcx/replay-guard:v0.1.0-stable \
          -n gtcx-staging
        kubectl rollout status deployment/gtcx-replay-guard -n gtcx-staging

    - name: Deploy broken image (simulated failure)
      run: |
        kubectl set image deployment/gtcx-replay-guard \
          replay-guard=gtcx/replay-guard:v0.1.0-broken-exit-1 \
          -n gtcx-staging
        # Expect rollout to fail ( readinessProbe will catch it )
        kubectl rollout status deployment/gtcx-replay-guard -n gtcx-staging --timeout=60s || true

    - name: Capture rollback evidence
      run: |
        bash infra/scripts/capture-rollback-evidence.sh staging \
          --previous-revision=v0.1.0-stable \
          --failed-revision=v0.1.0-broken-exit-1 \
          --reason="CI canary rollback test"

    - name: Rollback to stable
      run: |
        kubectl rollout undo deployment/gtcx-replay-guard -n gtcx-staging
        kubectl rollout status deployment/gtcx-replay-guard -n gtcx-staging

    - name: Upload rollback evidence
      uses: actions/upload-artifact@v4
      with:
        name: rollback-evidence-${{ github.run_id }}
        path: infra/security/reports/rollback-evidence/staging/
        retention-days: 90
```

**Acceptance criteria:**

- [ ] CI job deploys broken image, readinessProbe fails, rollout stalls
- [ ] `capture-rollback-evidence.sh` runs and produces `rollback-evidence.json`
- [ ] Rollback undo restores stable revision
- [ ] Post-rollback health check passes
- [ ] Evidence artifact uploaded to GitHub Actions
- [ ] Job runs weekly (same schedule as DR test) + on-demand via `workflow_dispatch`

**Dependencies:**

- Staging cluster with `kubectl` access
- Broken image `gtcx/replay-guard:v0.1.0-broken-exit-1` published to registry
- `capture-rollback-evidence.sh` dependencies: `kubectl`, `jq`, `curl`

**Risk mitigation:**

- Run only in staging (never production)
- Broken image exits immediately with code 1 so readinessProbe fails fast
- Rollback undo is idempotent; if already rolled back, it no-ops

---

## Parallelization & Dependencies Graph

```
Week 1:
  [A1] DID interim with jose (or wait for @gtcx/crypto)
  [B1] Linkerd staging install + validation
  [C1] Build broken image + canary-rollback CI job scaffolding

Week 2:
  [A1] DID unit + integration tests
  [B2] Linkerd production rollout (if staging stable)
  [C1] First canary-rollback CI run in staging

Week 3:
  [A1] DID performance test + remove stub bypass
  [B3] Linkerd mesh policy + lockdown
  [B4] Audit DB alerts deployed
  [C1] Canary-rollback runs weekly

Week 4:
  [B5] Terraform history purge (team freeze weekend)
  [All] Final integration test + evidence capture
```

**Critical path:** [B1] → [B2] → [B3] (Linkerd staging must be stable before production)
**Independent tracks:** [A1] DID, [B4] alerts, [C1] canary-rollback can all run in parallel

---

## Evidence Package for Next Audit

After completing this sprint, the auditor should receive:

1. **DID verification:** Unit test report showing JWT verify pass/fail matrix
2. **mTLS:** Screenshot of `linkerd viz stat` showing TLS=ok for all deployments
3. **Terraform purge:** `git log` output proving no `.terraform/` in history
4. **Audit alerts:** AlertManager rule definitions + simulated fire test logs
5. **Canary/rollback:** CI run logs + `rollback-evidence.json` artifact from intentional failure

---

## Rollback Plan

If any item destabilizes production:

1. **DID crypto bug:** Set `REPLAY_GUARD_ALLOW_STUB_SIGNATURE=true` temporarily; revert commit
2. **Linkerd latency spike:** `kubectl annotate ns gtcx linkerd.io/inject-` + rollout restart
3. **Alert fatigue:** Silence AuditEventVolumeDrop via AlertManager; tune threshold
4. **Canary CI broken:** Disable `canary-rollback` job in `.github/workflows/dr-test.yml`
