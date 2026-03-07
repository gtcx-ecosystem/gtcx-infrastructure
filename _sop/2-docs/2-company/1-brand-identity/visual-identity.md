# Visual Identity & Design Principles

**Version:** {version}
**Last updated:** {YYYY-MM-DD}
**Status:** [Draft / Implementation-ready]

> This document defines the visual language, naming conventions, editorial voice registers,
> and audience segmentation for the [Organization Name] brand family. It is the canonical reference
> for engineering, design, and editorial teams building across the platform ecosystem.

---

## 1. Visual Foundation

### 1.1 Background Palette

| Property           | Value   | Notes                                     |
| ------------------ | ------- | ----------------------------------------- |
| Primary background | `{hex}` | [e.g., near-black with cool undertone]    |
| Surface (elevated) | `{hex}` | Cards, modals, panels                     |
| Surface (inset)    | `{hex}` | Input fields, code blocks, recessed areas |
| Border (subtle)    | `{hex}` | Dividers, table rules, card edges         |
| Border (active)    | `{hex}` | Hover states, focused elements            |

**Rationale.** [Describe the aesthetic intent — e.g., dark-first terminal aesthetics, professional tool, consumer-friendly.]

**Implementation notes:**

- All surface colors must maintain a minimum contrast ratio of [N]:1 against the primary background.
- [Additional guidance — e.g., avoid pure black on OLED, use undertones to create depth.]

---

### 1.2 Accent Colors

| Role                     | Color        | Hex     | Usage                                              |
| ------------------------ | ------------ | ------- | -------------------------------------------------- |
| Primary interactive      | [Color name] | `{hex}` | Links, active states, primary CTAs                 |
| Positive signal          | [Color name] | `{hex}` | Success states, verified status, positive trends   |
| Alert / attention        | [Color name] | `{hex}` | Warnings, anomalies, flagged items                 |
| Destructive              | [Color name] | `{hex}` | Errors, deletions, critical alerts (use sparingly) |
| Neutral text (primary)   | [Color name] | `{hex}` | Body text, headings, primary labels                |
| Neutral text (secondary) | [Color name] | `{hex}` | Captions, timestamps, metadata, disabled states    |

**Implementation notes:**

- Accent colors at full saturation are reserved for interactive elements and data points.
- For backgrounds (e.g., status badges), use accent at [N]% opacity over the surface color.
- All accent colors must meet WCAG 2.1 AA contrast (4.5:1) against the primary background.

---

### 1.3 Typography

| Element         | Treatment                                                               |
| --------------- | ----------------------------------------------------------------------- |
| Parent brand    | **[ORGANIZATION NAME]** — [describe case, spacing, disallowed variants] |
| Sub-brands      | [Describe sub-brand naming convention and format]                       |
| Typeface family | [Geometric / Humanist / Serif sans-serif — specify font]                |
| Monospace       | [Used for data tables, code, timestamps — specify font]                 |

**Type scale:**

| Token        | Size             | Weight | Usage                           |
| ------------ | ---------------- | ------ | ------------------------------- |
| `display-lg` | 48px / 3rem      | 700    | Hero headlines, landing pages   |
| `display-sm` | 36px / 2.25rem   | 700    | Section headers, report titles  |
| `heading-lg` | 24px / 1.5rem    | 600    | Page titles, card headers       |
| `heading-sm` | 18px / 1.125rem  | 600    | Sub-sections, widget titles     |
| `body`       | 14px / 0.875rem  | 400    | Default body text, descriptions |
| `caption`    | 12px / 0.75rem   | 400    | Timestamps, metadata, labels    |
| `mono`       | 13px / 0.8125rem | 400    | Data cells, metric values, code |

**Implementation notes:**

- [Wordmark tracking/spacing rule — e.g., minimum letter-spacing for the brand name]
- [Sub-brand naming format — e.g., no space between word and suffix]

---

### 1.4 Layout & Data Density

