# Security-as-a-Service (SECaaS) — operator index

**Initiative:** `INIT-GTCX-INFRA-SECAS` · **Protocol:** P42  
**Primary owner:** gtcx-infrastructure (co-primary with DaaS — not bridge-os program office)

| Artifact             | Path                                                    |
| -------------------- | ------------------------------------------------------- |
| Ops entry            | [security-as-a-service.md](../security-as-a-service.md) |
| Roadmap              | `pm/secas-roadmap.json`                                 |
| Stories              | `pm/secas-stories.json`                                 |
| Operational friction | `pm/security-friction-register.json`                    |
| Class S sovereign    | `pm/sovereign-approval-register.json`                   |
| Execution roadmap    | `audit/product-management/secas-execution-roadmap.md`   |
| Task inbox           | `pm/_tasks` — `INIT-GTCX-INFRA-SECAS`                   |
| Fleet harness        | `pnpm --dir ../bridge-os ecosystem:secas:check`         |

```bash
pnpm secas:friction:check
pnpm secas:approval:check
pnpm secas:cards:check
pnpm generate:secas-roadmap
```
