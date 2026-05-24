---
title: 'Public Docs Site Source'
status: 'current'
date: '2026-05-22'
owner: 'platform-engineering'
tier: 'standard'
tags: ['external', 'docs-site', 'distribution']
review_cycle: 'on-change'
---

# Public Docs Site Source

Markdown source for `gtcx.io/compliance` — the public-facing documentation surface for the GTCX compliance substrate.

## Pages

| File                                                       | Slug                                 | Purpose                                                          |
| ---------------------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| [`index.md`](./index.md)                                   | `/compliance`                        | Landing page; overview of the three primitives                   |
| [`audit-signer.md`](./audit-signer.md)                     | `/compliance/audit-signer`           | Install + quick-start + API reference for `@gtcx/audit-signer`   |
| [`compliance-db.md`](./compliance-db.md)                   | `/compliance/compliance-db`          | `terraform-aws-compliance-db` reference + jurisdiction catalog   |
| [`compliance-gateway-mcp.md`](./compliance-gateway-mcp.md) | `/compliance/compliance-gateway-mcp` | MCP server reference + tool catalog                              |
| [`architecture.md`](./architecture.md)                     | `/compliance/architecture`           | One-page diagram + narrative of how the three primitives compose |

## Build target

Astro Starlight, configured in [`tools/docs-site/`](../../../tools/docs-site/README.md). The build script in that package mirrors this directory into `src/content/docs/` before Astro reads it, so the markdown source stays in one place. The deployment target (Vercel / Cloudflare Pages / S3 + CloudFront) is decided per-environment in the deploy workflow, not in this markdown source — frontmatter is standard YAML and portable across any static-site generator.

## Editorial conventions

- **Tone:** technical, matching the substrate README. No marketing fluff.
- **Code examples:** must copy-paste and work on a clean Node 20 box. The blog post and the docs-site share this contract.
- **No `Powered by AI` chrome:** the substrate is the product. The AI-native framing is GTCX's identity but doesn't belong on third-party-facing docs pages.
- **Accessibility:** drafts assume the deployment will produce WCAG AA contrast. We don't need to enforce visual choices here, but text should read clearly without color cues.

## Review workflow

Each page has `status: 'draft'` until reviewed by Platform Engineering Lead + Security Lead (for cryptographic / IAM accuracy). After approval, status flips to `'current'` and a deployment workflow promotes to the public site.
