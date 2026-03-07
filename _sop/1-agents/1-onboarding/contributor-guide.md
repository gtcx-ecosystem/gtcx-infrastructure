# Contributor Guide — {repo-name}

---

## Getting Started

Complete the [Developer Setup](developer-setup.md) before contributing. Ensure all verification checks pass.

---

## Branching Strategy

**Base branch:** `{base-branch}`

**Branch naming convention:**

| Prefix      | Use Case                                | Example                         |
| ----------- | --------------------------------------- | ------------------------------- |
| `feature/`  | New functionality                       | `feature/user-notifications`    |
| `fix/`      | Bug fixes                               | `fix/login-timeout-error`       |
| `chore/`    | Maintenance, dependencies, config       | `chore/upgrade-typescript-5`    |
| `docs/`     | Documentation changes                   | `docs/update-api-reference`     |
| `refactor/` | Code restructuring (no behavior change) | `refactor/extract-auth-service` |
| `test/`     | Adding or updating tests                | `test/add-payment-edge-cases`   |

```bash
# Create a new branch
git checkout {base-branch}
git pull origin {base-branch}
git checkout -b feature/{short-description}
```

---

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `type(scope): description`

| Type       | When to Use                             |
| ---------- | --------------------------------------- |
| `feat`     | A new feature                           |
| `fix`      | A bug fix                               |
| `docs`     | Documentation only                      |
| `style`    | Formatting, missing semicolons          |
| `refactor` | Code change that neither fixes nor adds |
| `test`     | Adding or correcting tests              |
| `chore`    | Build process, dependencies             |
| `perf`     | Performance improvement                 |
| `ci`       | CI configuration changes                |

**Examples:**

```
feat(auth): add two-factor authentication support
fix(api): handle null response from payment provider
docs(readme): update local setup instructions
refactor(users): extract validation logic to shared util
test(orders): add edge cases for partial refunds
```

**Breaking changes:** Add `!` after the type or include `BREAKING CHANGE:` in the footer.

```
feat(api)!: change authentication endpoint response format
```

---

## Pull Request Process

1. **Create your branch** following the naming convention above
2. **Make your changes** with clear, atomic commits
3. **Write or update tests** for any changed behavior
4. **Run the full test suite** locally before pushing
5. **Push and open a PR** against `{base-branch}`
6. **Fill out the PR template** completely
7. **Request review** from at least {review-count} reviewer(s)
8. **Address review feedback** with new commits (do not force-push during review)
9. **Merge** once approved and all CI checks pass

**PR expectations:**

- Title follows conventional commit format
- Description explains what and why (not just how)
- Linked to relevant issue(s) where applicable
- Screenshots or recordings for UI changes
- No unrelated changes bundled in

**CI checks that must pass:**

- [ ] Lint
- [ ] Type check
- [ ] Unit tests
- [ ] Integration tests (if applicable)
- [ ] Build

---

## Code Style

**Linter:** {linter} — configuration in `{linter-config-file}`

**Formatter:** {formatter} — configuration in `{formatter-config-file}`

```bash
# Check linting
{lint-command}

# Auto-fix lint issues
{lint-fix-command}

# Format code
{format-command}
```

**Configure auto-formatting on save** in your editor to avoid style-only commits.

---

## Testing Requirements

- All new features must include tests
- All bug fixes must include a regression test
- Minimum coverage threshold: {coverage-threshold}
- Tests must pass on CI before merge

**Test naming convention:**

```
describe('{ModuleName}', () => {
  it('should {expected-behavior} when {condition}', () => {
    // ...
  });
});
```

**What needs tests:**

- New API endpoints
- Business logic and utility functions
- State changes and data transformations
- Error handling and edge cases
- Security-sensitive code paths

---

## Review Checklist

Reviewers should evaluate PRs against the following:

- [ ] Code is readable and well-structured
- [ ] Changes match the stated intent of the PR
- [ ] Tests cover the new or changed behavior
- [ ] No hardcoded secrets, tokens, or credentials
- [ ] Error handling is present and appropriate
- [ ] No performance regressions (unnecessary loops, missing indexes, N+1 queries)
- [ ] API changes are backward-compatible (or breaking change is documented)
- [ ] Documentation is updated if behavior changes
- [ ] No leftover debugging code (console.log, TODO hacks)

---

## Release Process

{description-of-how-changes-get-to-production}

1. Changes are merged to `{base-branch}`
2. {ci-cd-pipeline-description}
3. {staging-deployment-step}
4. {production-deployment-step}
5. {post-deploy-verification}

---

## Getting Help

| Channel   | Use For       |
| --------- | ------------- |
| {channel} | {description} |
| {channel} | {description} |
| {channel} | {description} |

If you are unsure about an approach, open a draft PR early and ask for guidance.
