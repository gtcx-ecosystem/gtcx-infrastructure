---
title: 'ADR-001: Monorepo Structure'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'api', 'frontend', 'database']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-001: Monorepo Structure

## Status

Accepted (inherited from [Protocol Partner])

## Date

2026-01-19 (original); 2026-01-27 (adapted for [org-name])

## Context

[Organization Name] inherits the monorepo architecture pattern from the [Protocol Partner] ecosystem. As a media/intelligence platform, the structure is adapted for content production rather than protocol implementation.

## Decision

We adopt a **documentation-first monorepo** with the following structure:

```
[org-name]/
├── intelligence/            # What we know
│   ├── indices/             # [Index A], [Index B], [Intelligence Product]
│   ├── research/            # Themes and papers
│   └── knowledge-base/      # Entities, glossary
├── publishing/              # How we share it
│   ├── editorial/           # Voice, style guides
│   ├── content-types/       # Templates
│   ├── agentic/             # AI production
│   └── distribution/        # Channels
├── platforms/               # Where audiences engage
│   ├── [platform-a]/           # Registry
│   ├── [platform-b]/           # Intelligence
│   └── ...                  # Other platforms
├── organization/            # How we work
├── technology/              # Infrastructure
├── business/                # Commercial
├── reference/               # Context
├── apps/                    # Application code (future)
├── 03-platform/packages/                # Shared libraries (future)
└── 03-platform/scripts/                 # Automation
```

### Key Principles

1. **Documentation is primary**: Most content is documentation, not code
2. **Flat structure**: Minimize nesting depth for discoverability
3. **Function-organized**: Structure follows media company functions
4. **Migration-ready**: Structure supports future code additions

## Consequences

### Benefits

1. **Media-appropriate**: Structure reflects how newsrooms and intelligence operations work
2. **Discoverable**: Clear paths to specific content types
3. **Scalable**: Can add platforms, indices, content types without restructuring
4. **Integration-ready**: Clear connection points to [Protocol Partner]

### Drawbacks

1. **Not code-centric**: Developers may initially look for 03-platform/src/, apps/
2. **Documentation overhead**: Requires discipline to maintain organization
3. **Future migration**: Will need to add app structure when code begins

## Alternatives Considered

### Traditional Software Structure (01-docs/, 03-platform/src/, etc.)

- **Pros**: Familiar to developers
- **Cons**: Doesn't reflect media company operations
- **Decision**: Function over convention

### Single 01-docs/ Folder

- **Pros**: Simpler
- **Cons**: Buries platform and intelligence structure
- **Decision**: Top-level visibility for key functions

## References

- [Original ADR-001 from [Protocol Partner]](https://github.com/gtcx/gtcx/01-docs/02-architecture/decisions/ADR-001-monorepo-structure.md)
