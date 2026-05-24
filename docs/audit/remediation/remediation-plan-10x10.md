---
title: 'Remediation Plan: gtcx-infrastructure — Target 10/10'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'api']
review_cycle: 'monthly'
---

# Remediation Plan: gtcx-infrastructure — Target 10/10

---

## Audit Baseline (2026-03-19)

| Dimension      | Score | Key Finding                                                                               |
| -------------- | ----- | ----------------------------------------------------------------------------------------- |
| Code Quality   | 8/10  | Placeholder secrets in base K8s; image pull policy inconsistency                          |
| Architecture   | 9/10  | Backend template has commented-out remote state config                                    |
| System Design  | 9/10  | Network policy CIDR hardcoded to 10.0.0.0/8                                               |
| Repo Hygiene   | 7/10  | CRITICAL: `.terraform/terraform.tfstate` committed; no deployment runbook; no CHANGELOG   |
| Folder Hygiene | 8/10  | Duplicate `k8s/` vs `kubernetes/`; orphaned `edge-proxy/`; empty `monitoring/dashboards/` |

**Composite: 8.2/10 — target: 10/10**

---

## Remediation Items

### Code Quality: 8/10 → 10/10

#### Issue 1: Placeholder secrets in base kustomization.yaml

- **Audit finding:** `infra/kubernetes/base/kustomization.yaml` lines 35-37 contain placeholder secrets as literal values: `DATABASE_URL=postgres://placeholder:placeholder@localhost:5432/gtcx` and `SECRET_KEY_BASE=placeholder-override-in-overlay`.
- **Evidence:** `infra/kubernetes/base/kustomization.yaml:35-37`
- **Fix:** Add a clear comment block above the `secretGenerator` section:
  ```yaml
  # ============================================================
  # PLACEHOLDER SECRETS — NEVER USE IN PRODUCTION
  # These exist only so kustomize build succeeds in base.
  # Production overlays MUST override via:
  #   - Sealed Secrets (bitnami/sealed-secrets)
  #   - External Secrets Operator (external-secrets.io)
  #   - Vault Agent injector
  # See: docs/secrets-management.md
  # ============================================================
  ```
  Also create `docs/secrets-management.md` documenting the secrets strategy: base uses placeholders, production injects via external operator, rotation cadence, which secrets exist.
- **Verification:** `grep -c 'NEVER USE IN PRODUCTION' infra/kubernetes/base/kustomization.yaml` returns 1; `test -f docs/secrets-management.md`
- **Risk:** Low — adding documentation. No functional change.

#### Issue 2: Image pull policy inconsistency

- **Audit finding:** Most base services use `imagePullPolicy: Always` but NATS uses `IfNotPresent`. Inconsistency in base manifests.
- **Evidence:** `infra/kubernetes/base/services/nats.yaml` — `imagePullPolicy: IfNotPresent`
- **Fix:** Standardize to `IfNotPresent` in base (appropriate for tagged images) and `Always` in development overlay (appropriate for `:latest`). NATS is correct; the other services should match. Check each service manifest in `infra/kubernetes/base/services/` and ensure consistent `imagePullPolicy: IfNotPresent`. Development overlay should patch to `Always`.
- **Verification:** `grep -r 'imagePullPolicy' infra/kubernetes/base/services/` — all show `IfNotPresent`. `grep -r 'imagePullPolicy' infra/kubernetes/overlays/development/` — shows `Always` patch.
- **Risk:** Low — pull policy change in base manifests. Production overlay already pins tags (v1.0.0), so `IfNotPresent` is correct there.

### Architecture: 9/10 → 10/10

#### Issue 3: Backend template has commented-out remote state

