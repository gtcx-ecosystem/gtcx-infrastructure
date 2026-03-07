# ADR-010: Service Taxonomy - Four-Tier Model

## Status

Accepted

## Date

2026-01-26

## Context

As [Organization Name] grows, we need clarity on where capabilities live. A generic "services" folder creates ambiguity. Instead, capabilities are organized into a four-tier taxonomy.

## Decision

**[Organization Name] uses a four-tier taxonomy:**

```
TIER 1: INTELLIGENCE  → intelligence/     (What we know)
TIER 2: PUBLISHING    → publishing/       (How we share)
TIER 3: PLATFORMS     → platforms/        (Where audiences engage)
TIER 4: OPERATIONS    → organization/     (How we work)
```

Each capability maps to its appropriate tier based on:

1. Primary responsibility
2. Audience served
3. Content flow position
4. Team ownership

## Rationale

### 1. "Services" Is an Overloaded Term

Traditional "services" conflates:

- Deployment units
- Business capabilities
- Communication patterns
- Team boundaries

This ambiguity causes duplicate logic and unclear ownership.

### 2. Content-First Architecture Changes Everything

Traditional services validate data through network calls. [Organization Name] validates through **content authority** and **editorial process**.

This means:

- **Intelligence is the core abstraction, not services**
- Services that expose intelligence are "platforms"
- Services that produce intelligence are "publishing"

### 3. Clear Boundaries Enable Scale

| Tier         | Characteristics                             |
| ------------ | ------------------------------------------- |
| Intelligence | Raw data, indices, research                 |
| Publishing   | Content production, editorial, distribution |
| Platforms    | Audience-facing, access control, experience |
| Operations   | Workflows, standards, governance            |

## Service Mapping

Where capabilities live:

| Capability            | [Organization Name] Location | Rationale        |
| --------------------- | ---------------------------- | ---------------- |
| Index calculation     | `intelligence/indices/`      | Core data        |
| Research papers       | `intelligence/research/`     | Source knowledge |
| Content production    | `publishing/agentic/`        | AI workflows     |
| Editorial standards   | `publishing/editorial/`      | Quality control  |
| News distribution     | `publishing/distribution/`   | Channel delivery |
| Subscriber experience | `platforms/[platform-b]/`    | Audience-facing  |
| API access            | `platforms/[platform-g]/`    | Data delivery    |
| Team workflows        | `organization/workflows/`    | Operations       |

## Decision Tree: Where Does X Go?

```
Is it source data or research?
├── YES → intelligence/
└── NO  → Is it content production or distribution?
          ├── YES → publishing/
          └── NO  → Is it audience-facing?
                    ├── YES → platforms/
                    └── NO  → organization/ or technology/
```

## Consequences

### Positive

1. **Clear boundaries** — Each capability has one home
2. **Content flow alignment** — Structure reflects how content moves
3. **Easier onboarding** — New team members understand the hierarchy
4. **Consistent patterns** — Each tier has consistent organization

### Negative

1. **Learning curve** — Team must understand four-tier model
2. **Cross-tier features** — Some features span tiers
3. **Naming discipline** — Must resist creating new top-level folders

## References

- Adapted from [Protocol Partner] ADR-0015
- [Content-First Architecture](./ADR-007-content-first-architecture.md)
- [Package Boundaries](./ADR-006-package-boundaries.md)
