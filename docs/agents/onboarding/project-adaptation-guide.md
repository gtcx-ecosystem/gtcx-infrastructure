---
title: 'Project Adaptation Guide'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'testing']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Project Adaptation Guide

How to adapt SOP templates for a new or existing project.

## Quick Start

### New project

1. Copy the relevant SOP scaffolding into your project repo
2. Complete the project specification template (`repo/2-docs/5-specs/`)
3. Select templates from `repo/2-docs/` and `repo/3-agile/` based on project type
4. Customize placeholders — replace `{curly-brace}` fields with project values

### Existing project

1. Audit current documentation against available templates
2. Identify gaps using the SOP template index
3. Add missing documentation using the appropriate templates
4. Standardize existing docs to match template structure

---

## Customization Levels

### Level 1 — Required

- [ ] Replace all `{placeholder}` fields with project-specific values
- [ ] Update document headers
- [ ] Complete the project specification

### Level 2 — Recommended

- [ ] Select templates appropriate to project type
- [ ] Customize user story templates
- [ ] Configure quality assurance processes
- [ ] Set up compliance framework if applicable

### Level 3 — Optional

- [ ] Create project-specific template extensions
- [ ] Add custom sections to existing templates
- [ ] Integrate with project-specific tooling

---

## Template Selection by Project Type

### Backend / API project

Essential templates:

- `repo/2-docs/5-specs/4-backend/backend-architecture.md`
- `repo/2-docs/3-engineering/2-system-design/api-design-template.md`
- `repo/2-docs/3-engineering/2-system-design/database-schema.md`
- `repo/3-agile/2-scrum-board/6-testing/`

### Frontend / mobile project

Essential templates:

- `repo/2-docs/5-specs/3-frontend/frontend-architecture.md`
- `repo/2-docs/5-specs/2-design/`
- `repo/3-agile/2-scrum-board/4-stories/story-template.md`

### Full-stack product

Essential templates:

- `repo/2-docs/5-specs/1-product/prd-template.md`
- `repo/2-docs/5-specs/4-backend/backend-architecture.md`
- `repo/2-docs/5-specs/3-frontend/frontend-architecture.md`
- `repo/3-agile/2-scrum-board/` (full sprint workflow)

### Compliance / regulated project

Essential templates:

- `repo/2-docs/3-engineering/5-compliance/`
- `repo/2-docs/3-engineering/7-security/`
- `repo/3-agile/4-audits/`

### Marketing / community project

Essential templates:

- `repo/2-docs/2-company/2-sales-marketing/`
- `repo/2-docs/1-product/`

---

## Documentation Workflow

### Phase 1 — Foundation (week 1)

- [ ] Copy scaffolding into project
- [ ] Complete project specification
- [ ] Select relevant section templates
- [ ] Set up basic documentation structure

### Phase 2 — Planning (week 2)

- [ ] Create user stories and epics
- [ ] Define technical architecture
- [ ] Establish compliance requirements
- [ ] Set up quality processes

### Phase 3 — Execution (ongoing)

- [ ] Use sprint templates for ceremonies
- [ ] Run retrospectives using templates
- [ ] Keep documentation current with project state

---

## Common Issues

| Issue                               | Solution                                              |
| ----------------------------------- | ----------------------------------------------------- |
| Too many templates                  | Start with essentials only, add as needed             |
| Templates don't fit                 | Customize heavily; create project-specific extensions |
| Documentation goes stale            | Build documentation updates into sprint ceremonies    |
| Team confusion about which template | Use the type-based selection guide above              |
