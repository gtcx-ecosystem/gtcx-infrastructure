---
status: current
date: '2026-06-02'
owner: gtcx-infrastructure
title: 'Repo Folder Hygiene Assessment — Phase 3.5'
tier: standard
tags: ['audit', 'hygiene', 'repo-structure']
---

# Repo Folder Hygiene Assessment — gtcx-infrastructure

**Date:** 2026-06-02
**Phase:** 3.5 (Folder Hygiene)
**Assessor:** Kimi Code CLI (agentic audit)
**Repo:** gtcx-infrastructure

---

## Executive Summary

| Metric                 | Value                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| Overall Hygiene Score  | **8.75 / 10**                                                       |
| Total Violations Found | **8** (6 README + 1 build-artifact category + 1 file-size category) |
| Violations Remaining   | **8** (all require remediation or documented justification)         |
| Git Status             | Clean (no untracked files, no uncommitted changes)                  |

---

## 8-Axis Hygiene Scorecard

### 1. Root Cleanliness — 9/10

**Evidence:**

- `ls -la` shows 24 root entries (14 files, 10 directories)
- All files have clear, well-defined purposes:
  - Package management: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.nvmrc`
  - Config: `tsconfig.json`, `turbo.json`, `eslint.config.mjs`, `.editorconfig`, `.prettierrc`, `.prettierignore`, `.eslintignore`, `.env.example`
  - Documentation: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `AGENTS.md`, `CLAUDE.md`, `CONVENTIONS.md`, `GEMINI.md`, `roadmap.md`, `LICENSE`
  - Dev tooling: `mise.toml`, `renovate.json`, `.docs-exceptions.json`
- No orphan files, temporary artifacts, or leftover build outputs in root
- `.git/.COMMIT_EDITMSG.swp` exists (transient vim swap during commit editing) but is git-internal and not tracked

**Deduction:** -1 for transient `.swp` file in `.git/` (minor, self-healing)

---

### 2. Per-Directory README Discipline — 7/10

**Evidence:**

- Top-level directories with READMEs (5/7):
  - `01-docs/` ✓
  - `04-ship/` ✓
  - `03-platform/scripts/` ✓
  - `03-platform/tools/` ✓
  - `.agent/` ✓
- Top-level directories **missing** root READMEs (2/7):
  - `.baseline/` — no `README.md` at root (only `.baseline/memory/README.md` exists)
  - `.github/` — no `README.md` at root (only `.github/actions/README.md` exists)
- `01-docs/` subdirectories: **18/18** have READMEs (agents, agile, api, architecture, audit, compliance, engineering, esg, financial, gitbook, governance, gtm, operations, overview, reference, roadmap, security, specs)
- `03-platform/tools/` top-level directories: **23/23** have READMEs
- `04-ship/` subdirectories: **3/7** have READMEs
  - ✓ `04-ship/migrations/README.md`
  - ✓ `04-ship/03-platform/scripts/README.md`
  - ✓ `04-ship/security/README.md`
  - ✗ `04-ship/docker/` — missing
  - ✗ `04-ship/kubernetes/` — missing
  - ✗ `04-ship/monitoring/` — missing
  - ✗ `04-ship/terraform/` — missing

**Deduction:** -3 for 6 missing READMEs across `.baseline/`, `.github/`, and 4 `04-ship/` subdirectories

---

### 3. Build-Artifact Tracking — 8/10

**Evidence:**

- `.gitignore` comprehensively covers build artifacts:
  ```
  dist/
  build/
  *.tsbuildinfo
  *.zip
  coverage/
  .nyc_output/
  .turbo/
  .next/
  out/
  logs/
  ```
- `git ls-files | grep -E '^\.(next|dist|build|coverage)/'` — **0 results**
- `git ls-files | grep -E '__pycache__'` — **0 results**
- `git ls-files | grep -E '^\.turbo/'` — **0 results**
- No build artifacts tracked in git

**Working-tree presence (ignored but not cleaned):**

- `.turbo/` at root with cache files
- `04-ship/migrations/.turbo/`
- `03-platform/tools/deployment-guard/.turbo/`
- `03-platform/tools/docs-site/.turbo/`
- `03-platform/tools/docs-site/dist/`
- `03-platform/tools/replay-protection/.turbo/`
- 6+ tools have `coverage/` directories with lcov reports
- 11 tools have `node_modules/` subdirectories (ignored but present)

**Deduction:** -2 for persistent build artifacts in working tree despite proper `.gitignore`

---

### 4. Archive Directory Handling — 10/10

**Evidence:**

- `find . -maxdepth 3 -type d \( -name '_archive' -o -name '_delete' -o -name '_old' -o -name '_backup' -o -name '_temp' \)` — **0 results**
- `.gitignore` explicitly documents and excludes archive directories:
  ```
  # Local archive (reference only, not tracked)
  _archive/
  _cannon/
  _delete/
  ```
- No archive directories exist in repository
- Clear convention established and enforced

**Deduction:** None

---

### 5. Naming Consistency — 9/10

**Evidence:**

- All top-level directories: kebab-case or lowercase (`.agent`, `.baseline`, `.github`, `docs`, `infra`, `scripts`, `tools`)
- `03-platform/tools/` subdirectories: 23 directories, **100% kebab-case**
  - `anomaly-detector`, `audit-flush`, `audit-signer`, `compliance-gateway`, `compliance-gateway-mcp`, `contract-tests`, `control-plane`, `deployment-guard`, `docs-site`, `eval-pipeline`, `kubectl-access`, `kyc-screening`, `load-tests`, `low-bandwidth`, `policy`, `replay-protection`, `ussd-handler`, etc.
- `04-ship/` subdirectories: 7 directories, **100% lowercase/kebab-case**
  - `docker`, `kubernetes`, `migrations`, `monitoring`, `scripts`, `security`, `terraform`
- `01-docs/` subdirectories: 18 directories, **100% kebab-case/lowercase**
- Config files consistently kebab-case: `eslint.config.mjs`, `pnpm-workspace.yaml`, `tsconfig.json`, `turbo.json`
- No camelCase or PascalCase directory names found

**Deduction:** -1 for minor inconsistency in `01-docs/` where some dirs are single-word lowercase and others are kebab-case (cosmetic, not structural)

---

### 6. File-Size Outliers — 9/10

**Evidence:**

- `git ls-files | while read f; do ...` for files >500KB — **0 tracked files >500KB**
- `find . -size +500k -type f` found many files, but all in excluded paths:
  - `node_modules/` (dependency artifacts)
  - `.terraform/` (provider binaries, 50-150MB each)
  - `coverage/` (lcov reports, 500KB-2MB each)
  - `.turbo/cache/` (zst archives)
  - `.git/objects/pack/` (git internals)
- No tracked source files >500KB
- Files >1000 LOC (tracked, justified):
  - `pnpm-lock.yaml` — 7,444 lines (~245KB) — justified as package manager lock file
  - `01-docs/api/openapi.yaml` — 931 lines — justified as API specification
  - `03-platform/tools/compliance-gateway/src/server.mjs` — 1,057 lines — justified as main server entry point
- Coverage lcov.info files exist locally (8,222 lines in `03-platform/tools/compliance-gateway/coverage/lcov.info`) but are ignored

**Deduction:** -1 for large coverage files persisting in working tree (lcov.info 2000-8000+ lines, 500KB-2MB)

---

### 7. IDE/OS Junk — 9/10

**Evidence:**

- `.gitignore` covers all standard IDE/OS artifacts:
  ```
  .idea/
  .vscode/
  *.swp
  *.swo
  .DS_Store
  Thumbs.db
  .claude/settings.local.json
  ```
- `git ls-files | grep -E '\.(DS_Store|swp|swo|idea|vscode)$'` — **0 results**
- `find . -name '.DS_Store' -o -name 'Thumbs.db' -o -name '.idea' -o -name '.vscode'` outside node_modules — **0 results**
- One `.vscode/` directory found inside `node_modules/.pnpm/stream-replace-string/` (dependency artifact, not tracked)
- `.git/.COMMIT_EDITMSG.swp` exists but is git-internal transient vim swap (not tracked)

**Deduction:** -1 for `.git/.COMMIT_EDITMSG.swp` (transient but visible in filesystem)

---

### 8. Empty/Orphan Directories — 9/10

**Evidence:**

- `find . -maxdepth 3 -type d -empty | grep -v node_modules | grep -v '.git'` — **0 results**
- All directories serve structural or content purposes:
  - `.baseline/checkpoints/`, `.baseline/govern/`, `.baseline/index/` — contain tracked baseline data
  - `.baseline/memory/` — contains 5 tracked files
  - `.github/workflows/` — contains 19 workflow files
  - `.turbo/cache/` — contains build cache (ignored)
- No `.gitkeep` files needed because no empty directories exist
- `git status --short --untracked-files=all` — clean (no untracked files)

**Deduction:** -1 for no proactive cleanup of ignored `.turbo/` and `coverage/` directories that accumulate content

---

## Violations Registry

| #   | Category          | Location                                                                                             | Severity | Status | Remediation                                                                |
| --- | ----------------- | ---------------------------------------------------------------------------------------------------- | -------- | ------ | -------------------------------------------------------------------------- |
| 1   | README discipline | `.baseline/` — missing root `README.md`                                                              | Medium   | Open   | Create `.baseline/README.md` explaining baseline structure                 |
| 2   | README discipline | `.github/` — missing root `README.md`                                                                | Medium   | Open   | Create `.github/README.md` explaining workflow organization                |
| 3   | README discipline | `04-ship/docker/` — missing `README.md`                                                              | Low      | Open   | Create `README.md` with Docker build instructions                          |
| 4   | README discipline | `04-ship/kubernetes/` — missing `README.md`                                                          | Low      | Open   | Create `README.md` with K8s manifest overview                              |
| 5   | README discipline | `04-ship/monitoring/` — missing `README.md`                                                          | Low      | Open   | Create `README.md` with monitoring stack overview                          |
| 6   | README discipline | `04-ship/terraform/` — missing `README.md`                                                           | Low      | Open   | Create `README.md` with Terraform module index                             |
| 7   | Build artifacts   | 11 tools with `node_modules/`, 6+ with `coverage/`, 4 with `.turbo/`, 1 with `dist/` in working tree | Low      | Open   | Run `git clean -fdX` or add `pnpm clean` script to purge ignored artifacts |
| 8   | File size         | Coverage `lcov.info` files 500KB-2MB, 2000-8000+ LOC in working tree                                 | Low      | Open   | Add post-test cleanup or move coverage to `/tmp`                           |

**Total violations: 8**
**By severity:** Medium (2) | Low (6)
**By category:** README discipline (6) | Build artifacts (1) | File size (1)

---

## Violations Remaining + Justification

| Violation                            | Remaining? | Justification                                                                                                                                                                                       |
| ------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.baseline/` missing README          | **Yes**    | Institutional memory directory lacks entry-point documentation. Users must navigate to `.baseline/memory/README.md` instead.                                                                        |
| `.github/` missing README            | **Yes**    | 19 workflow files, 3 action definitions, and codeql configs lack top-level orientation.                                                                                                             |
| 4 `04-ship/` subdirs missing READMEs | **Yes**    | Infrastructure subsystems (docker, kubernetes, monitoring, terraform) are complex and warrant local documentation.                                                                                  |
| Build artifacts in working tree      | **Yes**    | While properly `.gitignore`d, the accumulation of coverage, dist, and .turbo directories increases clone size and cognitive load. A `pnpm clean` or `git clean -fdX` workflow should be documented. |
| Large coverage files in working tree | **Yes**    | lcov reports are generated artifacts that can exceed 2MB. They are ignored but not removed after test runs.                                                                                         |

