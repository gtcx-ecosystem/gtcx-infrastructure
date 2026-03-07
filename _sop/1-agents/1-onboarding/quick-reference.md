# Quick Reference — [Organization Name] SOP

> Start here. Everything you need in one place.

---

## Repo Structure

```
SOP/
├── system/              # Universal governing layer
│   ├── protocols/       # Mandatory rules — always win
│   ├── guides/          # Cross-project how-to workflows
│   ├── standards/       # Quality standards and engineering principles
│   └── frameworks/      # Evaluation and maturity frameworks
│
├── repo/                # Scaffolding — copy into project repos
│   ├── agents/          # ← You are here
│   │   ├── onboarding/  # Quick-reference, setup, contributor guide
│   │   ├── roles/       # Role definitions
│   │   ├── structure/   # Team org charts
│   │   ├── workflows/   # Operational workflows
│   │   └── governance/  # Decision-making and approval processes
│   ├── docs/            # Product, company, engineering, devops, specs
│   ├── agile/           # Sprints, audits, reports, incidents, hygiene
│   ├── sessions/        # Session protocols, transcripts, insights
│   ├── release/         # Release checklists, versioning, legal
│   ├── metrics/         # Metrics and dashboard templates
│   ├── examples/        # Filled-in reference examples
│   ├── scripts/         # Repo hygiene scripts
│   └── .gtcx/
│       ├── decisions/   # Architecture Decision Records (ADRs)
│       └── principles/  # Engineering principles
│
├── AGENTS.md
├── CLAUDE.md
└── agent-guide.md
```

---

## Key Documents

| What                          | Where                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| Engineering standards         | `system/3-standards/`                                        |
| Architecture decisions (ADRs) | `repo/.gtcx/decisions/`                                      |
| Engineering principles        | `repo/.gtcx/principles/`                                     |
| System design                 | `repo/2-docs/3-engineering/2-system-design/`                 |
| Tech stack                    | `repo/2-docs/3-engineering/3-technology-stack/tech-stack.md` |
| Deployment                    | `repo/2-docs/3-engineering/4-deployment/deployment.md`       |
| Agent guide                   | `agent-guide.md`                                             |
| Audit templates               | `repo/3-agile/4-audits/templates/`                           |
| Onboarding templates          | `repo/1-agents/onboarding/`                                  |
| Role definitions              | `repo/1-agents/roles/`                                       |
| Governance policies           | `repo/1-agents/governance/`                                  |

---

## Onboarding Checklist

- [ ] Read this file
- [ ] Read the [Service Overview](service-overview.md) for your assigned service
- [ ] Complete [Developer Setup](developer-setup.md)
- [ ] Read the [Contributor Guide](contributor-guide.md)
- [ ] Review relevant ADRs in `repo/.gtcx/decisions/`
- [ ] Review team [Roles](../roles/README.md) and [Workflows](../workflows/README.md)

---

## Naming Conventions

| Pattern                  | Meaning                               |
| ------------------------ | ------------------------------------- |
| `[Organization Name]`    | The organization using this SOP       |
| `[Platform A–H]`         | Named products or platforms           |
| `[AI System]`            | Primary AI agent or system            |
| `[Index A–D]`            | Data indices or scoring products      |
| `[org]-api`, `[org]-web` | Service repository slugs              |
| `{placeholder}`          | Template field to fill in per-service |

---

_See `agent-guide.md` at the repo root for AI-specific operating instructions._
