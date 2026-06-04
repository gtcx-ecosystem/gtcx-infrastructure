# Session State

> **Last updated:** 2026-06-05T20:55+02:00
> **Agent:** platform-architect (development frame)
> **Protocol compliance:** P22, P26, P27, P28 active
> **Current sprint:** Sprint 1 + Sprint 2 + Sprint 3 infra items — effectively complete
> **Sprint roadmap:** `docs/agile/sprints/sprint-2026-06-phase3-roadmap.md`

---

## Closed this session

| ID | What | Commit |
|----|------|--------|
| XR-405 | Sovereign staging KMS signing (INF-86) | `b3ef031`, `6646bf9`, `a9ca4ce` |
| ER-2-04 | Compliance-gateway staging deploy unblock | `d05d089` |
| IR-2.2 | AI SDK v5→v6 migration | `48b3366` |
| Sprint roadmap | Phase 3 June 2026 hardening + external readiness | `178dc79` |
| P1-LINT | Compliance-gateway ESLint errors (34 → 0) | `d78cb7b` |
| S1-11 | Secret scanning CI gate | `5496fc5` |
| S1-12 | Rate limiting load-test evidence | `64dd1be` |
| S1-13 | Cross-repo health probe + CI workflow | `c7f601c` |
| S2-01 | FIPS 140-3 feature flag (ECDSA P-256) | `931f921` |
| S2-02 | Audit sink production guard | `dda7719` |
| S2-03 | Disk queue restart survival tests | `0bd7792` |
| S3-08 | Cloudflare Tunnel migration | `fdab027` |
| S2-05 | SLSA Build L3 gate | `5655309` |
| S3-10 | P22 CI smoke (already in CI) | `5655309` |
| validate-all | Empty-catch allowlist + evidence index files | `fb46749` |
| IR-3.1 | WORM upload workflow (post-CI job, OIDC, staging bucket) | `ci.yml` |

---

## Sprint 1: Infra Hardening — In Progress (Week of 2026-06-05)

**Roadmap:** `docs/agile/sprints/sprint-2026-06-phase3-roadmap.md` (revamped `bea57b7`)

### Done

| Story | Title | Commit |
|-------|-------|--------|
| S1-01 | Kustomize selector immutability | `b1615d0` |
| S1-03 | ioredis missing | `0292959` |
| S1-04 | AUDIT_SEAL_SECRET | — |
| S1-05 | Terraform IRSA drift | `0c72072` |
| S1-06 | Production IRSA trust cleanup | `f90518b` + verified live (2 statements) |
| S1-07 | Kustomize secret collision pattern | `ded6d9b` |
| S1-08 | ER-1-08 infra hub log row | `f8e1425` |
| S1-09 | Lint debt (compliance-gateway) | `d78cb7b` |
| S1-09b | Lint scripts — all workspace packages | `a95d554` |
| S1-10 | Coverage honesty | `3962176` |
| S1-11 | Secret scanning CI gate | `5496fc5` |
| S1-12 | Rate limiting — `/audit/*` throttling | `64dd1be` |
| S1-13 | Runtime cross-repo integration tests | `c7f601c` |

### In Progress / Pending

| Story | Title | Status | Next Action |
|-------|-------|--------|-------------|
| S1-02 | TypeORM entity/schema drift | **`done`** (phase 1) | 4 critical tables in 01-schema.sql; K8s Jobs deprecated; phase 2 deferred to platforms S2-07 |
| S2-04 | PRD-002 Tier B — TradePass DID resolver | `in_progress` | Multibase support implemented (`edb0db9`). Protocols contract delivered 2026-06-02. Remaining: seed operator + verify resolution (needs staging API key) |
| S2-08 | Cost router production (ER-2) | **`done`** (infra) | Cost router live on intelligence-staging (`dac128d`). Waiting on gtcx-intelligence credentialed inference smoke + cost-stats capture (intelligence/baseline-os owned) |
| S2-09 | INF-86 pilot ceremony | `hold` | Waiting for XR-401 unblock |
| S2-10 | Verifier DNS (XR-507 / S3-09) | **`done`** (2026-06-05) | CNAME + Pages custom domain; smoke 200 + pepper |
| S2-11 | Supabase unpause (XR-508 / S3-10) | **`done`** (2026-06-05) | Project active; `financing_applications` REST 200 |
| S2-13 | Pen-test SOW signature | `intake ready` | Human SOW signature pending (EXT-INF-002) |
| S3-06 | Publish primitives | `done` | `publish-npm` job in slsa-provenance.yml; tag-triggered; gate in validate-all; needs NPM_TOKEN secret |
| S3-07 | DR live RDS restore | `done` | Live PITR staging operational 2026-06-04 — `docs/audit/evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json` (RTO ~20m, RPO 0); side instance deleted |
| INT-S9-01 | Wire #2 POST /v1/evidence/submit | `infra unblocked` | Routing verified + TRADEPASS_AUTH_TOKEN wired (optional); protocols endpoint + secret population remaining |

### Sprint 2 + Sprint 3: Security + Production Hardening — Done

| Story | Title | Status | Evidence |
|-------|-------|--------|----------|
| S2-01 | FIPS 140-3 feature flag | `done` | `fips-mode.mjs` + signer ECDSA P-256; 48 tests pass; gate in validate-all |
| S2-02 | Mutable audit default path | `done` | Production guard: AUDIT_SINK=stdout throws; defaults to NATS; gate in validate-all |
| S2-03 | Durable offline queue | `done` | Restart + crash recovery tests (2 new); 23 disk-queue tests pass; gate in validate-all |
| S2-05 | SLSA Build L3 | `done` | Workflow + npm provenance configured; slsa-l3-gate in validate-all |
| S3-08 | Cloudflare Tunnel migration | `done` | Ingress deprecated; tunnel routes confirmed; check updated + tests pass |
| S3-10 | P22 W4 core CI smoke | `done` | agent:next-work already in CI workflow (ci.yml) |

