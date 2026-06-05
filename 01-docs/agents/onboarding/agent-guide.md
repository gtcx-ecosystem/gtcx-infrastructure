---
title: 'Agent Guide'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'compliance', 'infrastructure', 'api', 'frontend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

> [!WARNING]
> **DEPRECATED — see [orientation.md](./orientation.md).**
> This document overlaps with the canonical onboarding path and is kept
> only so existing inbound links don't 404. New agents should start at
> orientation.md. Content here may drift; trust orientation.md when in doubt.

# Agent Guide

Guidelines for AI agents working in any project repo that uses this SOP structure.

## Core Principles

- Work within designated folders only — never create files outside the project scope
- Follow naming conventions — lowercase-with-hyphens for files and directories, `README.md` capitalized
- Read files before modifying them
- Respect existing structure — understand a file's purpose before changing it

## Agile Framework

### Sprint Structure

- **Sprint duration**: 2 weeks (10 working days)
- **Ceremonies**: planning, daily standup, review, retrospective
- **Artifacts**: backlog, sprint backlog, increment

### User Story Format

```
As a {user-type}
I want {functionality}
So that {benefit}
```

### Acceptance Criteria

- Must be testable
- Clear and unambiguous
- Business-focused
- Measurable outcomes

## Naming Conventions

- **Files**: `lowercase-with-hyphens.md`
- **Directories**: `lowercase-with-hyphens/`
- **READMEs**: `README.md` (always capitalized)

## Workflow Protocol

### Before making changes

1. Confirm you are in the correct project folder
2. Read what is already there
3. Plan the change before implementing

### During implementation

1. Build incrementally
2. Document changes as you go

### After changes

1. Verify no files were misplaced
2. Update the nearest README index if new files were added

## Template Usage

### Customization

- Replace `{curly-brace}` placeholders with project-specific values
- Remove sections that do not apply
- Do not change the structural organization of templates

## Quality Standards

- Clear, concise language — no filler
- Consistent formatting
- Valid markdown syntax
- README index updated whenever a new file is added

## Escalation

When to ask for guidance:

- Unclear project requirements
- Complex structural changes
- Security or compliance concerns

Document the issue, your planned approach, and the specific question before escalating.
