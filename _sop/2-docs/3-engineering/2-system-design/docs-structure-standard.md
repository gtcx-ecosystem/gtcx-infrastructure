# SOP/2-docs Structure Standard

> Canonical structure for `SOP/2-docs/` across all {organization-name} repositories.

This standard defines how documentation is organized inside `SOP/2-docs/` in every repo. The structure is designed from first principles: 6 folders, each answering a distinct question. No project-specific folders at the root level. Every repo uses the same skeleton — only the content inside `specs/` differs.

`SOP/2-docs/` is the documentation subfolder within the repo's `SOP/` folder. For the full SOP structure (all numbered subfolders), see `sop-structure-standard.md`.

---

## Structure

```
SOP/2-docs/
├── README.md           ← This file (standard + guide)
├── architecture/       ← How the system works
├── specs/              ← What we're building
├── engineering/        ← How to build it
├── operations/         ← How to run it
├── reference/          ← Where to look things up
└── gitbook/            ← What users see (external docs, omit if not applicable)
```

---

## Folder Definitions

### `architecture/` — How the system works

System design, data models, design principles, and architectural decisions.

| Subfolder       | Purpose                                                                   | Create when...                       |
| --------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| `decisions/`    | Architecture Decision Records (ADRs)                                      | First significant technical decision |
| `data-models/`  | Database schemas, content models, data dictionaries                       | First data model is designed         |
| `deployment/`   | Deployment architecture, cloud topology, environments                     | Infrastructure is provisioned        |
| `monitoring/`   | Observability, alerting, SLOs, dashboards                                 | First production deployment          |
| `principles/`   | Design principles that shape how products are built                       | Core principles are established      |
| `global-south/` | Offline-first, low-bandwidth, multi-language, SMS/USSD design constraints | Building for frontier markets        |

**README.md** is the single source of truth for system architecture. No separate overview files — one document, kept current.

**What belongs here**: System diagrams, tech stack decisions, ADRs, API architecture, data flow diagrams, security architecture, scalability considerations, design principles.

**What does NOT belong here**: API endpoint docs for external users (→ `SOP/2-docs/gitbook/api/`), per-service specs (→ `specs/`).

---

### `specs/` — What we're building

Per-service specifications, project-level planning, and all project-specific content.

| Item                 | Purpose                                                                   | Create when...                   |
| -------------------- | ------------------------------------------------------------------------- | -------------------------------- |
| `_project/`          | Cross-cutting project docs (see standard folders below)                   | Project is initiated             |
| `{group}/`           | Logical grouping of services (e.g., `products/`, `engines/`, `platform/`) | First service is planned         |
| `{group}/{service}/` | Per-service folder with standardized subfolders                           | A new service/product is planned |

**`_project/` standard folders** (every repo should have these):

| Folder      | Question it answers                                                        |
| ----------- | -------------------------------------------------------------------------- |
| `overview/` | What is this project and why does it exist? (vision, prd, team, risks)     |
| `planning/` | When are we building it and in what order? (roadmap, backlog, sprint plan) |

Optional folders: `economics/`, `go-to-market/`, `partnerships/` — use whichever apply to your project.

**Standard groups** (use whichever apply to your repo):

| Group             | Use when...                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `products/`       | It has a UI or is directly consumed by end users                    |
| `engines/`        | It processes, transforms, orchestrates, or moves data internally    |
| `infrastructure/` | It provisions or configures cloud resources, networking, or storage |

**Per-service subfolders** follow a standardized 10-folder convention: `01_context/`, `02_vision/`, `03_product/`, `04_experience/`, `05_specs/`, `06_planning/`, `07_backend/`, `08_frontend/`, `09_security/`, `10_internal/`.

**This is the ONE folder whose contents differ per repo.** Everything project-specific lives here — product vision, business strategy, brand guidelines, service specs, sprint plans. The other 5 root folders are universal.

**What belongs here**: Product requirements, service specifications, roadmaps, sprint plans, business model, brand guidelines, cross-cutting project documents.

**What does NOT belong here**: System architecture (→ `architecture/`), how-to guides for developers (→ `engineering/`).

---

### `engineering/` — How to build it

Developer setup, coding standards, testing, security, and CI/CD.

| Subfolder   | Purpose                                                     | Create when...                   |
| ----------- | ----------------------------------------------------------- | -------------------------------- |
| `guides/`   | Developer onboarding, contributor handbook, how-tos         | First external contributor joins |
| `security/` | Security policies, threat models, vulnerability management  | Security review is conducted     |
| `testing/`  | QA strategy, test coverage requirements, testing frameworks | Testing standards are defined    |
| `devops/`   | CI/CD pipelines, infrastructure as code                     | First pipeline is configured     |
| `data/`     | Data governance, data dictionary, ETL pipelines             | Data workflows are formalized    |

