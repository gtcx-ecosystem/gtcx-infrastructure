# Version Standards

Purpose: define the minimum supported versions and lifecycle policy for core runtime components.

## Standards

| Component   | Standard                                         | Notes                                      |
| ----------- | ------------------------------------------------ | ------------------------------------------ |
| Languages   | Use the latest LTS for each primary language     | Upgrade within 90 days of LTS release      |
| Frameworks  | Stay within the most recent stable major version | Avoid EOL versions                         |
| Databases   | Use vendor supported major versions only         | Plan upgrades at least 6 months before EOL |
| OS images   | Use vendor supported LTS base images             | Prefer minimal or distroless images        |
| Browsers    | Support current and previous major versions      | Define explicit fallback behavior          |
| IaC tooling | Pin to stable releases                           | Document version in repo tooling           |

## Lifecycle Policy

- Track upstream EOL dates for every core dependency.
- Schedule upgrade work no later than 6 months before EOL.
- Do not introduce new systems on versions within 12 months of EOL.

## Exceptions

Exceptions must include:

- Justification and risk assessment
- Compensating controls
- End date for remediation
- Owner and approval

## Ownership

Owner: Platform Lead  
Review cadence: quarterly

---
