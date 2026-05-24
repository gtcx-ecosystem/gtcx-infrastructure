---
title: 'Documentation Writing Guide'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['architecture', 'infrastructure', 'api', 'frontend', 'database']
review_cycle: 'quarterly'
---

# Documentation Writing Guide

How to write clear, useful documentation in the GTCX Protocol repo. Covers voice, structure, naming, linking, and common mistakes.

---

## Voice and Tone

Write for someone joining the team tomorrow. They are smart but have zero context on the project.

- **Clear over clever.** Say what you mean. Avoid idioms and metaphors that don't translate.
- **Direct over diplomatic.** "This service handles X" beats "This service is primarily responsible for the facilitation of X."
- **Active voice.** "The service validates the request" not "The request is validated by the service."
- **Second person for instructions.** "Run `pnpm install`" not "One should run `pnpm install`."
- **Professional, not stuffy.** Contractions are fine. Jargon is not fine unless you define it in the glossary.

---

## Structure Rules

### One Topic Per Document

Each document covers exactly one thing. If you find yourself writing about two unrelated topics, split them.

### Lead with the Most Important Information

The reader should know what the document is about within the first two sentences. Background comes after.

**Good:**

```markdown
# Disaster Recovery Runbook

Recovery procedures for protocol services and state stores. RTO: 4 hours. RPO: 15 minutes.

## Preconditions

...
```

**Bad:**

```markdown
# Disaster Recovery Runbook

## Background

In Q1 2026, the team decided to document recovery procedures after a tabletop exercise revealed...
```

### Use Headings as Scannable Navigation

Someone reading only the headings should understand the document's structure. Test this: collapse all sections and read just the headings.

### Tables Over Prose for Structured Data

**Good:**

```markdown
| Field    | Type   | Required | Description              |
| -------- | ------ | -------- | ------------------------ |
| `lotId`  | string | yes      | Commodity lot identifier |
| `amount` | number | yes      | Transfer amount in grams |
```

**Bad:**

### Bulleted Lists Over Paragraphs for Lists

If listing more than two items, use bullets — not a comma-separated sentence.

### Code Blocks Always Have Language Tags

````markdown
```typescript
const result = await client.tradepass.resolve(did);
```
````

````

Never use bare fenced code blocks without a language tag.

---

## Naming Conventions

- All `.md` files use **lowercase kebab-case**: `trade-matching.md`, `api-reference.md`
- `README.md` is always uppercase — the only exception
- No spaces, underscores, or camelCase in filenames
- Be descriptive: `production-store-integration.md` not `integration.md`

---

## Linking

### Always Use Relative Paths

```markdown
<!-- Good -->
See [trust model](../architecture/trust-model.md)

<!-- Bad -->
See trust model (`Users/dev/3-protocols/docs/architecture/trust-model.md`)
````

### READMEs Link to Every Child

Every `README.md` links to every document in its folder and immediate subfolders. If you create a new file, update the folder's README immediately.

### Never Duplicate Content

If two documents need the same information, one links to the other. Pick the canonical location and link from everywhere else.

```markdown
<!-- Good -->

For authentication details, see [trust-model.md](../architecture/trust-model.md).

<!-- Bad -->

[Copy-pasted paragraphs from trust-model.md]
```

---

## README Rules

Every folder in `docs/` gets a `README.md`. The README is navigation — not content.

A folder README contains exactly:

1. **One sentence** explaining what belongs in this folder
2. **A table** linking to every document in the folder
3. **"What Belongs Here" and "What Does NOT Belong Here"** sections

```markdown
# Architecture

System design, component diagrams, trust model, and ADRs.

## Contents

| Document                                                 | Description                              |
| -------------------------------------------------------- | ---------------------------------------- |
| [system-overview.md](../architecture/system-overview.md) | Three-layer stack, components, data flow |
| [decisions/](../architecture/decisions/)                 | Architectural Decision Records           |

## What Belongs Here

- System architecture and design
- ADRs

## What Does NOT Belong Here

- Implementation details → `../3-engineering/`
```

---

## When to Create vs. Update

**Create a new document when:**

- The topic is genuinely new and does not fit in any existing document
- An existing document would become unfocused if you added your content

**Update an existing document when:**

- The topic is covered but the information is incomplete or outdated
- Your addition naturally extends what is already there

**Never:**

- Create a second document covering the same topic as an existing one
- Create a `v2` of a document instead of updating the original
- Leave outdated documents in place after creating updated replacements

---

## Common Mistakes

| Mistake                                     | Problem                                                     | Fix                                                                           |
| ------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Implementation details in architecture docs | Stale the moment code changes                               | Keep implementation in code or specs; architecture describes "why" and "what" |
| Duplicating content across folders          | Updates in one place; the other becomes wrong               | Canonical location + link                                                     |
| TODO/placeholder text in committed docs     | Reader can't tell if it's a placeholder or the real content | Remove TODOs before committing                                                |
| Broken links after file moves               | Dead ends for readers                                       | After moving files, search repo for old references and update them            |
| Absolute paths in links                     | Break when repo is cloned to a different location           | Always use relative paths                                                     |
| Skipping heading levels (h1 → h3)           | Breaks document outline and accessibility                   | Sequential heading levels only: h1, h2, h3                                    |

---

## Pre-Commit Quality Checklist

Before committing any documentation:

- [ ] All links work — click every link, verify relative paths resolve
- [ ] No placeholder text — no `TODO`, `TBD`, `FIXME`, or `[fill in later]`
- [ ] Consistent heading hierarchy — h1 at top only, h2 for sections, h3 for subsections, no skipped levels
- [ ] No duplicated content — nothing copy-pasted from another document
- [ ] README updated — if you added a file, the folder README links to it
- [ ] All code blocks have language tags
- [ ] Tables are correctly formatted with aligned columns and headers
- [ ] Filename is kebab-case (except `README.md`)

---

## Reference

- [glossary.md](glossary.md)
- legacy-sources.md (`legacy-sources.md`)
