# Information Architecture

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> The structural design of [Organization Name]'s product — how content, navigation, and features are organized and labeled.

---

## 1. Navigation Hierarchy

### Top-Level Navigation

```
[Product Name]
├── [Section 1]           — [One-line description]
├── [Section 2]           — [One-line description]
│   ├── [Sub-section A]   — [Description]
│   └── [Sub-section B]   — [Description]
├── [Section 3]           — [One-line description]
└── [Settings / Account]  — Account management, preferences
```

### Navigation Principles

- Maximum [N] top-level items (cognitive load limit)
- Active state always visible
- Back navigation never breaks context
- Deep links are stable and shareable

---

## 2. Content Structure

### Content Types

| Type             | Description   | Primary Location | Key Fields   |
| ---------------- | ------------- | ---------------- | ------------ |
| [Content type 1] | [Description] | [Where in nav]   | [Key fields] |
| [Content type 2] | [Description] | [Where in nav]   | [Key fields] |
| [Content type 3] | [Description] | [Where in nav]   | [Key fields] |

### Content Hierarchy

```
[Top-level category]
├── [Content type A]
│   ├── [Attribute or sub-type]
│   └── [Attribute or sub-type]
└── [Content type B]
    └── [Attribute or sub-type]
```

---

## 3. Key Screens and Flows

### Screen Inventory

| Screen        | Purpose            | Access Level              | Primary Action |
| ------------- | ------------------ | ------------------------- | -------------- |
| [Screen name] | [One-line purpose] | [All / Auth / Subscriber] | [CTA]          |
| [Screen name] | [Purpose]          | [Access]                  | [CTA]          |
| [Screen name] | [Purpose]          | [Access]                  | [CTA]          |

### Entry Points

How users arrive at key content:

| Entry Point          | Path                         | Notes                |
| -------------------- | ---------------------------- | -------------------- |
| Direct URL           | `[org-domain]/[path]`        | [Stable, shareable]  |
| Navigation           | [Section] → [Sub-section]    | [N] clicks from home |
| Search               | Search → [filter] → [result] | [Search behavior]    |
| Alert / notification | Push → deeplink              | [Deeplink behavior]  |

---

## 4. Search and Findability

### Search Strategy

- **Full-text search** covers: [Content types included]
- **Filters available**: [List of filter dimensions]
- **Sort options**: [Relevance / Date / [Custom]]
- **Default view**: [Most recent / Most relevant / Curated]

### Taxonomy

| Dimension    | Values                                     | Notes                           |
| ------------ | ------------------------------------------ | ------------------------------- |
| [Category]   | [Value 1], [Value 2], [Value 3]            | [Usage guidance]                |
| [Tag type]   | Freeform                                   | [Controlled vocabulary or open] |
| [Geography]  | [Hierarchy — continent → country → region] | [ISO codes used]                |
| [Date range] | Rolling or absolute                        | [Presets offered]               |

---

## 5. Mobile Information Architecture

Mobile navigation uses [bottom tabs / hamburger / contextual] pattern.

```
Bottom Navigation (mobile):
├── [Tab 1] — [Icon + label]
├── [Tab 2] — [Icon + label]
├── [Tab 3] — [Icon + label]
└── [Tab 4] — [Icon + label]
```

Key differences from desktop IA:

- [Difference 1 — e.g., some sections collapsed under "More"]
- [Difference 2 — e.g., search promoted to top bar]

---

## 6. IA Decisions Log

| Decision   | Options Considered     | Chosen   | Rationale |
| ---------- | ---------------------- | -------- | --------- |
| [Decision] | [Option A], [Option B] | [Chosen] | [Why]     |
| [Decision] | [Options]              | [Chosen] | [Why]     |

---

_IA is reviewed when user research reveals navigation failures or when a major feature changes the product scope. Last reviewed: {YYYY-MM-DD}._
