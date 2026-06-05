---
title: 'gtcx-infrastructure — Repo Hygiene Audit'
status: current
owner: gtcx-infrastructure
date: '2026-06-05'
command: 'repo-hygiene'
workspace_type: 'monorepo'
policy_source: 'universal-default'
allowlist_version: 'n/a'
schema_version: 'n/a'
overall_score: 8.8
branch: main
head: '786c2e2'
axis_scores:
  axis_1_root_cleanliness: 7.5
  axis_2_per_dir_readme: 8.0
  axis_3_build_artifacts: 10.0
  axis_4_archive_handling: 8.5
  axis_5_naming: 7.5
  axis_6_size_outliers: 10.0
  axis_7_os_junk: 10.0
  axis_8_empty_dirs: 10.0
---

# gtcx-infrastructure — Repo Hygiene Audit

**Date:** 2026-06-05  
**Auditor:** agent://gtcx-infrastructure  
**Head:** `786c2e2`  
**Branch:** `main` (ahead 4 of origin)  
**Working tree:** 13 modified, 15+ untracked (agent-sync + operator artifacts)  
**Policy source:** Universal default (no repo-specific policy)  
**Checker script:** None  
**Mode:** Audit (no remediation applied)

---

## Executive summary

`gtcx-infrastructure` remains a production-capable pnpm monorepo with excellent build-artifact discipline (zero tracked output, comprehensive `.gitignore`, no OS junk, no empty dirs). Since the 2026-06-06 audit, **README coverage improved materially** — dotdirs (`.cursor/`, `.husky/`, `.kimi/`, `.zap/`) and all 15 workspace packages now have READMEs. Remaining gaps: **(1)** no repo-specific hygiene policy (caps score at 8.9), **(2)** two root uppercase files (`audit-deploy-comment.md`, `roadmap.md`), **(3)** five directories still lack READMEs, and **(4)** untracked operator artifacts at root (`.kube-config-prod`, `.helm-cache/`, `agents/`, `workspace/`) that should be gitignored or relocated. No P0 violations.

---

## Policy source

| File                                              | Status      | Used as |
| ------------------------------------------------- | ----------- | ------- |
| `docs/operations/repo/repo-hygiene-protocol.md`   | **Missing** | —       |
| `docs/operations/repo/root-allowlist.json`        | **Missing** | —       |
| `docs/operations/repo/repo-root-conventions.md`   | **Missing** | —       |
| `scripts/ops/check-workspace-root-cleanliness.py` | **Missing** | —       |

**Result:** Universal default (Phase 2). Overall score capped at **8.9** per prompt scoring rules.

---

## Root inventory

### Tracked root files

| Entry                         | Tier          | Status        | Notes                                                          |
| ----------------------------- | ------------- | ------------- | -------------------------------------------------------------- |
| `README.md`                   | A             | ok            | Front door                                                     |
| `AGENTS.md`                   | A             | ok            | Canonical agent protocol                                       |
| `LICENSE`                     | C             | ok            | —                                                              |
| `CHANGELOG.md`                | C             | ok            | —                                                              |
| `CONTRIBUTING.md`             | C             | ok            | —                                                              |
| `SECURITY.md`                 | C             | ok            | —                                                              |
| `CLAUDE.md`                   | B             | ok            | Agent-sync generated                                           |
| `CONVENTIONS.md`              | B             | ok            | Agent-sync generated                                           |
| `GEMINI.md`                   | B             | ok            | Agent-sync generated                                           |
| `package.json`                | D             | ok            | Root manifest                                                  |
| `pnpm-workspace.yaml`         | D             | ok            | 15 packages + 8 exemptions                                     |
| `pnpm-lock.yaml`              | D             | ok            | —                                                              |
| `turbo.json`                  | D             | ok            | —                                                              |
| `tsconfig.json`               | D             | ok            | —                                                              |
| `eslint.config.mjs`           | D             | ok            | —                                                              |
| `mise.toml`                   | D/E           | ok            | Dev-env manager                                                |
| `renovate.json`               | E             | ok            | —                                                              |
| Dotfiles (`.gitignore`, etc.) | E             | ok            | Standard CI/quality set                                        |
| `.docs-exceptions.json`       | E             | ok            | Docs-standard exceptions                                       |
| `audit-deploy-comment.md`     | I — Violation | **violation** | Uppercase not in allowlist; duplicate of `docs/audit/` content |
| `roadmap.md`                  | I — Violation | **violation** | Redirect stub — belongs in `docs/agile/`                       |

