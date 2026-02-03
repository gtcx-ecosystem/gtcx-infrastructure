# GTCX Documentation

> **Structured knowledge base for GTCX Protocol development**


## Navigation

| # | Section | Purpose | Audience |
|---|---------|---------|----------|
| **01** | [Getting Started](./01-getting-started/) | First steps, onboarding | Everyone |
| **02** | [Architecture](./02-architecture/) | System design, ADRs | Architects, Senior Devs |
| **03** | [Protocols](./03-protocols/) | TradePass, GCI, GeoTag, etc. | Protocol Developers |
| **04** | [Platforms](./04-platforms/) | SGX, CRX, AGX, CaaS | Platform Engineers |
| **05** | [Engineering](./05-engineering/) | 30 Principles, Code Standards | All Developers |
| **06** | [Deployment](./06-deployment/) | Infrastructure, K8s, Terraform | DevOps, SRE |
| **07** | [Guides](./07-guides/) | How-to tutorials | All Developers |
| **08** | [Reference](./08-reference/) | API docs, schemas, glossary | All Developers |
| **09** | [Research](./09-research/) | Academic papers, IP, strategy | Leadership, Researchers |
| **10** | [Internal](./10-internal/) | PRDs, runbooks, migrations | Internal Team |


## Quick Links

### Start Here
- [Quickstart Guide](./01-getting-started/quickstart.md)
- [For Developers](./01-getting-started/for-developers.md)
- [For AI Agents](./01-getting-started/for-ai-agents.md)

### Core Reading
- [30 Engineering Principles](./05-engineering/PRINCIPLES.md)
- [Architecture Overview](./02-architecture/README.md)
- [Code Standards](./05-engineering/CODE-STANDARDS.md)

### Protocol Specification
- [Full Protocol Spec](../gtcx-protocol-docs/) — Formal specification (v3.0)
- [Glossary](../gtcx-protocol-docs/GLOSSARY.md) — All terminology
- [API Reference](../gtcx-protocol-docs/api/openapi.yaml) — OpenAPI spec


## Documentation Standards

### File Naming
- Use `kebab-case.md` for all documentation files
- Use `UPPERCASE.md` for top-level standards (PRINCIPLES.md, README.md)

### Structure
- Every directory MUST have a `README.md`
- READMEs provide navigation and context
- Keep files focused — one topic per file

### Writing Style
- Lead with the most important information
- Use tables for structured data
- Include code examples where relevant
- Link to related documentation


## Relationship to Protocol Docs

```
docs/                        ← Working knowledge base (this folder)
├── Guides, how-tos, architecture decisions
├── Updated frequently
└── Internal + external audience

gtcx-protocol-docs/          ← Formal specification
├── Protocol specification v3.0
├── Versioned, change-controlled
└── External publication ready
```


*Last updated: January 2026*
