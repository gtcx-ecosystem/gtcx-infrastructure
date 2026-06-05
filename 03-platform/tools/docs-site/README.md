---
title: 'docs-site (Astro Starlight)'
status: 'current'
date: '2026-05-24'
owner: 'platform-engineering'
tier: 'standard'
tags: ['external', 'docs-site', 'distribution', 'astro']
review_cycle: 'on-change'
---

# docs-site (Astro Starlight)

Astro Starlight static-site config that builds the public docs at `gtcx.trade/compliance`.

Source-of-truth markdown lives at the repo root in [`01-docs/gitbook/docs-site/`](../../01-docs/gitbook/docs-site/README.md); this package's `03-platform/scripts/sync-content.mjs` mirrors that directory into `03-platform/src/content/01-docs/` before Astro reads it. The mirror is `.gitignore`-d — the canonical source is in one place only.

## Why Astro Starlight

| Option           | Verdict                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Astro Starlight  | **Picked.** Markdown-native, zero JS framework lock-in, generates static HTML, has technical-docs sidebar/search out of the box. |
| Next.js + Nextra | More JS shipped per page than the docs need. Adds React runtime cost for content that's 100% static.                             |
| Hugo             | Fast, but Go templating is a step backward from JSX-flavored MDX when we eventually need callouts/diagrams.                      |
| Docusaurus       | Heavier React payload than Starlight; less aligned with the substrate's "ship static HTML where possible" preference.            |

The choice is reversible — the markdown source is portable.

## Build & run

```bash
# from repo root
pnpm install
pnpm -F @gtcx/docs-site sync    # copy markdown from 01-docs/gitbook/docs-site/
pnpm -F @gtcx/docs-site dev     # local preview at http://localhost:4321
pnpm -F @gtcx/docs-site build   # static output in 03-platform/tools/docs-site/dist/
```

Drafts are skipped from the production build by setting `DOCS_SITE_SKIP_DRAFTS=1`:

```bash
DOCS_SITE_SKIP_DRAFTS=1 pnpm -F @gtcx/docs-site build
```

A page is a draft if its frontmatter has `status: 'draft'`. The default `pnpm dev` flow includes drafts so authors can preview unreviewed work locally.

## Deploy

The static output (`03-platform/tools/docs-site/dist/`) is what gets uploaded. Two paths are supported; the choice is operational, not a code change:

- **Cloudflare Pages:** point a Cloudflare Pages project at this directory; build command `pnpm -F @gtcx/docs-site build`; output directory `03-platform/tools/docs-site/dist`. Base path `/compliance` is set in `astro.config.mjs`.
- **S3 + CloudFront (recommended for AWS parity):** same build command, upload `dist/` to the bucket, configure CloudFront to route `gtcx.trade/compliance/*` to the bucket.

The deploy decision is not gated on this ADR — it lands when the marketing site is ready to mount the subpath.

## CI

`.github/workflows/docs-site-build.yml` runs the build on every PR that touches `01-docs/gitbook/docs-site/`, `03-platform/tools/docs-site/`, or this README. The job fails if `astro check` reports broken internal links or schema errors. It does **not** deploy — deploy is a separate, gated workflow that runs only on `main`.

## Editorial workflow

See [`01-docs/gitbook/docs-site/README.md`](../../01-docs/gitbook/docs-site/README.md) for editorial conventions, review workflow, and tone guide. This package is the build layer only.

## References

- ADR-021 — npm publish discipline (parallel external-surface discipline)
- `01-docs/gitbook/docs-site/` — markdown source-of-truth
- Astro Starlight docs: https://starlight.astro.build/
