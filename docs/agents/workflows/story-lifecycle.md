# Story Lifecycle

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> From idea to publication — the [Organization Name] content workflow

---

## Overview

Every piece of [Organization Name] content follows a defined lifecycle that balances speed with accuracy. The lifecycle varies by content type but follows consistent principles.

---

## Lifecycle Stages

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ IDEATION│ → │ RESEARCH│ → │ CREATION│ → │ REVIEW  │ → │ PUBLISH │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │              │
     ▼              ▼              ▼              ▼              ▼
  Sources       Gathering      Drafting      Approval      Distribution
  Triggers      Verification   Writing       Editing       Syndication
  Assignment    Analysis       Formatting    Fact-check    Analytics
```

---

## Stage 1: Ideation

### Trigger Sources

| Source                    | Description                    | Examples             |
| ------------------------- | ------------------------------ | -------------------- |
| **[Alert System] alerts** | Automated regulatory triggers  | New licensing rules  |
| **Source tips**           | Contributor/source information | Industry rumors      |
| **Market events**         | Price movements, M&A, IPO      | Gold price spike     |
| **Calendar**              | Scheduled events, reports      | Budget announcements |
| **Editorial planning**    | Proactive coverage decisions   | Sector deep-dives    |

### Assignment Process

1. **Trigger received** → Logged in editorial system
2. **Triage** → Editor assesses newsworthiness
3. **Assignment** → Writer/contributor assigned
4. **Brief created** → Scope, angle, deadline defined

### Assignment Brief Template

```yaml
story_id: [PROJ-2026-001]
headline_draft: '[Example headline — e.g., Region simplifies licensing process]'
type: regulatory-brief
assigned_to: [bureau_name]
deadline: 2026-01-27T18:00:00Z
priority: high
angle: '[Story angle — e.g., Impact on small operators and cooperatives]'
sources_required:
  - [Domain authority — e.g., regulatory official]
  - [Industry representative]
  - [Independent analyst]
word_count: 800-1200
distribution: signal, email, linkedin
```

---

## Stage 2: Research

### Information Gathering

| Activity               | Responsible        | Output              |
| ---------------------- | ------------------ | ------------------- |
| **Primary sources**    | Bureau/contributor | Quotes, data        |
| **Document review**    | Analyst            | Background, context |
| **Data pull**          | Data team          | Statistics, trends  |
| **Historical context** | AI assist          | Previous coverage   |

### Verification Requirements

| Claim Type           | Verification Standard          |
| -------------------- | ------------------------------ |
| Government statement | Official source or document    |
| Statistical claim    | Primary data source            |
| Attribution          | Direct confirmation            |
| Market data          | Multiple source triangulation  |
| Anonymous source     | Editor approval, corroboration |

### Research Checklist

- [ ] Primary source contacted
- [ ] Official documents obtained
- [ ] Data verified against source
- [ ] Historical context gathered
- [ ] Competing perspectives sought
- [ ] Conflicts of interest checked

---

## Stage 3: Creation

### Content Production

| Method            | Use Case                        | Quality Gate   |
| ----------------- | ------------------------------- | -------------- |
| **Human-written** | Field dispatches, analysis      | Editor review  |
| **AI-assisted**   | News digests, briefs            | Human review   |
| **AI-generated**  | Breaking alerts, data summaries | Human approval |

### Writing Process

1. **Outline** → Structure and key points
2. **Draft** → First version
3. **Self-edit** → Writer's own review
4. **Submission** → Into editorial queue

### AI Assistance Guidelines

| Task                 | AI Role               | Human Role      |
| -------------------- | --------------------- | --------------- |
| Background research  | Generate summaries    | Verify accuracy |
| First draft          | Generate from outline | Review, rewrite |
| Headline options     | Generate variants     | Select, refine  |
| Distribution formats | Adapt for channels    | Approve         |

---

## Stage 4: Review

### Editorial Review Levels

| Level                  | Reviewer      | Focus                   |
| ---------------------- | ------------- | ----------------------- |
| **L1: Copy edit**      | Editor        | Grammar, style, clarity |
| **L2: Fact check**     | Fact-checker  | Accuracy, sources       |
| **L3: Legal review**   | Legal counsel | Risk, liability         |
| **L4: Final approval** | Senior editor | Publication decision    |

### Review by Content Type

| Content Type     | Required Reviews | Typical Time |
| ---------------- | ---------------- | ------------ |
| Breaking alert   | L1, L4           | 15-30 min    |
| News digest      | L1, L4           | 1-2 hours    |
| Regulatory brief | L1, L2, L4       | 2-4 hours    |
| Sector report    | L1, L2, L3, L4   | 1-3 days     |
| Field dispatch   | L1, L2, L4       | 2-4 hours    |

### Review Checklist

- [ ] Headline accurate and compelling
- [ ] Lead paragraph captures essence
- [ ] All claims sourced
- [ ] Quotes verified
- [ ] Data accurate
- [ ] Style guide followed
- [ ] Conflicts disclosed
- [ ] Legal cleared (if required)

---

## Stage 5: Publish

### Pre-Publication

1. **Final approval** confirmed
2. **Distribution channels** selected
3. **Timing** optimized
4. **Metadata** complete (tags, categories)
5. **Images/graphics** approved

### Publication Process

```yaml
publication:
  primary:
    - channel: website
      time: immediate
  syndication:
    - channel: email
      time: +5 minutes
      segment: subscribers_regulatory
    - channel: linkedin
      time: +15 minutes
      format: summary
    - channel: twitter
      time: +20 minutes
      format: thread
