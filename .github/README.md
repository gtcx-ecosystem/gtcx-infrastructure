# `.github/`

GitHub automation, policies, and workflows for GTCX Infrastructure.

## Structure

| Directory                | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `workflows/`             | CI/CD workflows: build, test, deploy, security scan |
| `actions/`               | Reusable composite actions                          |
| `codeql/`                | CodeQL security analysis configuration              |
| `workflow-templates/`    | Starter workflows for new repos                     |
| `PULL_REQUEST_TEMPLATE/` | PR templates with compliance checklist              |
| `zap/`                   | OWASP ZAP DAST scan rules                           |

## Key workflows

- `build-push-ecr.yml` — Build and push service images to ECR
- `deploy-staging.yml` — Deploy to EKS staging
- `validate-all.yml` — Run all 39 validation gates

## Agent note

Modify workflows only through PRs; never commit directly to `main`.
All workflows use SHA-pinned actions (verified by `03-platform/tools/03-platform/scripts/pin-actions-sha.mjs`).