**What belongs here**: Dev environment setup, coding standards, code review process, testing strategy, security policies, CI/CD pipeline docs, data governance.

**What does NOT belong here**: Deployment runbooks (→ `operations/`), API docs for users (→ `gitbook/`), design principles (→ `architecture/`).

---

### `operations/` — How to run it

Incident response, compliance, organizational structure, and day-to-day operations.

| Subfolder        | Purpose                                              | Create when...                         |
| ---------------- | ---------------------------------------------------- | -------------------------------------- |
| `organization/`  | Team structure, roles, governance, workflows         | Team roles are formalized              |
| `runbooks/`      | Incident response, escalation, on-call procedures    | First production deployment            |
| `compliance/`    | Regulatory requirements, data classification, audits | Compliance requirements are identified |
| `analytics/`     | KPI definitions, metrics framework, dashboards       | Metrics are tracked                    |
| `accessibility/` | WCAG compliance, accessibility testing               | Accessibility standards are adopted    |

**What belongs here**: Incident response, org structure, compliance requirements, SLAs, on-call rotation, KPI tracking, accessibility standards.

**What does NOT belong here**: CI/CD pipeline config (→ `engineering/`), system architecture (→ `architecture/`), deployment architecture (→ `architecture/deployment/`).

---

### `reference/` — Where to look things up

Archives, research, and reference material.

| Subfolder    | Purpose                                                   | Create when...                  |
| ------------ | --------------------------------------------------------- | ------------------------------- |
| `archived/`  | Historical documents, deprecated designs                  | First document is superseded    |
| `research/`  | Competitive analysis, industry landscape, market research | First research is conducted     |
| `glossary/`  | Domain terminology, acronyms                              | Terminology needs standardizing |
| `changelog/` | Version history, release notes                            | First release is shipped        |
| `legal/`     | Terms of service, privacy policy, DPAs                    | Legal docs are drafted          |

**What belongs here**: Anything someone would "look up" rather than read end-to-end. Historical docs, competitive research, terminology, release notes, legal.

**What does NOT belong here**: Active architecture docs (→ `architecture/`), product specs (→ `specs/`).

---

### `gitbook/` — What users see

External-facing documentation published via GitBook. This folder is the GitBook content root.

**Structure follows GitBook conventions**: `book.json`, `summary.md`, and content organized by audience need (getting-started, api, platforms, etc.).

**What belongs here**: User-facing guides, API reference, getting started tutorials, product documentation for external audiences, FAQ, support resources.

**What does NOT belong here**: Internal architecture (→ `architecture/`), internal specs (→ `specs/`), developer contributing guides (→ `engineering/`).

---

## Principles

### 1. Six folders, one question each

Every folder answers exactly one question. If you can't decide where something goes, ask: "What question does this document answer?" and file it accordingly.

| Question                      | Folder          |
| ----------------------------- | --------------- |
| How does the system work?     | `architecture/` |
| What are we building?         | `specs/`        |
| How do I build/contribute?    | `engineering/`  |
| How do I run/maintain this?   | `operations/`   |
| Where do I look something up? | `reference/`    |
| What do external users need?  | `gitbook/`      |

### 2. Pre-create all subfolders

Create every defined subfolder upfront, even if empty. The folder structure itself communicates the standard — a contributor should see where their docs go without reading a README first. Use `.gitkeep` to track empty folders in git.

### 3. One source of truth

Every topic has exactly one home. If content could fit two folders, pick the one closest to its primary audience. Never duplicate content across folders.

### 4. Project-specific content lives in `specs/`

The other 5 folders have universal subfolders that work across any repo. Only `specs/` contains project-specific names (service names, product names, business units). This is by design.

### 5. READMEs are navigation

Every folder's README explains what belongs there and links to its contents. A reader should be able to navigate the entire docs tree by following README links without guessing.

---

## Adopting This Standard

To apply this structure to a new repository:

```bash
mkdir -p SOP/2-docs/{architecture/{decisions,data-models,deployment,monitoring,principles,global-south},specs/{_project/{overview,planning},products,engines,infrastructure},engineering/{guides,security,testing,devops,data},operations/{organization,runbooks,compliance,analytics,accessibility},reference/{archived,research,glossary,changelog,legal},gitbook}
```

Then:

1. Copy this file into `SOP/2-docs/README.md`
2. Add a README to each subfolder explaining what belongs there
3. Add `.gitkeep` to empty subfolders so git tracks them

---

_Standard version: {version} — {month} {year}_