- **Audit finding:** `infra/terraform/environments/template/main.tf` has the S3 backend block commented out. Operators must know to uncomment it, increasing risk of local state being used accidentally.
- **Evidence:** `infra/terraform/environments/template/main.tf` — `# backend "s3" { ... }`
- **Fix:** Uncomment the backend block in the template and add placeholder values with clear comments:
  ```hcl
  backend "s3" {
    bucket         = "CHANGE-ME-gtcx-terraform-state"  # Required: unique bucket name
    key            = "CHANGE-ME/terraform.tfstate"       # Required: state file path
    region         = "CHANGE-ME"                         # Required: AWS region
    encrypt        = true
    dynamodb_table = "CHANGE-ME-terraform-locks"         # Required: lock table name
  }
  ```
  The `CHANGE-ME` prefix ensures `terraform init` fails immediately if not customized — safer than silent local state.
- **Verification:** `grep -c 'CHANGE-ME' infra/terraform/environments/template/main.tf` returns >= 4
- **Risk:** Low — template change only. Existing environments unaffected.

### System Design: 9/10 → 10/10

#### Issue 4: Network policy CIDR hardcoded to 10.0.0.0/8

- **Audit finding:** `infra/kubernetes/overlays/production/network-policies.yaml` hardcodes `cidr: 10.0.0.0/8` with a comment "customize per deployment" but no mechanism to actually customize it.
- **Evidence:** `infra/kubernetes/overlays/production/network-policies.yaml:80,148`
- **Fix:** Two options (pick based on preference):
  1. **Document as deployment override:** Add to `docs/deployment-runbook.md` a section on network policy customization with the exact sed/kustomize patch command to update the CIDR per environment.
  2. **Extract to ConfigMap:** Create a `network-config` ConfigMap with the internal CIDR and reference it from network policies (more complex, may not be worth it for a single value).
     Recommend option 1 — document the override procedure. The hardcoded value is a reasonable default for most VPCs.
- **Verification:** Deployment runbook exists and contains a "Network Policy Customization" section with the CIDR override procedure
- **Risk:** None — documentation. The default 10.0.0.0/8 works for standard VPC configurations.

### Repo Hygiene: 7/10 → 10/10

#### Issue 5: CRITICAL — `.terraform/terraform.tfstate` committed to git

- **Audit finding:** The `.terraform/` directory including `terraform.tfstate` is committed at `infra/terraform/environments/zimbabwe-pilot/.terraform/`. This is a security and hygiene violation — state files may contain sensitive outputs and should never be version-controlled.
- **Evidence:** `infra/terraform/environments/zimbabwe-pilot/.terraform/terraform.tfstate`
- **Fix:**
  ```bash
  cd /Users/amanianai/Sites/gtcx-ecosystem/gtcx-infrastructure
  git rm -r --cached infra/terraform/environments/zimbabwe-pilot/.terraform/
  ```
  Verify `.gitignore` already has `.terraform/` (it does — line in existing .gitignore). The `--cached` flag removes from git tracking without deleting the local directory.
- **Verification:** `git ls-files | grep '.terraform/'` returns empty. `test -d infra/terraform/environments/zimbabwe-pilot/.terraform` still exists locally.
- **Risk:** Medium — ensure the state file has a remote backend configured (S3) before removing local copy. The zimbabwe-pilot environment already has `backend "s3"` configured, so this is safe. If the local `.terraform/terraform.tfstate` is the ONLY copy, back it up first.

#### Issue 6: Missing deployment runbook

- **Audit finding:** Only one deployment script exists (`scripts/deploy-intelligence.sh`). No comprehensive deployment runbook in `docs/`.
- **Evidence:** `docs/` — no deployment runbook found
- **Fix:** Create `docs/deployment-runbook.md` covering:
  1. **Prerequisites:** AWS credentials, kubectl context, Terraform state backend
  2. **New environment setup:** Copy template, customize backend + variables, `terraform init && terraform plan && terraform apply`
  3. **K8s deployment:** `kustomize build infra/kubernetes/overlays/{env} | kubectl apply -f -`
  4. **Intelligence services:** Reference `scripts/deploy-intelligence.sh`
  5. **Database initialization:** Apply init scripts from `infra/docker/init-scripts/`
  6. **Secrets injection:** How to create/rotate secrets per environment
  7. **Verification checklist:** Health endpoints, log checks, metric dashboards
  8. **Rollback procedure:** How to revert a bad deployment
  9. **Network policy customization:** CIDR override for non-default VPCs (addresses Issue 4)
