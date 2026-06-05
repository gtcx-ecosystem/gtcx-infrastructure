---
title: 'GTCX Compliance Substrate'
status: 'draft'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['docs-site', 'distribution', 'compliance']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX Compliance Substrate

Tamper-evident, regulator-grade primitives for AI-native compliance workflows. Open source. Composable. Already running in production.

## What this is

Three primitives that compose into the substrate behind GTCX's compliance gateway. Each is independently useful; together they form a complete audit + storage + agent-discovery surface for AI-mediated regulated decisions.

### [@gtcx/audit-signer](./audit-signer.md)

Ed25519-signed, hash-linked audit records. Zero runtime dependencies. Any third party can verify your audit chain offline with no GTCX-side trust step.

```bash
npm install @gtcx/audit-signer
```

### [terraform-aws-compliance-db](./compliance-db.md)

Dual-database (operational + audit) Terraform module for regulated African fintech. FATF-grade retention floors. Per-jurisdiction plugin catalog covering Zimbabwe, Nigeria, Kenya, Ghana, South Africa, and more.

```hcl
module "compliance_db" {
  source = "amani-amina-anai/compliance-db/aws"
  version = "~> 0.1.0"
  jurisdiction = "zimbabwe"
}
```

### [@gtcx/compliance-gateway-mcp](./compliance-gateway-mcp.md)

Model Context Protocol server exposing the compliance gateway's read-only surface to AI agents. Discoverable. Deliberately no mutating tools — approvals require a human-signed ticket through the HTTP gateway.

```bash
npm install @gtcx/compliance-gateway-mcp
gtcx-compliance-mcp
```

## How they compose

[Architecture overview →](./architecture.md)

## Who's using this

- **GTCX testnet pilot** (Zimbabwe, af-south-1, live since 2026-Q1) — `@gtcx/audit-signer` produces the WORM-bucket evidence that's used in SIGNAL Supervision S2 audit-trail validation, scoring 9.60/10.
- **Internal builds** at the GTCX ecosystem — 23 repos, with `terraform-aws-compliance-db` powering the dual-database pattern across multiple workloads.

If you adopt this and have feedback (positive or otherwise), please open an issue or a PR. We compound value when more than one organization is load-bearing on the substrate.

## License

All three primitives are MIT. We rely on adoption signal, not licensing pressure, as our distribution mechanism.

## Get involved

- **GitHub:** https://github.com/gtcx-ecosystem/gtcx-infrastructure
- **Security advisories:** GitHub Security Advisories on the parent repository
- **SIGNAL scorecard:** [`signal-scorecard.json`](https://github.com/gtcx-ecosystem/gtcx-infrastructure/blob/main/01-docs/05-audit/signal-scorecard.json) — current score: **9.60/10**
