---
title: '@gtcx/compliance-gateway-mcp — MCP Server'
status: 'draft'
date: '2026-05-27'
owner: 'platform-engineering'
tier: 'standard'
tags: ['docs-site', 'mcp', 'compliance-gateway', 'reference']
review_cycle: 'on-change'
role: 'protocol-architect'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# `@gtcx/compliance-gateway-mcp`

Model Context Protocol server that exposes the GTCX compliance gateway's read-only surface to AI agents. Discoverable via standard MCP introspection. Deliberately no mutating tools.

## Why MCP for compliance?

When an AI agent decides to evaluate a compliance question — "is this trader cleared for cross-border export?" — it has to find a service that knows the answer. Today that means hard-coding URLs, parsing READMEs, or calling a generic search-the-web tool. None of those scale.

The Model Context Protocol gives agents a discovery mechanism: a registered MCP server advertises its tools, the agent picks the right one, calls it, gets a structured answer. We exposed the compliance-gateway via MCP so:

1. AI agents in the field can ask compliance questions without learning our REST API
2. Tool discovery is structural (the MCP server declares its tools); no scraping required
3. The mutating-tool gating from the HTTP gateway is preserved — the MCP server is read-only by design

## Install

```bash
npm install @gtcx/compliance-gateway-mcp
```

## Run

```bash
GATEWAY_URL=https://your-gateway.example/v1 \
GATEWAY_TOKEN=<bearer-token-with-read-only-scope> \
gtcx-compliance-mcp
```

The server speaks JSON-RPC 2.0 on stdin/stdout per the MCP specification. Most users won't run it directly — an MCP client (Claude Desktop, your custom agent) launches it as a subprocess and routes tool calls.

## Tools exposed

Four tools, all read-only:

### `gtcx_compliance_query`

Ask a natural-language compliance question. The gateway routes it to the appropriate protocol tools and returns an answer + tool trace.

**Input:** `{ query: string, jurisdiction?: string, context?: object }`

### `gtcx_audit_chain`

Return the current audit chain state: head hash, in-memory record count, total records ever signed.

**Input:** `{}`

### `gtcx_audit_evidence_bundle`

Return a signed, verifiable evidence bundle for the caller's tenant since an optional timestamp. The bundle includes NDJSON records and verification instructions; an external auditor verifies it offline with `@gtcx/audit-signer`.

**Input:** `{ since?: string }` (ISO-8601 timestamp)

### `gtcx_brief`

One-paragraph morning brief: signing posture, chain head, today's LLM spend, headline numbers.

**Input:** `{ since?: string }`

## What it deliberately does NOT expose

Mutating tools (TradePass credential issuance, PvP settlement execution, GeoTag origin marks) require an approval ticket and stay behind the HTTP gateway. The MCP boundary is intentionally read-only — exposing approve-and-execute paths to agent-discoverable surfaces would erode the SIGNAL S1 mutating-tool gating claim.

If your agent needs to mutate, it should escalate to a human via your operator interface, get an approval ticket signed, and call the HTTP gateway directly with that ticket.

## Configuration

| Env var         | Required? | Purpose                                                                       |
| --------------- | --------- | ----------------------------------------------------------------------------- |
| `GATEWAY_URL`   | required  | Base URL of the running compliance-gateway, e.g. `https://gateway.example/v1` |
| `GATEWAY_TOKEN` | required  | Bearer token with at least `query:read` + `audit:read` scopes                 |

The token must be the same shape as a regular gateway client token; the MCP server is just a different transport.

## Source

- GitHub: https://github.com/gtcx-ecosystem/gtcx-infrastructure/tree/main/tools/compliance-gateway-mcp
- npm: pending publish

## License

MIT.
