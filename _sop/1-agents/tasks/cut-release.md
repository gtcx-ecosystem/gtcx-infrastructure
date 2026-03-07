# Task: Cut a Release

Role: Quality & Evidence Lead — human approval required before pushing any tag

---

## Pre-Flight Checklist

Before starting:

- [ ] You have explicit human instruction to cut a release
- [ ] You know the target version: `vMAJOR.MINOR.PATCH`
- [ ] `main` is green — all CI gates pass
- [ ] No open PRs targeting this release that are not yet merged
- [ ] `NPM_TOKEN` is confirmed in repository secrets

---

## Step 1: Run the dry-run validation

This is mandatory. Do not skip it.

1. Open **GitHub Actions → Release workflow**
2. Click **Run workflow**
3. Set `release_mode = dry-run`

Wait for the dry-run to complete. All stages must pass:

- [ ] Lint, typecheck, test, build — all pass
- [ ] SBOM generation passes
- [ ] `npm publish --dry-run` validates without error
- [ ] `cosign` signing toolchain validates
- [ ] Nothing is actually published

If any dry-run stage fails: stop, fix the failure (see [investigate-ci-failure.md](./investigate-ci-failure.md)), then re-run the dry-run.

**Do not proceed to Step 2 if the dry-run fails.**

---

## Step 2: Report dry-run results to human

Present results:

- Which stages passed / failed
- Any warnings that appeared
- Confirm the version number is correct

Wait for explicit human confirmation before pushing any tag.

---

## Step 3: Push the release tag

After human approval:

```bash
git pull --rebase origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

This triggers the full Release workflow automatically.

---

## Step 4: Monitor the release workflow

Watch for completion of all stages:

| Stage      | What to Confirm                  |
| ---------- | -------------------------------- |
| preflight  | Secret + tag format validated    |
| build/test | All tests pass                   |
| sbom       | SBOM artifact generated          |
| docker     | Container image built and tagged |
| sign       | cosign signatures applied        |
| publish    | npm and GHCR published           |
| release    | GitHub Release created           |

---

## Step 5: Verify release outputs

After the workflow completes:

- [ ] GitHub Release exists for `vX.Y.Z` with release notes
- [ ] SBOM artifact attached to the release
- [ ] `npm view @gtcx/sdk versions` shows the new version
- [ ] Container image visible in GHCR with cosign signature
- [ ] `pnpm audit` on the published version — no new HIGH or CRITICAL findings

Report verification results to the human.

---

## Step 6: If something fails

Apply the smallest rollback action that contains impact. See the rollback matrix in `_sop/2-docs/4-operations/runbooks/release.md`.

**Do not** delete published npm versions — only deprecate.
**Do not** delete a release tag once consumers may have pulled artifacts — cut a patch instead.

---

_Full runbook: `_sop/2-docs/4-operations/runbooks/release.md`_