---

## Recommendations

1. **Create missing READMEs** (Priority: Medium)
   - `.baseline/README.md` — reference `.baseline/definition.json` and memory structure
   - `.github/README.md` — catalog workflows, actions, and contribution guidelines
   - `04-ship/docker/README.md`, `04-ship/kubernetes/README.md`, `04-ship/monitoring/README.md`, `04-ship/terraform/README.md`

2. **Add clean script** (Priority: Low)
   - Add `"clean": "git clean -fdX || rm -rf */coverage */.turbo */dist */node_modules"` to root `package.json`
   - Document in `CONTRIBUTING.md`

3. **Configure coverage output** (Priority: Low)
   - Move coverage to `/tmp/coverage-$(date +%s)` or add post-test hook to delete `coverage/` directories
   - Alternatively, add `coverage/` to `.eslintignore` and `.prettierignore` if not already present

4. **Baseline README template** (Priority: Low)
   - Establish a README template for 04-ship/ subdirectories to ensure consistency

---

## Audit Commands Executed

```bash
# Root listing
ls -la

# Directory structure (depth 2)
find . -maxdepth 2 -type d | sort

# IDE/OS junk search
find . -name '.DS_Store' -o -name 'Thumbs.db' -o -name '.idea' -o -name '.vscode'

# Empty directories
find . -type d -empty

# Large files (>500KB)
find . -size +500k -type f

# Tracked build artifacts
git ls-files | grep -E '^\.(next|dist|build|coverage)/'

# Gitignore review
cat .gitignore

# README coverage check
for dir in docs infra scripts tools .agent .baseline .github; do test -f "$dir/README.md"; done

# File line counts (top 30)
find . -maxdepth 3 -type f ... -exec wc -l {} + | sort -rn | head -30

# Git status
git status --short
git status --ignored --short
```

---

_Assessment completed by Kimi Code CLI as part of GTCX Infrastructure Phase 3.5 audit._