### Tracked root directories

| Entry        | Tier | Status | Notes                             |
| ------------ | ---- | ------ | --------------------------------- |
| `docs/`      | G    | ok     | README present                    |
| `infra/`     | G    | ok     | All 7 subdirs have README         |
| `scripts/`   | G    | ok     | `production/` missing README      |
| `tools/`     | G    | ok     | All workspace packages README     |
| `.agent/`    | F    | ok     | README present                    |
| `.baseline/` | F    | ok     | README present                    |
| `.cursor/`   | F    | ok     | README added (was gap 2026-06-06) |
| `.github/`   | E    | ok     | README present                    |
| `.husky/`    | E    | ok     | README added                      |
| `.kimi/`     | F    | ok     | README added                      |
| `.zap/`      | F    | ok     | README added                      |

### Untracked root items

| Entry               | Status        | Notes                                                   |
| ------------------- | ------------- | ------------------------------------------------------- |
| `.kube-config-prod` | **violation** | Operator kubeconfig — must not commit; add `.gitignore` |
| `.helm-cache/`      | investigate   | Ephemeral — gitignore recommended                       |
| `.helm-config/`     | investigate   | Ephemeral — gitignore recommended                       |
| `agents/`           | investigate   | Has README; decide track vs gitignore                   |
| `workspace/`        | investigate   | PM v3 WIP — README at root; `assurance/` child missing  |
| `dist/`             | ok            | Gitignored                                              |
| `node_modules/`     | ok            | Gitignored                                              |
| `supabase/`         | investigate   | Untracked; no README                                    |

---

## 8-axis scorecard

| Axis                           | Score | Top finding                                                                                             |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------------------- |
| **1. Root cleanliness**        | 7.5   | 2 uppercase root files; untracked operator/kube artifacts at root                                       |
| **2. Per-directory README**    | 8.0   | 5 missing: `.claude/`, `supabase/`, `scripts/production/`, `scripts/workspace/`, `workspace/assurance/` |
| **3. Build-artifact tracking** | 10.0  | Zero tracked build/cache/output; `.gitignore` covers stack patterns                                     |
| **4. Archive handling**        | 8.5   | No tracked `_archive/`/`_delete/`; gitignore covers human-owned paths                                   |
| **5. Naming consistency**      | 7.5   | `audit-deploy-comment.md`, `roadmap.md` violate uppercase allowlist                                     |
| **6. File-size outliers**      | 10.0  | Zero tracked files >1 MB                                                                                |
| **7. IDE/OS junk**             | 10.0  | Zero tracked `.DS_Store` / `Thumbs.db`                                                                  |
| **8. Empty / orphan dirs**     | 10.0  | Zero empty directories                                                                                  |

**Overall:** **8.8** (mean of 8 axes; capped at 8.9 without repo policy)

**Delta vs 2026-06-06 audit (+0.2):** Axis 2 improved 6.5 → 8.0 after README additions to dotdirs and workspace packages.

---

## Violations

### P0 — None

No CI-blocking, secret-at-root, or tracked build-artifact violations.

### P1 — Sprint-size