[Describe the organization's philosophy — e.g., data-rich professional tool, consumer-friendly simplicity, or content-first editorial.]

**Principles:**

- **[Density principle]** — [e.g., Default to dense; start with data-rich layouts]
- **[Disclosure principle]** — [e.g., Progressive disclosure over simplification]
- **[Table vs. card principle]** — [e.g., Tables are first-class citizens for data work]
- **[Whitespace principle]** — [e.g., Earned whitespace creates grouping, not aesthetic padding]

**Grid system:**

| Breakpoint | Columns | Gutter | Margin | Context                   |
| ---------- | ------- | ------ | ------ | ------------------------- |
| `>=1440px` | 12      | 16px   | 32px   | Desktop (primary target)  |
| `>=1024px` | 12      | 12px   | 24px   | Laptop / reduced viewport |
| `>=768px`  | 8       | 12px   | 16px   | Tablet (secondary)        |
| `<768px`   | 4       | 8px    | 16px   | Mobile (tertiary)         |

[Describe primary design target and rationale — e.g., desktop primary for professional users, mobile for monitoring.]

---

## 2. What We Avoid

| Avoid                                        | Reason                                           |
| -------------------------------------------- | ------------------------------------------------ |
| [Visual pattern 1]                           | [Why it conflicts with brand identity]           |
| [Visual pattern 2]                           | [Why it conflicts with brand identity]           |
| [Imagery type]                               | [Why it reduces the brand to its subject matter] |
| [UI pattern — e.g., gradients as decoration] | [Why it's inconsistent with brand intent]        |
| [Theme option — e.g., light mode]            | [If a brand decision, explain why]               |

**The aesthetic says: [state the core design intent in one sentence].**

---

## 3. Brand Naming Convention

### 3.1 Parent Brand

**[ORGANIZATION NAME]** — [state canonical usage: case, contexts, disallowed variants]

Applies in:

- Marketing copy
- UI chrome (navigation, footers, loading screens)
- Legal documents
- Email signatures

### 3.2 Sub-Brand System

Convention: `[Describe pattern — e.g., Word + suffix, no space, title-case]`

| Sub-brand         | Domain   | One-line description |
| ----------------- | -------- | -------------------- |
| **[Sub-brand 1]** | [Domain] | [Description]        |
| **[Sub-brand 2]** | [Domain] | [Description]        |
| **[Sub-brand 3]** | [Domain] | [Description]        |
| **[Sub-brand 4]** | [Domain] | [Description]        |

**Extensibility.** [Describe how the convention extends to new sub-brands.]

### 3.3 Index / Data Product Names

| Name          | Full name   |
| ------------- | ----------- |
| **[Index 1]** | [Full name] |
| **[Index 2]** | [Full name] |

---

## 4. Platform Voice Registers

Each platform maintains a distinct editorial voice. This table is the definitive reference
for content teams, AI prompt engineering, and UX writing.

| Platform         | Register                      | Characteristic                                    | Example sentence |
| ---------------- | ----------------------------- | ------------------------------------------------- | ---------------- |
| **[Platform 1]** | [e.g., Factual / Fast]        | [Wire-service discipline. Clean, declarative.]    | [Example]        |
| **[Platform 2]** | [e.g., Academic / Deep]       | [Research-grade precision. Methodology stated.]   | [Example]        |
| **[Platform 3]** | [e.g., Strategic / Technical] | [Infrastructure language. Metrics-first.]         | [Example]        |
| **[Platform 4]** | [e.g., Human / Narrative]     | [Field reporting. Named people, specific places.] | [Example]        |

**Implementation notes for AI systems:**

- Each AI agent instance is configured with the voice register of its target platform.
- Voice register is enforced at the prompt level and validated during editorial review.
- Cross-platform content links out rather than blending registers within a single piece.

---

## 5. Audience Segments

Three concentric circles define the [Organization Name] audience. Product, pricing, and
content decisions must identify which circle(s) a feature serves.

### 5.1 Inner Circle: [Primary Audience Name]

**Who:** [Describe primary institutional or professional audience — job titles, organization types]

**What they need:** [Decision-grade / operational / etc.] intelligence for [primary use case]

**How they engage:**

- [Primary product touchpoint 1]
- [Primary product touchpoint 2]
- [Primary product touchpoint 3]

**Design implication:** [UI/UX requirements — density, export, branding level]

---

### 5.2 Active Market: [Secondary Audience Name]

**Who:** [Describe operational market-participant audience]

**What they need:** [Operational tools / workflow integration / risk reduction]

**How they engage:**

- [Primary product touchpoint 1]
- [Primary product touchpoint 2]

**Design implication:** [UI/UX requirements — speed, mobile, alert configuration]

---

### 5.3 Broader Ecosystem: [Tertiary Audience Name]

**Who:** [Policymakers, researchers, media, academics — describe]

**What they need:** [Credible intelligence for policy, reporting, public discourse]

**How they engage:**

- [Primary product touchpoint 1]
- [Primary product touchpoint 2]

**Design implication:** [Shareability, citable content, stable URLs, abstract/summary access]

---

## 6. Comparable Positioning

Internal reference only — not for public marketing.

| Platform         | Comparable                   | Positioning statement           |
| ---------------- | ---------------------------- | ------------------------------- |
| **[Platform 1]** | [Comparable product/service] | [Internal one-line positioning] |
| **[Platform 2]** | [Comparable product/service] | [Internal one-line positioning] |
| **[Platform 3]** | [Comparable product/service] | [Internal one-line positioning] |

---

## 7. Implementation Checklist

- [ ] Configure design system tokens for all colors in Sections 1.1 and 1.2
- [ ] Set up typography scale with primary and monospace families
- [ ] Implement [light/dark] theme; confirm [mode] support decision
- [ ] Verify all accent colors meet WCAG 2.1 AA against primary background
- [ ] Establish sub-brand logo variants following the naming convention
- [ ] Configure CMS with voice register metadata per platform
- [ ] Build audience segment tags into analytics and feature flagging systems
- [ ] Confirm default data view pattern (dense table vs. card grid)
- [ ] Implement stable URLs and citation generation for all published content

---

_This document is maintained by the [Organization Name] brand and design team. Changes require
review against the Brand Manifesto. For questions, contact the design systems lead._
