# Repo Root Structure Standard

> What belongs at the root of every repository — and what does not.

This standard defines the permitted structure at the root level of every {organization-name} repository. It complements the docs structure standard (`docs-structure-standard.md`), which governs what goes inside `docs/`.

---

## Required (Every Repo)

These must be present in every repository, no exceptions.

| Item         | Notes                                                                 |
| ------------ | --------------------------------------------------------------------- |
| `README.md`  | Root README following `repos-readme-template.md`                      |
| `CLAUDE.md`  | AI agent orientation — project-specific context and rules             |
| `LICENSE`    | Standard open-source or proprietary license file                      |
| `.gitignore` | Must include: `node_modules/`, `dist/`, `build/`, `coverage/`, `.env` |
| `_sop/`      | Operational documentation following the SOP structure standard        |

---

## Source Folders (Repo-Type Specific)

Use only the source folders that match your repo type. Do not invent names.

### Monorepo (apps + packages + services)

```
apps/           ← deployable applications (Next.js, Expo, etc.)
packages/       ← shared libraries imported by apps or services
services/       ← backend services (APIs, workers, crons)
```

Use when the repo ships multiple deployable units with shared code.

### Library / SDK Repo

```
packages/       ← one subfolder per package or crate
```

Use when the repo's only output is importable packages.

### Protocol / Spec Repo

```
protocols/      ← one subfolder per protocol definition
```

Use when the repo defines canonical specifications or schemas.

### Infrastructure Repo

```
infra/          ← Terraform, K8s manifests, Helm charts
```

Use when the repo provisions or configures infrastructure.

### Single-Service Repo

```
src/            ← application source
```

Use when the repo is a single backend service.

### Web App (Next.js / framework)

```
app/            ← Next.js App Router pages and layouts
components/     ← React component library
hooks/          ← Custom React hooks
lib/            ← Utility functions and shared logic
public/         ← Static assets served at root
```

---

## Allowed Support Folders

These may exist at root when genuinely needed. They support the source code but are not source themselves.

| Folder              | Use when...                                          |
| ------------------- | ---------------------------------------------------- |
| `scripts/`          | Build scripts, automation, codegen, seed scripts     |
| `tools/`            | Dev tooling — linters, generators, CLI utilities     |
| `tests/` or `test/` | Integration or e2e tests that span multiple packages |
| `benchmarks/`       | Performance benchmarks                               |
| `perf/`             | Performance profiling tests                          |
| `rust/`             | Rust workspace root (when repo mixes TS and Rust)    |

---

## Allowed Root Files

Config files may exist at root. Keep them minimal — prefer moving config into package-level files when possible.

| File                                   | Notes                           |
| -------------------------------------- | ------------------------------- |
| `package.json`                         | Required for Node.js repos      |
| `pnpm-workspace.yaml`                  | Required for pnpm workspaces    |
| `turbo.json`                           | Required for Turborepo          |
| `tsconfig.json`                        | TypeScript base config          |
| `Cargo.toml`                           | Rust workspace manifest         |
| `Dockerfile`                           | Root-level Docker build         |
| `docker-compose.yml`                   | Local dev environment           |
| `*.config.ts/js/mjs`                   | Vitest, ESLint, PostCSS, etc.   |
| `pnpm-lock.yaml` / `package-lock.json` | Lockfile (never commit both)    |
| `.env.example`                         | Template — never `.env`         |
| `CHANGELOG.md`                         | Version history (if maintained) |
| `CONTRIBUTING.md`                      | Contributor guide               |
| `SECURITY.md`                          | Vulnerability disclosure policy |

---

## Not Allowed at Root

These patterns violate the standard and must be removed or relocated.

| Pattern                                  | Problem                             | Correct location                                            |
| ---------------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| `agile-pm/`                              | Superseded by SOP                   | → `_sop/3-agile/`                                           |
| `docs/`                                  | Replaced by SOP                     | → `_sop/` following the SOP structure standard              |
| `SOPs/`                                  | Wrong casing / ad-hoc naming        | → rename to `_sop/` following the standard                  |
| `quality/`                               | Not a recognized root folder        | → `_sop/2-docs/` or `_sop/3-agile/`                         |
| `coverage/`                              | Build artifact — must be gitignored | Add to `.gitignore`, never commit                           |
| `dist/`, `build/`, `out/`                | Build artifacts                     | Add to `.gitignore`, never commit                           |
| `*.png`, `*.jpg` at root                 | Loose media files                   | → `docs/` (internal) or `public/` (web app)                 |
| `repo-provisioning/`                     | Ad-hoc naming                       | → `scripts/` or `infra/`                                    |
| `node_modules/`                          | Dependency artifact                 | Must be gitignored                                          |
| Versioned folders (`v2/`, `old-src/`)    | Informal versioning                 | Use git tags; archive content in `docs/reference/archived/` |
| Folders named after projects or features | Project-specific root pollution     | Belongs inside a recognized source folder                   |

---

## Naming Conventions

- All folder names: **lowercase kebab-case**
- No underscores at root level (`my_service/` → `my-service/`)
- No versioned names at root (`v2/`, `legacy/`)
- No abbreviations that aren't universally understood (`svc/`, `fe/`, `be/`)

---

## Gitignore Minimum

Every `.gitignore` must exclude:

```
node_modules/
dist/
build/
out/
coverage/
.env
*.log
.DS_Store
```

---

## Applying This Standard

When auditing an existing repo:

1. List all root-level items: `ls -la`
2. For each folder: does it match a recognized pattern above?
3. If not: determine where its contents belong and move them
4. For files: is it a recognized config or required file?
5. If not: move to the appropriate location or delete
6. Update `README.md` structure diagram to reflect the actual root

Do not delete files before reading them. Map content to a destination first, confirm with a reviewer, then execute the move.

---

_Standard version: 1.0 — March 2026_