| #    | Item                                                           | DoD           | Evidence                                 |
| ---- | -------------------------------------------------------------- | ------------- | ---------------------------------------- |
| P1-1 | Move or delete `audit-deploy-comment.md`                       | axis 1, 5, P2 | Duplicate of dated doc in `docs/audit/`  |
| P1-2 | Delete or relocate `roadmap.md`                                | axis 1, 5, P2 | Redirect stub only                       |
| P1-3 | Gitignore `.kube-config-prod`, `.helm-cache/`, `.helm-config/` | axis 1        | Operator ephemeral artifacts at root     |
| P1-4 | Add README to `scripts/production/`                            | axis 2        | Prod operator scripts (Hub #17, ESO, SM) |
| P1-5 | Add README to `.claude/`                                       | axis 2        | Agent tooling dotdir                     |
| P1-6 | Resolve `supabase/` — track+README or gitignore                | axis 1, 2     | Untracked structural dir                 |
| P1-7 | Add README to `workspace/assurance/`                           | axis 2        | PM workspace child                       |

### P2 — Nice-to-have

| #    | Item                                                           | DoD    | Evidence                   |
| ---- | -------------------------------------------------------------- | ------ | -------------------------- |
| P2-1 | Bootstrap `docs/operations/repo/` policy + allowlist + checker | P1–P4  | Required for 9.0+          |
| P2-2 | Wire root cleanliness in `validate-all.mjs`                    | P4     | No automated root gate     |
| P2-3 | Gitignore or document `agents/`, `scripts/workspace/` WIP      | axis 1 | Untracked PM/agent v3 dirs |

---

## Checker output

No repo checker script. Manual pre-flight (2026-06-05):

```bash
# Build artifacts tracked (dist/, .next/, node_modules/, etc.)
git ls-files | grep -E '(^|/)(dist/|build/|\.next/|\.turbo/|coverage/|node_modules/)'
# → 0 file paths (only doc references to "build" in names)

# OS junk
git ls-files | grep -E '\.DS_Store$|Thumbs\.db$'
# → 0

# Empty dirs
find . -type d -empty -not -path '*/node_modules/*' -not -path '*/.git/*'
# → 0

# Size >1 MB
# → 0 tracked outliers
```

### Verification gates (Protocol 27)

| Command                                          | Exit  | Note                                                  |
| ------------------------------------------------ | ----- | ----------------------------------------------------- |
| `node tools/scripts/validate-all.mjs`            | **1** | 49/50 PASS; Docs Standard fail (27 link violations)   |
| `node tools/scripts/docs-standard-validator.mjs` | **1** | 27 violations (agent README stubs + cross-repo links) |
| `git status -sb`                                 | **0** | ahead 4; operator artifacts untracked                 |

---

## 10/10 gap analysis

### Policy & enforcement

| Criterion                  | Status   | Evidence                                                |
| -------------------------- | -------- | ------------------------------------------------------- |
| P1 — Repo hygiene protocol | **Fail** | Missing `docs/operations/repo/repo-hygiene-protocol.md` |
| P2 — Machine allowlist     | **Fail** | Missing `root-allowlist.json`                           |
| P3 — Checker script        | **Fail** | Missing `check-workspace-root-cleanliness.py`           |
| P4 — CI wired              | **Fail** | No root check in validate-all                           |

### Per-axis 10/10 gates

| Axis                    | Status      | Evidence                                                |
| ----------------------- | ----------- | ------------------------------------------------------- |
| 1. Root cleanliness     | **Fail**    | 2 uppercase files; operator artifacts untracked at root |
| 2. Per-directory README | **Partial** | 5 dirs missing (down from 12)                           |
| 3. Build artifacts      | **Pass**    | Zero tracked                                            |
| 4. Archive handling     | **Pass**    | Human-owned paths gitignored                            |
| 5. Naming               | **Fail**    | 2 root uppercase violations                             |
| 6. Size outliers        | **Pass**    | Zero >1 MB                                              |
| 7. OS/IDE junk          | **Pass**    | Zero tracked                                            |
| 8. Empty dirs           | **Pass**    | Zero empty                                              |

### Monorepo extras

| Criterion                 | Status      | Evidence                                         |
| ------------------------- | ----------- | ------------------------------------------------ |
| M1 — Package README sweep | **Pass**    | 15/15 workspace packages have README             |
| M2 — Cross-repo stubs     | **N/A**     | No ecosystem stub dirs at root                   |
| M3 — Inventory accuracy   | **Partial** | `tools/README.md` does not enumerate all subdirs |

---

## Bootstrap recommendation

Copy from `gtcx-docs/tools/audit/audit-framework/templates/repo-hygiene/`:

1. `docs/operations/repo/repo-hygiene-protocol.md`
2. `docs/operations/repo/root-allowlist.json`
3. `scripts/ops/check-workspace-root-cleanliness.py`
4. Wire into `validate-all.mjs`

Add `human_owned_paths`: `_delete/`, `_archive/`, `_cannon/`, `.kube-config-prod` (operator-local).

---

## Remediation plan

1. **P1-1/2:** `git rm` or `git mv` root uppercase files
2. **P1-3:** Add `.kube-config-prod`, `.helm-cache/`, `.helm-config/` to `.gitignore`
3. **P1-4/5/7:** Add stub READMEs (2–4 lines + owner)
4. **P1-6:** Decide `supabase/` fate
5. **P2-1:** Bootstrap repo policy (breaks 8.9 cap)

> `_delete/`, `_archive/`, `_cannon/` are human-owned — agents must NOT remediate.

---

## Execute hint

Run `/execute-repo-hygiene` or say "ship P1 fixes" to apply remediation.

---

_Audit per `gtcx-docs/tools/audit/audit-framework/prompts/hygiene/repo-hygiene-protocol-prompt.md` Phase 0–4._