```

### Post-Publication

| Activity                | Timing              | Responsible |
| ----------------------- | ------------------- | ----------- |
| **Monitor engagement**  | Ongoing             | Analytics   |
| **Respond to feedback** | As needed           | Editor      |
| **Corrections**         | Immediate if needed | Editor      |
| **Follow-up planning**  | Within 24 hours     | Bureau      |

---

## Lifecycle by Content Type

### Breaking Alert

```
Trigger → 5 min → Draft → 10 min → Review → 5 min → Publish
Total: 15-30 minutes
```

### News Digest

```
Morning scan → 1 hr → Compile → 30 min → Review → 30 min → Publish
Total: 2-3 hours
```

### Regulatory Brief

```
[Alert System] alert → 2 hr → Research → 2 hr → Draft → 1 hr → Review → Publish
Total: 4-8 hours
```

### Sector Report

```
Assignment → 3 days → Research → 2 days → Draft → 1 day → Review → Publish
Total: 5-10 days
```

---

## Status Tracking

### Story States

| State         | Description                  |
| ------------- | ---------------------------- |
| `ASSIGNED`    | Writer assigned, not started |
| `IN_PROGRESS` | Active work                  |
| `SUBMITTED`   | Ready for review             |
| `IN_REVIEW`   | Under editorial review       |
| `REVISION`    | Returned for changes         |
| `APPROVED`    | Ready to publish             |
| `PUBLISHED`   | Live                         |
| `KILLED`      | Not publishing               |

### Dashboard View

```
┌─────────────────────────────────────────────────────────┐
│ Editorial Dashboard - [Date]                             │
├─────────────────────────────────────────────────────────┤
│ IN PROGRESS (4)  │ IN REVIEW (2)  │ READY (1)          │
├──────────────────┼────────────────┼────────────────────┤
│ • [Item 1]       │ • [Item A]     │ • [Item X]         │
│ • [Item 2]       │ • [Item B]     │                    │
│ • [Item 3]       │                │                    │
│   digest         │                │                    │
│ • [Item 4]       │                │                    │
└──────────────────┴────────────────┴────────────────────┘
```

---

## References

- [Approval Flows](./approval-flows.md)
- [Editorial Independence](../governance/editorial-independence.md)
