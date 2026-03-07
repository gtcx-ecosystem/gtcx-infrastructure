# Repo Hygiene

## Purpose

Keeping [Organization Name] repositories clean, secure, and maintainable. A well-maintained repository reduces onboarding friction, prevents security incidents, and ensures consistent quality across the ecosystem.

## Standards

1. **.gitignore coverage** — Must ignore: `node_modules/`, `dist/`, `.next/`, `.env`, `.env.*`, `coverage/`, `__pycache__/`, `.venv/`, `*.log`, `.DS_Store`.
2. **No committed secrets** — No credentials, API keys, tokens, or `.env` files in the repository. Use `.env.example` with placeholder values.
3. **No large binaries** — Binary files (images, videos, compiled assets) should not be committed to Git history. Use Git LFS or external storage.
4. **Branch naming** — All branches follow the convention: `feature/{description}`, `fix/{description}`, `chore/{description}`, `release/{version}`.
5. **Conventional commits** — Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): description`.
6. **README.md at root** — Every repository must have a `README.md` at the root with project name, description, setup instructions, and usage.
7. **LICENSE file** — A `LICENSE` file must be present at the repository root.
8. **CI/CD pipeline** — Every repository must have a configured CI/CD pipeline that runs linting, tests, and builds.

## Checklist

Perform a repo hygiene review on `{repo_name}` ({date}):

### Config

- [ ] `.gitignore` covers all standard ignores (node_modules, dist, .next, .env, coverage, **pycache**, .venv)
- [ ] `.nvmrc` or `.node-version` specifies Node.js version
- [ ] `.editorconfig` present with consistent settings
- [ ] `package.json` includes `engines` field specifying Node.js and {package_manager} versions
- [ ] Lock file ({lock_file}) is committed and up to date

### Security

- [ ] No secrets, credentials, or API keys committed anywhere in history
- [ ] `.env.example` exists with placeholder values (not `.env` with real values)
- [ ] Dependency audit is clean (`{package_manager} audit` shows no critical/high vulnerabilities)
- [ ] No `.env`, `.env.local`, or `.env.production` files in the repo
- [ ] Sensitive config loaded from environment variables, not hardcoded

### Quality

- [ ] Linter configured and passing ({linter_tool})
- [ ] Formatter configured and passing ({formatter_tool})
- [ ] Pre-commit hooks set up (husky + lint-staged or equivalent)
- [ ] Test suite runs and passes (`{test_command}`)
- [ ] Code coverage meets minimum threshold ({coverage_threshold}%)
- [ ] TypeScript strict mode enabled (if applicable)

### CI/CD

- [ ] CI pipeline exists and is configured ({ci_platform})
- [ ] Builds pass on every PR
- [ ] Tests run in CI on every PR
- [ ] Branch protection enabled on `main`/`master`
- [ ] Automated dependency updates configured ({dependency_tool})

### Documentation

- [ ] Root `README.md` with project overview, setup, and usage
- [ ] `CONTRIBUTING.md` or contributing guide present
- [ ] `docs/` folder follows [Organization Name] documentation standard
- [ ] API documentation generated or maintained
- [ ] Changelog maintained (`CHANGELOG.md` or release notes)

## Maintenance Schedule

| Task                                         | Frequency | Owner           |
| -------------------------------------------- | --------- | --------------- |
| Dependency audit (`{package_manager} audit`) | Weekly    | {team_lead}     |
| Dependency updates (minor/patch)             | Bi-weekly | {developer}     |
| Dependency updates (major)                   | Monthly   | {tech_lead}     |
| Git history cleanup (prune merged branches)  | Weekly    | {developer}     |
| Review and update .gitignore                 | Quarterly | {tech_lead}     |
| Secrets scan (full history)                  | Monthly   | {security_lead} |
| README accuracy review                       | Monthly   | {team_lead}     |
| License compliance check                     | Quarterly | {legal_contact} |
| CI/CD pipeline review                        | Quarterly | {devops_lead}   |
| Stale branch cleanup                         | Monthly   | {developer}     |