- **Verification:** `test -f docs/deployment-runbook.md` and file contains sections for prerequisites, setup, deployment, secrets, verification, rollback
- **Risk:** None — documentation only

#### Issue 7: No CHANGELOG

- **Audit finding:** No CHANGELOG.md or VERSION file exists in the repository.
- **Evidence:** Root directory — no CHANGELOG.md
- **Fix:** Create `CHANGELOG.md` at the repo root following Keep a Changelog format. Document current state:

  ```markdown
  # Changelog

  ## [Unreleased]

  ### Added

  - Terraform modules: VPC, Database, EKS, ECR, Secrets, Event-Bus (6 modules)
  - K8s base manifests: API, Crypto, TradePass, GeoTag, GCI, Intelligence (ANISA + SDK), NATS
  - K8s overlays: development, staging, production
  - Production: ALB controller, ALB ingress, network policies, pod security
  - Docker Compose: dev (20 services), infra (9 services), test (10 services)
  - Database init scripts: 31 operational tables, 1 audit table
  - Zimbabwe pilot environment: af-south-1 (VPC + EKS + dual RDS + ECR)
  - NATS JetStream event bus with Terraform module
  - Intelligence K8s services (ANISA FastAPI + SDK HTTP)
  - Monitoring: Prometheus alerts, Grafana dashboard structure
  - Security: network policies, pod security, access control docs
  ```

- **Verification:** `test -f CHANGELOG.md` and `head -5 CHANGELOG.md` shows proper format
- **Risk:** None — new file

### Folder Hygiene: 8/10 → 10/10

#### Issue 8: Duplicate K8s directories — `k8s/` vs `kubernetes/`

- **Audit finding:** Both `infra/k8s/` (intelligence-specific configs) and `infra/kubernetes/` (full platform) exist. Purpose overlap is unclear. `k8s/intelligence/` contains: `secrets.yml`, `sdk-server.yml`, `canary.yml`, `anisa.yml`, `namespace.yml`.
- **Evidence:** `infra/k8s/intelligence/` — 5 YAML files; `infra/kubernetes/base/services/intelligence.yaml` — equivalent manifests
- **Fix:** Consolidate. The `kubernetes/` directory is the canonical Kustomize structure. Either:
  1. Move any unique content from `k8s/intelligence/` into `kubernetes/overlays/` (e.g., canary config)
  2. Delete `k8s/` entirely if all content is superseded by `kubernetes/base/services/intelligence.yaml`
     Compare the files first — if `k8s/intelligence/anisa.yml` and `kubernetes/base/services/intelligence.yaml` define the same deployment, keep only the Kustomize version.
- **Verification:** `test ! -d infra/k8s` — directory should not exist. Or if kept, has a README explaining its distinct purpose.
- **Risk:** Medium — must verify no CI/CD pipeline references `infra/k8s/`. Check `scripts/deploy-intelligence.sh` and any GitHub Actions for path references.

#### Issue 9: Orphaned `edge-proxy/` directory

- **Audit finding:** `infra/edge-proxy/` directory exists but appears empty or undocumented.
- **Evidence:** `infra/edge-proxy/` — no visible content or README
- **Fix:** If the directory is empty, remove it. If it contains files for a future edge proxy (Envoy, Traefik), add a README explaining its purpose and status.
  ```bash
  # Check if empty
  ls -la infra/edge-proxy/
  # If empty:
  rmdir infra/edge-proxy/
  # If has content:
  # Add README.md explaining purpose
  ```
- **Verification:** Either `test ! -d infra/edge-proxy` (removed) or `test -f infra/edge-proxy/README.md` (documented)
- **Risk:** Low — removing an empty directory or adding documentation

