# Specs

Per-service and cross-cutting specifications. The SOP version of this folder contains spec templates and patterns; project repos apply the structure below to their own service-specific content.

## Current Contents (SOP Templates)

| Folder                                               | Description                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [project-specification.md](project-specification.md) | Comprehensive project spec — vision, KPIs, tech requirements, timeline, risks, acceptance criteria |
| [1-product/](1-product/)                             | Product specification templates                                                                    |
| [2-design/](2-design/)                               | Design spec templates — UX flows, wireframes, component specs                                      |
| [3-frontend/](3-frontend/)                           | Frontend architecture templates                                                                    |
| [4-backend/](4-backend/)                             | Backend architecture templates                                                                     |
| [5-data/](5-data/)                                   | Data model and governance templates                                                                |
| [6-testing/](6-testing/)                             | QA strategy and test plan templates                                                                |

---

## Target Structure for Project Repos

When this SOP is applied to a project repo, `specs/` should follow this structure:

```
specs/
├── _project/          ← Cross-cutting: vision, PRD, roadmap, backlog, business model
├── products/          ← User-facing platforms and applications
│   ├── [product-a]/
│   ├── [product-b]/
│   └── [product-c]/
├── engines/           ← Internal processing, orchestration, and content pipelines
│   ├── [engine-a]/
│   └── [engine-b]/
└── infrastructure/    ← Shared infrastructure and cloud resources
```

### Grouping convention

| Group             | When to use                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `products/`       | Has a UI or is directly consumed by end users                    |
| `engines/`        | Processes, transforms, orchestrates, or moves data internally    |
| `infrastructure/` | Provisions or configures cloud resources, networking, or storage |

**Decision guide**: Ask "Who or what consumes it?"

- Users consume it → `products/`
- Other components depend on it → `engines/`
- It's a cloud resource → `infrastructure/`

### Per-service folder convention

Each service folder uses up to 10 standardized subfolders:

| #   | Folder          | Contents                                    |
| --- | --------------- | ------------------------------------------- |
| 01  | `01_context`    | Domain background, glossary, stakeholders   |
| 02  | `02_vision`     | Service vision and strategic alignment      |
| 03  | `03_product`    | Product requirements and user stories       |
| 04  | `04_experience` | UX flows, wireframes, design specs          |
| 05  | `05_specs`      | Technical specifications and ADRs           |
| 06  | `06_planning`   | Roadmap, sprint plans, milestones           |
| 07  | `07_backend`    | API design, data models, integrations       |
| 08  | `08_frontend`   | UI components, state management, routing    |
| 09  | `09_security`   | Threat models, auth, encryption, compliance |
| 10  | `10_internal`   | Decision logs, scratch notes                |

Create subfolders as content is produced — not every service needs all 10.
