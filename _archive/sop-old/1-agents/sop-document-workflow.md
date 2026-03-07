# Guide: SOP Document Workflow

How to create, update, and place SOP documents in this repo — and every repo in the GTCX ecosystem.

---

## The Non-Negotiable Rule

**The ecosystem template library is the source of truth for all SOP document structure.**

Template library location: `/Users/amanianai/Sites/SOP/`

Every new SOP document must match the structure of the corresponding template in that library. Not the structure of the legacy archive. Not what you think makes sense. Not what the source content uses. The template.

---

## Onboarding a New Repo

Before any SOP content is created in a repo, the seven-phase onboarding process must complete in order. The canonical guide is at `/Users/amanianai/Sites/SOP/system/2-guides/repo-sop-onboarding.md`.

**SOP is not brought into the repo until Phase 5 — after the archive and audit are complete.**

| Phase       | What happens                                                               |
| ----------- | -------------------------------------------------------------------------- |
| Phase 1     | Repo hygiene — naming, READMEs, broken links                               |
| Phase 2     | Archive all legacy docs into `_archive/`                                   |
| Phase 3     | Audit every file in `_archive/`                                            |
| Phase 4     | Triage — assign a disposition to every file                                |
| **Phase 5** | **SOP structure is brought in; content plan created**                      |
| Phase 6     | Draft new content into every SOP section — all folders, not just `2-docs/` |
| Phase 7     | Delete wrong-repo and superseded content from archive                      |

Do not create SOP folders or draft content before Phase 5. Do not skip the plan in Phase 5 before writing in Phase 6.

---

## Correct Workflow (for existing SOP repos)

### Step 1: Find the Template

Before writing anything, find the matching template in the ecosystem library:

| Document type          | Template location     |
| ---------------------- | --------------------- |
| Agent guides           | `system/2-guides/`    |
| Protocol specs         | `system/1-protocols/` |
| Per-repo SOP structure | `repo/`               |

If no exact match exists, find the closest structural analog and use it.

### Step 2: Use the Template Structure

Copy the template's heading hierarchy, section names, and ordering exactly. This is what consistency means — every code review guide across every repo has the same sections in the same order.

- Use `# Guide: [Title]` for guide documents
- Named `## Section` headers (no numbering)
- `## Step N: Name` for procedural flows
- `## Reference` as the final section — not `_Sources:_`, not `_See also:_`
- Separate major sections with `---` dividers when the template uses them

### Step 3: Fill with Content

Use source material from `_archive/` — the legacy content for this repo — to fill in the template. Bring over the substance: the facts, the tables, the code examples, the specific thresholds. Do not bring over the structure.

If the archived content has sections the template does not, check whether those sections warrant adding to the template. If yes, update the ecosystem template first, then use the updated structure here.

### Step 4: Place the File

Put the file in the correct `_sop/` subfolder:

| Content                                           | Folder                                  |
| ------------------------------------------------- | --------------------------------------- |
| Agent orientation, safety rules, session workflow | `_sop/1-agents/`                        |
| Architecture decisions (ADRs)                     | `_sop/2-docs/1-architecture/decisions/` |
| Protocol specs and integration contracts          | `_sop/2-docs/2-specs/`                  |
| Engineering guides, code standards, testing       | `_sop/2-docs/3-engineering/`            |
| Operations runbooks, compliance, monitoring       | `_sop/2-docs/4-operations/`             |
| Reference docs, writing guides                    | `_sop/2-docs/5-reference/`              |
| Session handoff docs                              | `_sop/4-sessions/`                      |
| Metrics and performance targets                   | `_sop/6-metrics/`                       |

---

## Archive Placement Rule

All legacy content belongs in `_archive/`. Never inside the active `_sop/` folder.

```
_archive/             ← temporary, lives at repo root during migration
  legacy/
  legacy-SOPs/
  repo-provisioning/
_sop/                 ← the only docs folder
  1-agents/
  2-docs/
  ...
```

Content inside `_sop/` is canonical and agent-readable. Content inside `_archive/` is historical reference. If you are unsure whether content belongs in `_sop/` or `_archive/`, ask: would an agent reading this for the first time find it actionable and current? If yes, `_sop/`. If no, `_archive/`.

---

## What Not to Do

| Wrong                                                    | Why                                                                               |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Using archive content structure as the new doc structure | Creates inconsistency across repos. Agents can't rely on predictable structure.   |
| Placing legacy content inside `_sop/`                    | Mixes historical and active documentation. Agents can't tell what is current.     |
| Writing a new doc without checking the template library  | Drift accumulates. After ten repos, ten different formats.                        |
| Updating `_sop/` without a corresponding template update | If the change is worth making here, it is worth making in the ecosystem template. |

---

## Checking Your Work

Before committing new or updated SOP docs:

1. Confirm the document structure matches the ecosystem template
2. Run the markdown link checker: `node scripts/check-markdown-links.mjs`
3. Verify the document appears in the correct README table for its folder

---

## Reference

- [orientation.md](orientation.md)
- [context-recovery.md](context-recovery.md)
- [\_sop/2-docs/5-reference/docs-writing-guide.md](../2-docs/5-reference/docs-writing-guide.md)
- Ecosystem template library: `/Users/amanianai/Sites/SOP/`
