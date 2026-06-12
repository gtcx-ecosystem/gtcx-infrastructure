# platform/mcp — fabric-os MCP pointer

**fabric-os** is the AWS/K8s control plane — not a product MCP server host.

| Need              | Owner                          |
| ----------------- | ------------------------------ |
| BaselineOS MCP    | `../baseline-os/platform/mcp/` |
| Ecosystem MCP hub | `../bridge-os/platform/mcp/`   |
| Agent session     | `pnpm session` (baseline-os)   |
| P22 next-work     | `pnpm agent:next-work` (local) |
| Agentic bridge    | `agentic/manifest.json`        |

Do not add MCP server implementation here.
