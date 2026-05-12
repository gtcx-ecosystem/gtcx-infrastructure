# ADR-009: Deprecate `gtcx-core12` and `gtcx-amis`

**Date:** 2026-05-12
**Status:** Accepted
**Deciders:** Platform Engineering, Architecture
**Stakeholders:** All repo owners in `gtcx-ecosystem/*`

---

## Context

The ecosystem review of 2026-05-12 (`docs/audit/ecosystem-repo-review-2026-05-12.md`) identified 25 active repos with significant overlap and sprawl. Two repos stood out as unmaintained and functionally superseded:

- **`gtcx-core12`** (Python): Described as "universal compliance knowledge graph." No CI, no tests, no build, no `SECURITY.md`. The TypeScript `gtcx-core` repo already covers shared packages (crypto, types, schemas) and is actively maintained.
- **`gtcx-amis`** (JavaScript): Described as "Autonomous Market Intelligence Service." No CI, no tests, no build, no `LICENSE`, no `SECURITY.md`. AMANI specs have been migrated to `gtcx-infrastructure/tools/templates/`.

---

## Decision

**Deprecate both repos.** Archive them in GitHub and redirect all references.

| Repo          | Superseded By                     | Rationale                                                                                                                                                 |
| ------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `gtcx-core12` | `gtcx-core` (TypeScript)          | `gtcx-core` is the actively maintained shared library. `gtcx-core12` (Python) has zero consumers, zero CI, and no active development since 2026-02-06.    |
| `gtcx-amis`   | `gtcx-infrastructure` (templates) | AMANI/MABA specs now live in `gtcx-infrastructure/tools/templates/`. `gtcx-amis` has zero consumers, zero CI, and no active development since 2026-02-04. |

---

## Consequences

### Positive

- Reduces repo count from 25 → 23 active repos
- Eliminates confusion about which "core" package to use
- Centralizes template/spec ownership in `gtcx-infrastructure`
- Reduces SOC 2 audit scope (fewer repos to review)

### Negative

- Any historical references to `gtcx-core12` in migration configs must be updated (done: `infra/migrations/config/gtcx.yaml`)
- Any historical references to `gtcx-amis` in template docs must be updated (done: `tools/templates/projects/maba/README.md`, `tools/templates/projects/amani/README.md`)

### Neutral

- GitHub archives preserve history and code; nothing is deleted

---

## Actions Taken

- [x] Updated `infra/migrations/config/gtcx.yaml`: `target_schema: 'gtcx-core12'` → `target_schema: 'gtcx-core'`
- [x] Updated `tools/templates/projects/maba/README.md`: removed `gtcx-core12` and `gtcx-amis` references
- [x] Updated `tools/templates/projects/amani/README.md`: removed `gtcx-amis` reference
- [x] Updated `tools/templates/PRINCIPLES.md`: remapped P21 → `gtcx-core`, P23 → `gtcx-protocols`
- [x] Updated `docs/specs/cicd-pipeline.md`: removed `gtcx-amis` from documentation consumers
- [x] Updated `docs/audit/ecosystem-repo-review-2026-05-12.md`: marked both as deprecated
- [ ] Archive `gtcx-core12` in GitHub (requires org admin)
- [ ] Archive `gtcx-amis` in GitHub (requires org admin)
- [ ] Notify `#engineering` Slack channel

---

## References

- Ecosystem repo review: `docs/audit/ecosystem-repo-review-2026-05-12.md`
- Platform compliance governance: `docs/compliance/platform-compliance-governance.md`
- `gtcx-core`: https://github.com/gtcx-ecosystem/gtcx-core
