# 03-platform — code hub

Layout v3 **code hub** for `gtcx-infrastructure`: workspace packages, agent scripts, and operational tooling.

| Path                              | Purpose                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| [`tools/`](./tools/README.md)     | 15 pnpm workspace packages (`@gtcx/*`) — compliance gateway, audit-signer, control-plane, … |
| [`scripts/`](./scripts/README.md) | Agent automation (P22/P26), workspace gates, layout checks                                  |
| [`assets/`](./assets/README.md)   | Shared static assets                                                                        |

**Canonical path contract:** [`config/sor-map.json`](../config/sor-map.json) · [`config/paths.mjs`](../config/paths.mjs)

**Deploy / ship layer:** [`04-deploy/`](../04-deploy/README.md) (Terraform, Kubernetes, operator scripts).
