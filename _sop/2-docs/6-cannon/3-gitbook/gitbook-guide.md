# GitBook Publishing Guide

Customer-facing documentation for [Organization Name] products and services.

---

## Structure

```
gitbook/
├── README.md                 # Landing page
├── summary.md                # GitBook table of contents
├── book.json                 # GitBook configuration
│
├── getting-started/          # Universal — pre-built
│   ├── quickstart.md
│   └── audiences.md
│
│   # ── CUSTOM SECTIONS ──────────────────────────────────────────────
│   # Name and structure these based on your repo's content.
│   # Examples from real deployments:
│   #   protocols/   → one page per protocol (tradepass.md, geotag.md, …)
│   #   products/    → one subfolder per product
│   #   services/    → one page per service offering
│   # Each org defines its own categories — there is no universal shape here.
│   # ─────────────────────────────────────────────────────────────────
│
├── [custom-section]/         # Your primary content area
│   ├── README.md
│   └── [item]/
│       ├── README.md
│       └── ...               # Pages determined by item type
│
├── [custom-section-2]/       # Optional: add more sections as needed
│
├── api/                      # Universal — pre-built (omit if no API)
│   ├── README.md
│   ├── authentication.md
│   ├── endpoints.md
│   ├── webhooks.md
│   ├── rate-limits.md
│   └── sdks.md
│
├── accessibility/            # Universal — pre-built (omit if not applicable)
│   ├── README.md
│   ├── languages.md
│   ├── offline.md
│   ├── sms-ussd.md
│   └── audio.md
│
└── resources/                # Universal — pre-built
    ├── faq.md
    ├── glossary.md
    ├── support.md
    └── status.md
```

---

## Custom Sections

Custom sections sit between `getting-started/` and `api/`. You define them — their names, count, and depth come from your repo's content.

### Two shapes

**Deep — section overview + item subfolders**

Use when each item is complex enough to need multiple pages.

```
protocols/
├── README.md           ← section-overview.md template
├── tradepass/
│   ├── README.md       ← product-page.md template
│   └── spec.md
└── geotag/
    ├── README.md
    └── spec.md
```

Use `assets/model-pages/section-overview.md` for the section README.
Use `assets/model-pages/product-page.md` for each item README.

**Shallow — section with flat pages**

Use when items are simple enough for a single page each, or when the section is supplementary (governance, security, legal).

```
governance/
├── README.md           ← brief intro + list of pages
├── gip-process.md
└── change-control.md
```

No sub-template needed — model it on `getting-started/`.

### Choosing a shape

| Your content                                              | Shape                                        |
| --------------------------------------------------------- | -------------------------------------------- |
| Products, protocols, services — each needs multiple pages | Deep                                         |
| Policies, governance, security — each fits one page       | Shallow                                      |
| Mixed — some complex, some simple                         | Deep for complex items, shallow for the rest |

### Rules

- Name the folder after what it contains, not its role (`protocols/` not `content/`)
- Every custom section needs a `README.md` — GitBook uses it as the section landing page
- Add every page to `summary.md` or GitBook won't render it

---

## Page Count (Reference)

Counts scale with the number of items in your custom sections.

| Section         | Pages (Estimate)             |
| --------------- | ---------------------------- |
| Getting Started | 2–3                          |
| Custom sections | 2–6 per item                 |
| API             | 5–6                          |
| Accessibility   | 4–5 (omit if not applicable) |
| Resources       | 4                            |

---

## GitBook Deployment

### Setup

1. Create GitBook space
2. Connect to GitHub repo
3. Set root directory to `/docs/gitbook`
4. Sync

### Configuration

- `book.json` — GitBook settings
- `summary.md` — Navigation structure (GitBook reads this for TOC)

---

## Content Guidelines

### Voice

- Customer-focused (benefits, not implementation)
- Professional but accessible
- No internal jargon

### What's Included

- Product descriptions and features
- Subscription tiers and access levels
- API documentation
- Methodologies and scoring criteria (public-facing)

### What's Excluded

- Internal pricing strategy
- Business model details
- Organization structure
- Competitive analysis
- Agentic architecture ([AI System] system)

---

## Maintenance

### Adding Pages

1. Create `.md` file in appropriate folder
2. Add entry to `SUMMARY.md`
3. Commit and push

### Updating Content

- Edit markdown files directly
- GitBook syncs on push

### Internal vs Public

- **Internal docs**: `/` (repo root) — full architecture, business docs
- **Public docs**: `/docs/gitbook/` — customer-facing only

---

## Related

- Internal documentation: See repo root `SUMMARY.md`
- Agentic architecture: See your repo's specs/engines/ folder
- Business model: See your repo's company/economics/ folder