---

## W2-OPS-001 — terminal-os staging EKS deployment — DONE (2026-06-04)

### Root cause
- ECR image was ARM64 (built on Apple Silicon); EKS nodes are AMD64 t3.medium
- App crashed on boot due to missing `DATABASE_URL` and `RATE_LIMIT_REDIS_REST_URL`/`TOKEN`

### Fix
1. **EC2 build instance** (`i-084647e802ef9834b`) — t3.xlarge, Amazon Linux 2, Docker
   - Built `linux/amd64` image with `DOCKER_BUILD=1` standalone output
   - Pushed `gtcx-terminal-os:latest` to ECR
2. **Secrets** — updated `gtcx/terminal-os/staging/api-keys` in AWS SM:
   - `DATABASE_URL` → `gtcx-staging-audit` Postgres (real connection)
   - `RATE_LIMIT_REDIS_REST_URL`/`TOKEN` → dummy values (runtime falls back to in-memory; acceptable for single-replica staging)
   - Existing keys preserved: `COMPLIANCE_OS_TERMINAL_API_KEY`, `AUTH_SECRET`
3. **K8s manifests** — updated in `infra/kubernetes/overlays/staging/terminal-os/`:
   - `deployment.yaml`: `NEXT_PUBLIC_APP_URL` → `https://terminal-staging.gtcx.trade`; strategy `maxUnavailable: 1, maxSurge: 0`; reduced requests to `cpu: 100m, memory: 256Mi` (cluster is oversubscribed)
   - `service.yaml`: added ALB health check annotations (`/api/health`)
   - `ingress.yaml`: new ALB ingress sharing `gtcx-staging-api` group; routes `terminal-staging.gtcx.trade` → service:3000
   - `kustomization.yaml`: includes `ingress.yaml`
4. **DNS + TLS**:
   - Cloudflare CNAME `terminal-staging.gtcx.trade` → ALB hostname (non-proxied)
   - ACM certificate requested + validated for `terminal-staging.gtcx.trade`
   - Ingress certificate-arn updated with new cert

### Verification
```bash
curl -sS https://terminal-staging.gtcx.trade/api/health
# → {"status":"ok","service":"fifty-four","version":"dev",...}

kubectl get pod -n terminal-os-staging
# → terminal-os-856dd58b54-hrhq6   1/1   Running   0   61m
```

### Open / deferred
- **GitHub Actions CI** (`docker-build.yml`): OIDC auth still broken; EC2 build is fallback
- **Cluster capacity**: t3.medium nodes at 90-99% CPU request; terminal-os scaled to 100m/256Mi requests. Needs node upgrade or autoscaling review
- **Redis REST**: Dummy values work for staging #17; real Upstash/Redis REST needed for production / multi-replica staging
- **Ingress hostname**: `terminal-staging.gtcx.trade` is canonical per coordination doc; `/api/ready` returns 403 from WAF (expected — external_apis degraded in readiness probe)

## Active blockers (external)

| ID | Blocker | Owner |
|----|---------|-------|
| EXT-INF-002 | Pen-test SOW signature | Leadership |
| EXT-INF-013 | SOC 2 Type I auditor | CISO + Finance |
| EXT-INF-014 | ZWCMP DPA + pilot agreement | Founder / GTM |
| EXT-INF-015 | Indemnified-SLA legal review | Legal / GTM |

---

## XR-EO-006 / INF-86 IRSA + KMS Sovereign Signing — 2026-06-06

### Finding
Production KMS key policy for `alias/gtcx-production-sovereign-gh-bog` only allowed
the production IRSA role (`gtcx-production-platforms-irsa`) in `signing_role_arns`.
Staging sovereign pods use the same key alias but assume the staging IRSA role
(`gtcx-staging-platforms-irsa`), which would be denied by KMS.

### Fix
- `data.aws_iam_role.staging_platforms` added to production main.tf
- `module.kms_sovereign_signing.authorities.gh-bog.signing_role_arns` now includes
  both production and staging role ARNs
- HOLD comment updated to UNBLOCKED (algorithm confirmed ECC_NIST_P256)
- Commit: `c36a5f6`

### Verification
- Terraform validate: production ✅, staging ✅
- validate-all: 46/46 gates ✅

### INF-86 status — UNBLOCKED (2026-06-06)
- XR-401 A/B/C: DONE — algorithm sign-off, custodian roster, ceremony authorization
- Pilot (gh-bog): Fully unblocked for engineering and agent custody
- GitHub #61: Pilot thread closed; issue stays open for 5-issuer program scale
- Post-pilot Class S items (not blockers): H-03 sovereign CSP countersign, XR-518 batch ceremonies
- Witness: `from-gtcx-protocols-inf-86-governance-unblock-2026-06-06.md`
- gtcx-protocols commit `6e3baea9` (governance unblock) already on origin/main

---

## Context refresh checklist

- [ ] Re-read `docs/agile/sprints/sprint-2026-06-phase3-roadmap.md`
- [ ] Re-check `git status`
- [ ] Re-read `.baseline/memory/pitfalls.md`
- [ ] Run `pnpm agent:next-work` to confirm next story
