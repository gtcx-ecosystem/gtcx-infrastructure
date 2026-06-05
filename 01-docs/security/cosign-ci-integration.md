---
title: 'Cosign Image Signing — CI Integration Guide'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'infrastructure', 'frontend', 'governance']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Cosign Image Signing — CI Integration Guide

Exact changes required in `.github/workflows/build-push-ecr.yml` to enable
keyless Cosign signing of all container images pushed to ECR.

## 1. Add Required Permissions

The workflow already has `id-token: write` (required for OIDC keyless signing).
No permission changes needed.

## 2. Install Cosign (add after the ECR login step)

Add this step in the `build-push` job, immediately after the "Login to ECR" step:

```yaml
- name: Install Cosign
  uses: sigstore/cosign-installer@v3
```

## 3. Sign Images After Push (add after the "Push to ECR" step)

Replace or extend the existing "Push to ECR" step to sign each image
immediately after push. Add as a new step after the push:

```yaml
- name: Sign images with Cosign (keyless)
  env:
    COSIGN_EXPERIMENTAL: '1'
  run: |
    SHA_SHORT="${GITHUB_SHA::8}"
    REGISTRY="${{ steps.ecr-login.outputs.registry }}"
    IFS=',' read -ra REPOS <<< "${{ matrix.service.ecr_repos }}"
    for REPO in "${REPOS[@]}"; do
      IMAGE="${REGISTRY}/${REPO}:${SHA_SHORT}"

      # Get the image digest for deterministic signing
      DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "${IMAGE}" 2>/dev/null \
        || echo "${IMAGE}")

      # Keyless sign via Fulcio + Rekor (OIDC identity from GitHub Actions)
      cosign sign --yes "${DIGEST}"

      echo "- Signed: \`${DIGEST}\`" >> "$GITHUB_STEP_SUMMARY"
    done
```

### Why keyless?

- No key management overhead — identity comes from the GitHub Actions OIDC token
- Fulcio issues a short-lived certificate; Rekor provides an immutable transparency log
- The Kyverno admission policy (`require-signed-images.yaml`) verifies the OIDC
  issuer (`https://token.actions.githubusercontent.com`) and subject
  (`https://github.com/gtcx-ecosystem/*`) match

## 4. Verify Signature Immediately (add after the sign step)

```yaml
- name: Verify image signatures
  run: |
    SHA_SHORT="${GITHUB_SHA::8}"
    REGISTRY="${{ steps.ecr-login.outputs.registry }}"
    IFS=',' read -ra REPOS <<< "${{ matrix.service.ecr_repos }}"
    for REPO in "${REPOS[@]}"; do
      IMAGE="${REGISTRY}/${REPO}:${SHA_SHORT}"
      cosign verify \
        --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
        --certificate-identity-regexp="https://github.com/gtcx-ecosystem/.*" \
        "${IMAGE}"
      echo "- Verified: \`${IMAGE}\`" >> "$GITHUB_STEP_SUMMARY"
    done
```

## 5. Attach SBOM Attestation (add after the verify step)

The workflow already generates an SBOM (`sbom-${{ matrix.service.name }}.cdx.json`).
Attach it as an in-toto attestation on the image:

```yaml
- name: Attest SBOM to image
  run: |
    SHA_SHORT="${GITHUB_SHA::8}"
    REGISTRY="${{ steps.ecr-login.outputs.registry }}"
    FIRST_REPO=$(echo "${{ matrix.service.ecr_repos }}" | cut -d',' -f1)
    IMAGE="${REGISTRY}/${FIRST_REPO}:${SHA_SHORT}"

    cosign attest --yes \
      --type cyclonedx \
      --predicate "sbom-${{ matrix.service.name }}.cdx.json" \
      "${IMAGE}"

    echo "- SBOM attested: \`${IMAGE}\`" >> "$GITHUB_STEP_SUMMARY"
```

## 6. Step Ordering Summary

The final step order in the `build-push` job should be:

1. Checkout infrastructure repo
2. Checkout source repos (intelligence, protocols, platforms)
3. Configure AWS credentials
4. Login to ECR
5. **Install Cosign** (new)
6. Build image
7. Set primary ECR repo
8. Trivy security scan
9. Generate container SBOM (CycloneDX)
10. Upload container SBOM
11. Upload Trivy results
12. Push to ECR
13. **Sign images with Cosign** (new)
14. **Verify image signatures** (new)
15. **Attest SBOM to image** (new)

## 7. ECR Configuration Prerequisite

ECR repositories must have immutable tags enabled (already the case) and must
**not** block unrecognized artifact types. Cosign stores signatures as OCI
artifacts alongside the image. Verify with:

```bash
aws ecr describe-repositories \
  --repository-names gtcx-agx \
  --query 'repositories[0].imageScanningConfiguration'
```

If the ECR repository has a lifecycle policy that deletes untagged images,
ensure it excludes Cosign signature tags (pattern: `sha256-*.sig`).
