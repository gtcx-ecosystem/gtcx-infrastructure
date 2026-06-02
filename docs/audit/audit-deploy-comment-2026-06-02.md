# Audit Deploy Acceptance Evidence — Infra #50–#52

> Generated: 2026-06-02T09:04:00Z  
> Commit: `a645389`  
> Repo: `gtcx-infrastructure`  
> Author: agent (M2 Hardening continuity)

## Current State

| Endpoint              | Status  | Latency | Notes                                                       |
| --------------------- | ------- | ------- | ----------------------------------------------------------- |
| `POST /audit/bundles` | **404** | ~174ms  | Ingress routes exist; compliance-gateway image not deployed |
| `POST /audit/query`   | **404** | ~91ms   | Same root cause                                             |

**Root cause identified:** `compliance-gateway` was missing from the `build-push-ecr.yml` CI matrix. The staging overlay references image tag `audit-3437db4-amd64`, but no automated workflow was building or pushing compliance-gateway images to ECR.

## Fixes Applied (in-repo)

### 1. CI — Add compliance-gateway to ECR build matrix

**File:** `.github/workflows/build-push-ecr.yml`

Added matrix entry:

```yaml
- name: compliance-gateway
  dockerfile: tools/compliance-gateway/Dockerfile
  context_dir: .
  target: ''
  ecr_repos: compliance-gateway
  source_repos: ''
```

- Builds from repo root (Dockerfile needs `package.json`, `pnpm-lock.yaml`, workspace files)
- Pushes immutable SHA tag to `348389439381.dkr.ecr.af-south-1.amazonaws.com/compliance-gateway:${SHA_SHORT}`
- Signs image with Cosign (keyless via Fulcio/Rekor)
- Generates SBOM (CycloneDX) + Trivy SARIF

### 2. CI — Auto-update staging kustomization on every build

**File:** `.github/workflows/build-push-ecr.yml`

Extended the `update-manifests` job to also patch `infra/kubernetes/overlays/staging/kustomization.yaml`:

```bash
cd infra/kubernetes/overlays/staging
kustomize edit set image \
  "${REGISTRY}/compliance-gateway=${REGISTRY}/compliance-gateway:${SHA_SHORT}"
```

This ensures staging always receives the latest compliance-gateway image when `main` changes.

### 3. Local verification — Docker build passes

```bash
docker build -f tools/compliance-gateway/Dockerfile -t compliance-gateway:test-local .
# Result: BUILD SUCCESS (multi-stage, node:20-alpine, ~30s)
```

### 4. K8s manifests — already correct

- **Ingress:** `infra/kubernetes/overlays/staging/ingress.yaml` routes `/audit` prefix → `compliance-gateway-staging:8500`
- **Deployment:** `infra/kubernetes/base/services/compliance-gateway.yaml` defines container port 8500, `/health` probes
- **Service:** `compliance-gateway-staging` ClusterIP on port 8500

## Operator Steps to Complete Deploy

1. **Trigger build:** Merge this PR / push to `main` → `build-push-ecr.yml` runs → image pushed + staging tag updated
2. **Trigger deploy:** Run `.github/workflows/deploy-staging.yml` (or wait for auto-trigger on K8s manifest changes)
3. **Verify:** Re-run `node scripts/staging-audit-probe.mjs`
   - Expected: status ≠ 404 (likely 400/405/503 until signed bundle + TradePass resolver are wired)
4. **Acceptance criteria for #50–#52:**
   - [ ] `POST /audit/bundles` returns non-404
   - [ ] `POST /audit/query` returns non-404
   - [ ] `pnpm staging:readiness -- --json` (gtcx-mobile) shows both endpoints green

## Cross-repo Blockers Remaining

| Blocker                  | Status                  | Unblocks                      |
| ------------------------ | ----------------------- | ----------------------------- |
| TradePass DID resolver   | ⬜ gtcx-protocols S4-03 | Signed bundle acceptance test |
| Signed audit bundle test | ⬜ needs resolver       | Full `/audit/bundles` 200 OK  |

## Agent Attestation

- [x] Root cause identified (missing CI matrix entry)
- [x] CI workflow patched
- [x] Docker build verified locally
- [x] Staging manifest auto-update wired
- [x] K8s ingress + service verified correct
- [ ] Image pushed to ECR (requires CI run on `main`)
- [ ] Staging deploy executed (requires operator / auto-trigger)
