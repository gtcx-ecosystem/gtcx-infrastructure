# Session State

> **Last updated:** 2026-06-05T12:00+02:00
> **Agent:** platform-architect (development frame)
> **Protocol compliance:** P22, P26, P27, P28 active
> **Current sprint:** Sprint 1 + Sprint 2 + Sprint 3 infra items — effectively complete
> **Sprint roadmap:** `01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md`

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

**Roadmap:** `01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md` (revamped `bea57b7`)

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
| S3-07 | DR live RDS restore | `done` | Live PITR staging operational 2026-06-04 — `01-docs/05-audit/evidence/rds-restore/rds-restore-operational-staging-20260604-080937.json` (RTO ~20m, RPO 0); side instance deleted |
| IR-3.5 | Refresh DR fire-drill dated artifact | `done` | Updated from 2026-05-31 structural placeholder to 2026-06-04 live evidence; `01-docs/05-audit/dr-fire-drill-evidence-2026-06-04.md` |
| IR-5.1 | Cross-repo-contract token | `done` | Scoped `cross-repo-contract.yml` to infra-only matrix; external repos commented out pending `GTCX_REPO_TOKEN` secret provisioning |
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
3. **K8s manifests** — updated in `04-ship/kubernetes/overlays/staging/terminal-os/`:
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

- [ ] Re-read `01-docs/05-audit/agile/sprints/sprint-2026-06-phase3-roadmap.md`
- [ ] Re-check `git status`
- [ ] Re-read `.baseline/memory/pitfalls.md`
- [ ] Run `pnpm agent:next-work` to confirm next story

## Session bootstrap (2026-06-05 17:47:13 UTC)

- **Command:** `agent start` (baseline-os repo-session-core)
- **Repo:** gtcx-infrastructure
- **Next work:** unknown
- **Blocked:** no
- **Git:** 70 changed path(s)


## Session — 2026-06-05 (continued)

### Done this continuation

| ID | What | Commit |
|----|------|--------|
| LAUNCH-PLAN-01 | Reconcile execution-roadmap + cross-repo work register | `00a8bbf` |
| LAUNCH-PLAN-02 | Refresh auto-dev-state for launch/GTM | `9f8dc49` |
| LAUNCH-PLAN-03 | Global South 10x plan status row update | `9f8dc49` |
| GTM-AUDIT | Lane-5 forensic completeness audit | `00a8bbf` |
| S1-02b | Retire deprecated ad-hoc K8s migration Jobs | `44ff1d4` |

### State

- **Implement queue:** Drained (0 items)
- **Plan queue:** Drained (LAUNCH-PLAN-01/02/03 done)
- **validate-all:** 46/46 gates pass
- **Cross-repo:** XR-401/405/507/508 done; XR-402 ready; EXT-INF-002/013/014/015/016 remain human blockers
- **Next computed:** IR dimension lifts (IR-3.4, IR-4.1, IR-5.2, IR-6.4) or external/human actions

### W2-E2E UNBLOCK — 2026-06-05

**Root cause:** `COMPLIANCE_OS_TERMINAL_API_KEY` drift between terminal-os staging AWS SM secret and compliance-os-w2-secrets K8s secret. Different 44-byte values caused cross-origin 401.

**Fix:**
1. Read compliance-os canonical value from `compliance-os-w2-secrets` (K8s, compliance-os-staging)
2. Updated AWS SM `gtcx/terminal-os/staging/api-keys` — new VersionId `c3f22785-9f93-41ee-b354-4a3e66b4376f`
3. ESO sync verified: `terminal-os-secrets` now byte-equal to `compliance-os-w2-secrets`
4. Restarted terminal-os deployment — rollout successful
5. Pod env verified: 44 bytes, first 8 hex `5655424954562f49` (matches)
6. Health check: `https://terminal-staging.gtcx.trade/api/health` → 200

**Next:** compliance-os runs `pnpm w2:terminal-patch-proof`, terminal-os runs `pnpm workflow:staging-receiver-smoke`.

---

## Session — 2026-06-05 (baseline witness)

### State

| Signal | Value |
|--------|-------|
| P22 | `backlogClear: true` — WITNESS mode |
| Hub #17 | **closed** — prod ingress + PATCH proof; baseline-os `7d98352b2` |
| Hub #18 | **open** — prod Postgres persistence (sibling) |
| Prod probes | `compliance.gtcx.trade` **307** · `terminal.gtcx.trade/api/health` **200** |
| `validate-all` | **49/50** — Docs Standard fail (27 link violations; agent-sync untracked dirs) |
| Head | `e72c728` (hub #17 witness closed) |

### Witness fixes (this session)

- `01-docs/04-ops/runbooks/terminal-os-prod-cloudflare-dns.md` — frontmatter
- `01-docs/04-ops/human-gate-navigation.md` — sibling-repo link targets
- `01-docs/05-audit/agile/roadmap.md` — frontmatter

### Next (Class R)

- Docs Standard drift: 27 violations (mostly `01-docs/01-agents/*` + cross-repo `gtcx-agentic` links) — baseline or fix in dedicated hygiene pass
- EXT-INF-002 pen-test SOW — Class S parallel (not repo-blocked)

---

## Baseline session — 2026-06-05 (fresh)

| Signal | Value |
|--------|-------|
| **Persona / frame** | platform-architect · development |
| **traceId** | `71776c34-08ea-4d51-84fa-543bbee73e51` |
| **P22 next** | **S4-08** — Docs-standard drift (agent README stubs + cross-repo links) |
| **backlogClear** | `false` — 1 automatable item |
| **Launch focus** | `zwcmp-unblock` — sovereign pilot substrate |
| **Git** | `main` · **12 commits ahead** of origin · HEAD `994afab` |
| **SIGNAL** | Sprints 1–3 **done** (`994afab`, `f99b862`) |
| **validate-all** | **49/52+** — Docs Standard fail (**33** violations) |
| **Hub #17** | **closed** |
| **Hub #18** | **open** — prod Postgres persistence (sibling) |
| **Staging monitoring** | Manifests applied; pods **Pending** (insufficient CPU/memory) |

### Uncommitted / untracked (not in HEAD)

- Modified: agent-sync files (`.agent/`, `CLAUDE.md`, cursor rules, `01-docs/01-agents/README.md`)
- Untracked: `workspace/`, `agents/`, `01-docs/01-agents/{claude,codex,...}/` — likely agent-sync drift; fold into S4-08

### Proceed Brief (P26)

**Next:** Execute **S4-08** — fix docs-standard violations (README stubs, link targets).  
**Because:** Only remaining automatable backlog item; blocks `validate-all` 50/50 and S4-07.  
**Authority class:** R  
**Blocked until:** none

---

## execute-roadmap — 2026-06-05

| Story | Status | UAT |
|-------|--------|-----|
| S4-08 docs-standard | **done** | `docs-standard-validator` exit 0 |
| S4-07 validate.sh quick | **done** | `bash 04-ship/03-platform/scripts/validate.sh quick` exit 0 |
| validate-all | **55/55** | all gates pass |

**Next (P22):** witness mode — `backlogClear: true` pending recompute
