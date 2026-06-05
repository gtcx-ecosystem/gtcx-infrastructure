# @gtcx/compliance-gateway-mcp

Model Context Protocol (MCP) server exposing **read-only** compliance-gateway surfaces to AI agents over stdio JSON-RPC.

## Tools (read-only)

| Tool                         | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `gtcx_compliance_query`      | Natural-language compliance question    |
| `gtcx_audit_chain`           | Audit chain head + record count         |
| `gtcx_audit_evidence_bundle` | Verifiable evidence bundle for auditors |
| `gtcx_brief`                 | Morning-brief summary                   |

Mutating gateway tools stay behind HTTP with approval tickets — not exposed via MCP (SIGNAL S1 gating).

## Quick start

```bash
export GATEWAY_URL=http://localhost:8500
export GATEWAY_TOKEN=<bearer-with-query:read+audit:read>
pnpm --filter @gtcx/compliance-gateway-mcp start
```

## Tests

```bash
pnpm --filter @gtcx/compliance-gateway-mcp test
```

**Related:** [`03-platform/tools/compliance-gateway/`](../compliance-gateway/README.md)