#### Issue 10: Empty `monitoring/dashboards/` directory

- **Audit finding:** `infra/monitoring/dashboards/` may be empty — should contain Grafana dashboard JSON files or a README.
- **Evidence:** `infra/monitoring/dashboards/` — unclear if populated
- **Fix:** If empty, either:
  1. Add a `README.md` explaining that dashboard JSON files will be added when Grafana is deployed (if dashboards are managed via Grafana UI and exported later)
  2. Add placeholder dashboard JSON files for the key views: API latency, NATS throughput, pod health
  3. Remove the directory if dashboards are managed entirely outside this repo
- **Verification:** `ls infra/monitoring/dashboards/` — shows either dashboard files or a README
- **Risk:** None

---

## Execution Order

```
1. Remove .terraform from git (CRITICAL — do first)          [5 min]
2. Consolidate k8s/ vs kubernetes/                            [20 min]
   └── Check deploy-intelligence.sh for path refs first
3. Clean up edge-proxy/ and monitoring/dashboards/            [10 min]
4. Fix image pull policy consistency                          [15 min]
5. Add placeholder secret documentation                       [15 min]
6. Uncomment backend template with CHANGE-ME values           [10 min]
7. Create deployment runbook (includes network CIDR docs)     [45 min]
8. Create CHANGELOG.md                                        [20 min]
```

Items 1-3 are folder/hygiene fixes (do first to clean the working tree).
Items 4-6 are code/architecture fixes (independent).
Items 7-8 are documentation (do last, reference the fixed structure).

---

## Definition of Done

- [ ] `git ls-files | grep '.terraform/'` returns empty
- [ ] `infra/k8s/` either removed or documented with clear distinction from `kubernetes/`
- [ ] `infra/edge-proxy/` either removed or has README
- [ ] `infra/monitoring/dashboards/` has content or README
- [ ] All base service manifests use consistent `imagePullPolicy: IfNotPresent`
- [ ] Base kustomization secrets have "NEVER USE IN PRODUCTION" comment block
- [ ] `docs/secrets-management.md` exists
- [ ] Template backend block is uncommented with CHANGE-ME placeholders
- [ ] `docs/deployment-runbook.md` exists with prerequisites, setup, deployment, secrets, verification, rollback, network CIDR sections
- [ ] `CHANGELOG.md` exists at repo root with current state documented
- [ ] No committed `.tfstate` files or `.terraform/` directories

---

## Post-Remediation Verification Protocol

```bash
cd /Users/amanianai/Sites/gtcx-ecosystem/gtcx-infrastructure

# 1. No terraform state in git
git ls-files | grep -E '\.terraform/|\.tfstate' | wc -l  # expect: 0

# 2. No duplicate K8s dirs (or documented)
test ! -d infra/k8s || test -f infra/k8s/README.md

# 3. No orphaned dirs
test ! -d infra/edge-proxy || test -f infra/edge-proxy/README.md

# 4. Dashboards dir has content
ls infra/monitoring/dashboards/ | wc -l  # expect: >= 1

# 5. Consistent image pull policy
grep -r 'imagePullPolicy' infra/kubernetes/base/services/ | sort -u
# expect: all IfNotPresent

# 6. Secrets documented
test -f docs/secrets-management.md && echo "ok"
grep -c 'NEVER USE IN PRODUCTION' infra/kubernetes/base/kustomization.yaml  # >= 1

# 7. Template backend active
grep -c 'CHANGE-ME' infra/terraform/environments/template/main.tf  # >= 4

# 8. Deployment runbook
test -f docs/deployment-runbook.md && echo "ok"
grep -c 'Rollback' docs/deployment-runbook.md  # >= 1

# 9. CHANGELOG
test -f CHANGELOG.md && echo "ok"
grep -c 'Unreleased' CHANGELOG.md  # >= 1

# 10. Terraform validates
cd infra/terraform/modules/vpc && terraform validate
cd ../database && terraform validate
cd ../eks && terraform validate
```
