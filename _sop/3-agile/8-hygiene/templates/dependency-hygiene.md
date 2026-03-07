# Dependency Hygiene

## Purpose

Keeping dependencies current, secure, and minimal. This checklist ensures that every project in the ecosystem maintains a healthy dependency tree, avoids known vulnerabilities, and complies with licensing requirements.

## Standards

1. **No dependencies more than 2 major versions behind.** If a dependency is 2+ major versions behind latest, it must have an upgrade plan or a documented exception.
2. **Security vulnerabilities patched within SLA.**
   - Critical: 24 hours
   - High: 7 days
   - Medium: 30 days
   - Low: 90 days
3. **No unused dependencies.** Every declared dependency must be imported somewhere in production code.
4. **Lock files committed and up to date.** `package-lock.json`, `pnpm-lock.yaml`, `Pipfile.lock`, or `poetry.lock` must be committed and regenerated whenever dependencies change.
5. **License compliance.** No GPL-licensed packages in proprietary codebases unless explicitly approved. All licenses must be reviewed for compatibility.

## Checklist

### Security

- [ ] `npm audit` / `pnpm audit` / `pip audit` returns zero critical and zero high vulnerabilities
- [ ] All advisories reviewed — false positives documented with justification
- [ ] Snyk or Dependabot alerts triaged and resolved

### Outdated Packages

- [ ] No outdated major versions (`npm outdated` / `pip list --outdated`)
- [ ] Minor and patch updates applied where tests pass
- [ ] Major version upgrades have a tracking issue with migration plan

### Unused and Duplicate Dependencies

- [ ] No unused dependencies (`depcheck`, `pip-extra-reqs`, or equivalent)
- [ ] No duplicate dependencies (different versions of the same package in the tree)
- [ ] No unnecessary peer dependency overrides

### Lock File Integrity

- [ ] Lock file is committed to version control
- [ ] Lock file is not stale (matches `package.json` / `pyproject.toml`)
- [ ] `npm ci` / `pnpm install --frozen-lockfile` succeeds in CI

### Version Pinning

- [ ] Production dependencies use exact versions or tight ranges (no `*`, `latest`, or unbounded ranges)
- [ ] Dev dependencies use reasonable ranges (caret `^` is acceptable)
- [ ] Dependency tree depth is reasonable (no excessively deep chains)

### License Compliance

- [ ] All licenses reviewed and compatible with project license
- [ ] No copyleft licenses (GPL, AGPL) in proprietary projects without legal approval
- [ ] License audit tool integrated into CI (`license-checker`, `pip-licenses`)

## Audit Results

| Package        | Current   | Latest   | Behind                | Vulnerability | License   | Action                  |
| -------------- | --------- | -------- | --------------------- | ------------- | --------- | ----------------------- |
| {package-name} | {current} | {latest} | {n major/minor/patch} | {CVE or None} | {license} | {Upgrade/Pin/Remove/OK} |

## License Summary

| License         | Count | Compatible                 |
| --------------- | ----- | -------------------------- |
| MIT             | {n}   | Yes                        |
| Apache-2.0      | {n}   | Yes                        |
| ISC             | {n}   | Yes                        |
| BSD-2-Clause    | {n}   | Yes                        |
| BSD-3-Clause    | {n}   | Yes                        |
| GPL-3.0         | {n}   | {Yes/No — requires review} |
| {other-license} | {n}   | {Yes/No}                   |

## Maintenance Schedule

| Cadence   | Activity                                     | Owner   |
| --------- | -------------------------------------------- | ------- |
| Weekly    | Automated security scan (Snyk / Dependabot)  | {owner} |
| Monthly   | Review outdated packages and triage upgrades | {owner} |
| Quarterly | Major version upgrade review and planning    | {owner} |
| Quarterly | License compliance audit                     | {owner} |
| Annually  | Full dependency tree audit and cleanup       | {owner} |
