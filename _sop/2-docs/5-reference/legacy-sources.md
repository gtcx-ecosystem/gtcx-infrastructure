# Legacy Sources

Attribution map: which SOP documents were derived from which legacy sources. All legacy sources are preserved under `_archive/`.

---

## \_sop/2-docs Derivation Map

| SOP Document                                            | Primary Legacy Source(s)                                                                     |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `1-architecture/system-overview.md`                     | `_archive/legacy/5-reference/_archive/gitbook-v3/01-Introduction.md`, `02-Architecture.md`   |
| `1-architecture/trust-model.md`                         | `_archive/legacy/5-reference/_archive/gitbook-v3/02-Architecture.md` §2.5, §2.9              |
| `1-architecture/offline-architecture.md`                | `_archive/legacy/5-reference/_archive/gitbook-v3/02-Architecture.md` §2.6                    |
| `1-architecture/network-architecture.md`                | `_archive/legacy/5-reference/_archive/gitbook-v3/09-Network.md`                              |
| `1-architecture/decisions/001-error-taxonomy.md`        | `protocols/*/src/` error implementations (derived from code review)                          |
| `1-architecture/decisions/002-in-memory-stub-guards.md` | `packages/domain/stub-guard.ts` + `packages/domain/rate-limit.ts` (derived from code review) |
| `2-specs/protocol-index.md`                             | `_archive/legacy/5-reference/_archive/gitbook-v3/` §03–§06, §09                              |
| `2-specs/data-models.md`                                | `_archive/legacy/5-reference/_archive/gitbook-v3/07-Data-Models.md`                          |
| `2-specs/operator-types.md`                             | `protocols/tradepass/SPEC.md` §2 Operator Taxonomy                                           |
| `3-engineering/code-standards.md`                       | `_archive/legacy/legacy-SOPs/protocols/code-standards/protocol.md`                           |
| `3-engineering/git-workflow.md`                         | `_archive/legacy/legacy-SOPs/protocols/git-workflow/protocol.md`                             |
| `3-engineering/testing.md`                              | `_archive/legacy/3-engineering/testing/testing-guide.md`, gitbook-v3 §12                     |
| `3-engineering/sdk-guide.md`                            | `_archive/legacy/3-engineering/guides/sdk/typescript-sdk.md`, `python-sdk.md`                |
| `3-engineering/dev-setup.md`                            | `_archive/legacy/legacy-SOPs/templates/onboarding/developer-setup.md` + monorepo structure   |
| `3-engineering/security/cryptographic-inventory.md`     | `_archive/legacy/3-engineering/security/cryptographic-inventory.md`                          |
| `3-engineering/security/threat-models.md`               | `_archive/legacy/3-engineering/security/threat-models/` (all 6 protocol files)               |
| `4-operations/runbooks/production-store-integration.md` | `_archive/legacy/4-operations/runbooks/production-store-integration.md`                      |
| `4-operations/runbooks/disaster-recovery.md`            | `_archive/legacy/4-operations/runbooks/disaster-recovery.md`                                 |
| `4-operations/runbooks/release.md`                      | `_archive/legacy/4-operations/runbooks/release-runbook.md`                                   |
| `4-operations/compliance/controls-matrix.md`            | `_archive/legacy/4-operations/compliance/controls.md`                                        |
| `4-operations/compliance/regulatory-framework.md`       | `_archive/legacy/4-operations/compliance/regulatory-framework.md`, gitbook-v3 §13            |
| `5-reference/glossary.md`                               | gitbook-v3 §14 Appendices + cross-protocol terminology (synthesized)                         |
| `5-reference/docs-writing-guide.md`                     | `_archive/legacy/legacy-SOPs/guides/docs-writing-guide.md`                                   |

---

## Archive Root

All legacy sources are preserved here — read-only, never edited:

| Archive Location                                     | Contents                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `_archive/legacy/5-reference/_archive/gitbook-v3/`   | GitBook v3 publication — 14 sections + addenda (primary source)     |
| `_archive/legacy/5-reference/_archive/specs-legacy/` | Per-protocol legacy spec drafts                                     |
| `_archive/legacy/3-engineering/`                     | Engineering guides, SDK docs, security threat models, testing guide |
| `_archive/legacy/4-operations/`                      | Operations runbooks, compliance controls, regulatory framework      |
| `_archive/legacy/legacy-SOPs/`                       | Legacy SOP protocols, guides, and templates                         |
| `_archive/repo-provisioning/`                        | Governance and signoff templates (archived from repo root)          |

---

## What Was Deleted

The following were deleted during Phase 7 (wrong-repo content or no-value stubs):

- `_archive/legacy/1-architecture/security.md` — FlowGrid54 security doc
- `_archive/legacy/1-architecture/ecosystem-tiers.md` — FIFTY-FOUR era content
- `_archive/legacy/1-architecture/tech-stack.md` — FIFTY-FOUR frontend stack
- `_archive/legacy/1-architecture/scalability.md` — LLM API cost and LangSmith content
- `_archive/legacy/1-architecture/global-south/` — FIFTY-FOUR offline arch
- `_archive/legacy/1-architecture/deployment/deployment.md` — FIFTY-FOUR GCP deployment
- `_archive/legacy/5-reference/_archive/gitbook-template-2026-02-22/` — Wrong-repo GitBook template
- `_archive/legacy/2-specs/evidence/` — CI run logs, no doc value
- `_archive/legacy/4-operations/accessibility/`, `analytics/` — Empty stubs
- `_archive/legacy/4-operations/compliance/iso27001/`, `soc2/` — Empty stubs
- `_archive/legacy/3-engineering/data/`, `devops/` — Empty stubs

---

## Reference

- [README.md](README.md)
- [glossary.md](glossary.md)
