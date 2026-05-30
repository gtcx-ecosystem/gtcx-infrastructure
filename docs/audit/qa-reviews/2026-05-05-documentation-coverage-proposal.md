---
title: 'Internal Memo: Formalizing Documentation-as-Code Enforcement'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'critical'
tags: ['compliance', 'architecture', 'infrastructure', 'testing', 'frontend']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Internal Memo: Formalizing Documentation-as-Code Enforcement

- **Date:** 2026-05-05
- **Subject:** Closing the Gap to 10/10 — Implementing Documentation Coverage CI
- **Target:** DevOps & Architecture Teams
- **Status:** Proposed

---

## Overview

While our repository currently holds a "Gold Standard" rating for its architectural transparency and documentation depth, we face a common long-term risk: **Documentation Drift.** As we scale from 2 pilots to 10+ jurisdictions, the speed of code changes in `infra/` may eventually outpace the manual updates to our `docs/` folder.

To achieve a perfect 10/10 operational score and satisfy the "Verifiable Integrity" required by our government partners, I propose we implement a **Documentation Coverage CI Gate.**

---

## 1. The Goal

Treat documentation as a first-class build artifact. If a Pull Request introduces significant infrastructure changes without corresponding architectural evidence, the CI pipeline should fail.

---

## 2. Implementation Strategy

We will utilize the existing `docs/scripts/doc-hygiene-check.sh` and integrate it into our CI/CD pipeline.

### 2.1 The Logic

The script will use `git diff` to analyze the scope of the PR:

- **Infrastructure Changes:** Detects changes in `infra/terraform/` or `infra/kubernetes/`.
- **Missing Evidence:** Checks if new or updated files are present in `docs/architecture/`, `docs/architecture/decisions/`, or `docs/specs/`.
- **Outcome:** Exit with Code 1, blocking the merge until an ADR or Spec update is included.

### 2.2 Proposed Script Enhancement

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Identify core changes
INFRA_CHANGES=$(git diff --name-only origin/main...HEAD | grep -E '^(infra/|tools/)' || true)

# 2. Identify documentation updates
DOCS_UPDATES=$(git diff --name-only origin/main...HEAD | grep -E '^docs/(architecture/|decisions/|specs/)' || true)

if [[ -n "$INFRA_CHANGES" ]] && [[ -z "$DOCS_UPDATES" ]]; then
  echo "❌ ERROR: Infrastructure changes detected without corresponding documentation updates."
  echo "GTCX Safety Rules require an ADR or Spec update for all core infra modifications."
  echo "Affected files:"
  echo "$INFRA_CHANGES"
  exit 1
fi

echo "✅ Documentation coverage check passed."
```

---

## 3. Why This Matters for Sovereignty

Governments and financial institutions do not just buy our code; they buy our **provenance.** A forced documentation gate ensures that every "Jurisdictional Node" deployment is backed by a verifiable decision trail (ADR). This makes GTCX the only infrastructure in the world where the documentation is as immutable and mandatory as the code itself.

---

## 4. Next Steps

1.  **Refinement:** Update `grep` patterns to exclude minor chores/typos.
2.  **Overrides:** Add a `[no-doc-needed]` override flag for the PR description to handle edge cases.
3.  **Enforcement:** Enable as a "Required Check" in GitHub for the `main` and `develop` branches.

---

**Auditor Note:** _This move shifts documentation from a "best effort" to a "systemic requirement," removing the final human-error variable from our infrastructure's trust model._
