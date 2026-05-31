# GTCX Shared GitHub Actions

Reusable composite actions for all `gtcx-ecosystem/*` service repos.

## Available Actions

### `build-and-test`

Standard build pipeline: install → lint → typecheck → test → build.

```yaml
- uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/build-and-test@main
  with:
    node-version: '20.18.0' # optional, default: 20.18.0
    pnpm-version: '9.15.0' # optional, default: 9.15.0
    working-directory: '.' # optional, default: .
```

### `security-scan`

Secret scanning (TruffleHog) + dependency audit (pnpm audit with CVE acceptance log from gtcx-infrastructure).

```yaml
- uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/security-scan@main
  with:
    fail-on-high: 'true' # optional, default: true
```

### `deploy-to-eks`

Build Docker image → push to ECR → deploy to shared GTCX EKS cluster.

```yaml
- uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/deploy-to-eks@main
  with:
    image-name: 'my-service' # required
    k8s-manifest-path: './k8s/' # optional, default: ./k8s/
    environment: 'production' # optional, default: production
    eks-cluster-name: 'gtcx-production' # optional, default: gtcx-production
```

## Prerequisites

Before using these actions, each service repo must have:

1. `AWS_ROLE_ARN` GitHub variable set → `arn:aws:iam::348389439381:role/gtcx-production-shared-deploy`
2. `ECR_REGISTRY` GitHub variable set → `348389439381.dkr.ecr.af-south-1.amazonaws.com`
3. `.npmrc` with GitHub Packages auth for `@gtcx/*` scoped packages
4. `pnpm` workspace or standalone project with `lint`, `typecheck`, `test`, `build` scripts

## Full Example Workflow

```yaml
name: CI/CD

on:
  push:
    branches: [main]

permissions:
  id-token: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/build-and-test@main

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/security-scan@main

  deploy:
    needs: [build, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v6
      - uses: gtcx-ecosystem/gtcx-infrastructure/.github/actions/deploy-to-eks@main
        with:
          image-name: 'gtcx-my-service'
```

## Cost

These actions use GitHub-hosted runners and GitHub Actions cache (free for public repos, included in plan for private). AWS costs for ECR storage and EKS compute are charged to the shared GTCX AWS account.

## Support

- **Issues:** File in `gtcx-ecosystem/gtcx-infrastructure`
- **Slack:** #gtcx-platform
