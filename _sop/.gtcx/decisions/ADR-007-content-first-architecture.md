# ADR-004: Content-First Architecture

## Status

Accepted

## Date

2026-01-27

## Context

[Organization Name] is fundamentally a **media/intelligence/publishing ecosystem**, not a traditional software product. Traditional software architecture patterns (MVC, microservices, etc.) optimize for code organization, not content production.

Our architecture must optimize for:

- Content production velocity
- Editorial quality control
- Multi-platform distribution
- Content reuse and repurposing
- Audience segmentation

## Decision

We adopt a **Content-First Architecture** where:

### 1. Structure Reflects Content Flow

```
Intelligence (what we know)
    ↓
Publishing (how we share it)
    ↓
Platforms (where audiences engage)
```

Directory structure mirrors content lifecycle:

```
[org-name]/
├── intelligence/     # Raw knowledge, indices, research
├── publishing/       # Production, editorial, distribution
├── platforms/        # Audience-facing products
└── organization/     # How we work
```

### 2. Documentation Lives With Function

Instead of centralized `docs/` folder:

| Content Type        | Location                 |
| ------------------- | ------------------------ |
| Platform specs      | `/platforms/{platform}/` |
| Agent configs       | `/publishing/agentic/`   |
| Index methodology   | `/intelligence/indices/` |
| Editorial standards | `/publishing/editorial/` |

### 3. Platforms Have Distinct Identity

Each platform is a complete product:

```
platforms/atlas/
├── README.md           # What [Platform D] is
├── EDITORIAL.md        # [Platform D] voice and standards
├── templates/          # Content templates
└── examples/           # Sample content
```

### 4. Content Types Drive Workflows

Workflows are organized by content output, not technical function:

```yaml
workflows/
├── regulatory-brief.yaml    # → [Platform E]
├── news-digest.yaml         # → [Platform D]
├── breaking-alert.yaml      # → [Platform D]
└── sector-report.yaml       # → [Platform C]
```

## Consequences

### Benefits

1. **Intuitive organization**: New team members understand structure immediately
2. **Content discoverability**: Find everything about a platform in one place
3. **Editorial clarity**: Standards live next to content they govern
4. **Independent evolution**: Platforms can evolve independently

### Drawbacks

1. **Distributed documentation**: No single source of truth
2. **Cross-platform coordination**: Shared standards need explicit maintenance
3. **Navigation complexity**: More directories to understand

## Alternatives Considered

### Traditional `/docs` Folder

- All documentation centralized
- **Rejected**: Content divorced from context

### Feature-Based Organization

- Organize by technical capability
- **Rejected**: Doesn't reflect content production reality

### Monolithic Content Database

- All content in single system
- **Rejected**: Loses platform identity and voice

## References

- [Repository Structure](../../README.md)
- [repo/2-docs/3-engineering/README.md](<(../../2-docs/engineering/README.md)>)
- [repo/2-docs/5-specs/README.md](<(../../2-docs/specs/README.md)>)
