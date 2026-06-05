# Production operator scripts

Class A production deploy helpers for Hub W2 close paths (Secrets Manager populate, ESO install).

| Script                              | Purpose                                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| `populate-compliance-os-prod-sm.sh` | Seed `gtcx/compliance-os/production` W2 keys                 |
| `populate-terminal-os-prod-sm.sh`   | Seed `gtcx/terminal-os/production` API keys                  |
| `install-compliance-os-eso.sh`      | Install External Secrets Operator bindings for compliance-os |

Runbooks: [`01-docs/04-ops/runbooks/`](../../01-docs/04-ops/runbooks/).
