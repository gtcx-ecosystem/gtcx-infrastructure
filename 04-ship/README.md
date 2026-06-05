# Ship (04-ship)

Deploy and runtime infrastructure for **gtcx-infrastructure**.

| Path                   | Role                                          |
| ---------------------- | --------------------------------------------- |
| `docker/`              | Docker images and compose stacks              |
| `kubernetes/`          | Kustomize overlays and base manifests         |
| `terraform/`           | Terraform modules and environments            |
| `migrations/`          | Database migration packages                   |
| `monitoring/`          | Observability configs                         |
| `security/`            | Security reports and evidence sinks           |
| `03-platform/scripts/` | Deploy, DR, bootstrap, and build-push scripts |

See `01-docs/operations/runbooks/deploy.md` and hub `01-docs/04-ops/`.
