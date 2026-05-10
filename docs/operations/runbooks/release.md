# Release Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

Safe release process for the GTCX Protocol monorepo — preflight, dry-run, tagging, and rollback decisions.

---

## Preconditions

Before starting:

- [ ] `main` branch is green on CI — all lint, typecheck, test, and build stages pass
- [ ] Version tag follows semver: `vMAJOR.MINOR.PATCH` (e.g., `v2.1.0`)
- [ ] `NPM_TOKEN` is configured in repository secrets
- [ ] You have permission to push tags and create GitHub Releases
- [ ] No open PRs targeting this release that are not yet merged

---

## Step 1 — Dry-Run Validation (Required)

Run the Release workflow in dry-run mode before cutting any tag:

1. Open **Actions → Release**.
2. Click **Run workflow**.
3. Set `release_mode = dry-run`.

Expected results:

- Lint, typecheck, test, and build all pass
- SBOM generation passes
- `npm publish --dry-run` validates without error
- `cosign` signing toolchain validates
- No packages or container images are published

Do not proceed to Step 2 if any dry-run stage fails.

---

## Step 2 — Cut the Release Tag

From a clean, up-to-date local `main`:

```bash
git pull --rebase origin main
git tag vX.Y.Z
git push origin vX.Y.Z
```

Pushing the tag triggers the full Release workflow:

| Stage      | What Happens                                            |
| ---------- | ------------------------------------------------------- |
| preflight  | Validates secrets and tag format                        |
| build/test | Full lint, typecheck, test, build                       |
| sbom       | Generates Software Bill of Materials (CycloneDX/SPDX)   |
| docker     | Builds and tags container images                        |
| sign       | Signs packages and images with `cosign`                 |
| publish    | Publishes to npm and GHCR                               |
| release    | Creates GitHub Release with changelog and SBOM artifact |

---

## Step 3 — Verify Release Outputs

After the workflow completes:

- [ ] GitHub Release exists for `vX.Y.Z` with release notes
- [ ] SBOM artifact is attached to the GitHub Release
- [ ] npm package `@gtcx/sdk` is published at the expected version (`npm view @gtcx/sdk versions`)
- [ ] Container image tags and cosign signatures are present in GHCR
- [ ] No new vulnerabilities introduced (`pnpm audit` on the published version)
- [ ] Release evidence bundle is generated and archived for the target environment

---

## Step 4 — Generate Release Evidence Bundle

Before promotion or pilot sign-off, generate the structured release bundle:

```bash
pnpm ctl evidence release-bundle \
  --environment=staging \
  --version=vX.Y.Z \
  --commit=<git-sha> \
  --smoke-base-url=https://api.testnet.gtcx.io \
  --rollback-target=<previous-known-good-tag> \
  --image=agx=<immutable-image-ref> \
  --image=protocols=<immutable-image-ref>
```

See [release-evidence.md](release-evidence.md) for the full contract and
optional SBOM/scan fields.

---

## Rollback Decision Matrix

Use the smallest rollback action that contains impact. Do not reach for destructive options first.

| Failure Scenario                                       | Preferred Action                                                 |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| npm package is broken; no consumers yet                | Delete tag + release, cut corrected patch tag                    |
| npm package is broken; consumers may have pulled it    | Deprecate the bad version with `npm deprecate`, cut `vX.Y.(Z+1)` |
| Container image is broken or unsigned                  | Cut `vX.Y.(Z+1)` with rebuilt and re-signed image                |
| Release notes incorrect                                | Edit GitHub Release description — no tag change needed           |
| Tag pushed with wrong version number; not yet consumed | Delete tag and re-push with correct number                       |

### Tag/Release Delete Commands

```bash
# Delete the remote tag
git push --delete origin vX.Y.Z

# Delete the local tag
git tag -d vX.Y.Z
```

> Prefer forward-fix patch releases over destructive rollback once consumers may have pulled artifacts. Deleting a published npm version is not possible — only deprecation is available post-publish.

---

## Schema Breaking Changes

If the release contains schema breaking changes (MAJOR version bump):

1. Confirm migration functions are present in `@gtcx/schemas/migrations/` before tagging.
2. Verify the `MigrationExecutor` applies migrations in the correct order.
3. Announce the breaking change in release notes with migration instructions.
4. Do not deprecate the previous MAJOR version until consumers have confirmed migration.

See [data-models.md §6](../../specs/data/data-spec.md) for the schema migration pattern.

---

## Reference

- Git workflow conventions are enforced through repo policy, commit review, and the CI release gate.
- [disaster-recovery.md](disaster-recovery.md)
