---
title: 'Technology Team Structure'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['security', 'crypto', 'compliance', 'architecture', 'infrastructure']
review_cycle: 'monthly'
---

# Technology Team Structure

---

## Overview

The [Organization Name] technology team builds and operates the infrastructure that powers our intelligence products, publishing platforms, and data services. We are an AI-native organization — technology amplifies human judgment rather than replacing it.

---

## Team Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Chief Technology Officer                  │
│                     (Reports to CEO)                         │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Platform    │   │     Data      │   │   AI/ML       │
│  Engineering  │   │  Engineering  │   │  Engineering  │
└───────────────┘   └───────────────┘   └───────────────┘
```

---

## Functional Areas

### Platform Engineering

**Mission**: Build and operate the platforms that deliver [Organization Name] products.

| Role                     | Responsibility                                 | Headcount (Y1) |
| ------------------------ | ---------------------------------------------- | -------------- |
| **Lead**                 | Architecture, technical decisions              | 1              |
| **Full-Stack Engineers** | [Product Name], [Product Name], [Product Name] | 2              |
| **Frontend Engineer**    | Web interfaces, mobile                         | 1              |
| **DevOps/SRE**           | Infrastructure, deployment                     | 1              |

**Owns**:

- [Product Name] platform
- [Product Name] registry
- [Product Name] news interface
- [Product Name] API
- Shared infrastructure

### Data Engineering

**Mission**: Build the pipelines that power our intelligence products.

| Role                    | Responsibility                            | Headcount (Y1) |
| ----------------------- | ----------------------------------------- | -------------- |
| **Lead**                | Data architecture, quality                | 1              |
| **Data Engineers**      | Pipelines, ETL, integrations              | 2              |
| **Scraping/Collection** | Source collectors, [Intelligence Product] | 1              |

**Owns**:

- [Index Name] data pipeline
- [Index Name] data pipeline
- [Intelligence Product] collection system
- Source integrations
- Data warehouse

### AI/ML Engineering

**Mission**: Build the AI systems that power content generation and intelligence.

| Role                 | Responsibility                   | Headcount (Y1) |
| -------------------- | -------------------------------- | -------------- |
| **Lead**             | AI architecture, model selection | 1              |
| **ML Engineers**     | Agent workflows, fine-tuning     | 1              |
| **Prompt Engineers** | Agent prompts, quality           | 1              |

**Owns**:

- [AI System] orchestration system
- Agent workflows
- Content generation pipeline
- Quality assurance automation

---

## Year 1 Team (Target: 12 FTE)

| Function             | Headcount | Location          |
| -------------------- | --------- | ----------------- |
| CTO                  | 1         | Remote/[Location] |
| Platform Engineering | 5         | Remote            |
| Data Engineering     | 4         | Remote            |
| AI/ML Engineering    | 3         | Remote            |
| **Total**            | **12**    | —                 |

---

## Technology Stack

### Backend

| Layer        | Technology       | Rationale            |
| ------------ | ---------------- | -------------------- |
| **API**      | Node.js / NestJS | TypeScript, scalable |
| **Database** | PostgreSQL       | Relational, proven   |
| **Search**   | Elasticsearch    | Full-text, faceted   |
| **Cache**    | Redis            | Performance          |
| **Queue**    | BullMQ           | Job processing       |

### Frontend

| Layer       | Technology   | Rationale               |
| ----------- | ------------ | ----------------------- |
| **Web**     | Next.js 14   | React, SSR, performance |
| **Mobile**  | React Native | Cross-platform          |
| **Styling** | Tailwind CSS | Rapid development       |

### Data

| Layer         | Technology | Rationale              |
| ------------- | ---------- | ---------------------- |
| **Warehouse** | BigQuery   | Scalable analytics     |
| **ETL**       | Airflow    | Workflow orchestration |
| **Scraping**  | Playwright | Dynamic content        |

### AI/ML

| Layer             | Technology           | Rationale       |
| ----------------- | -------------------- | --------------- |
| **LLM**           | Claude (Anthropic)   | Quality, safety |
| **Orchestration** | Custom ([AI System]) | Control, cost   |
| **Embeddings**    | OpenAI               | Vector search   |

### Infrastructure

| Layer          | Technology     | Rationale                      |
| -------------- | -------------- | ------------------------------ |
| **Cloud**      | Google Cloud   | Cost, [target region] presence |
| **Containers** | Cloud Run      | Serverless simplicity          |
| **CI/CD**      | GitHub Actions | Integration                    |
| **Monitoring** | Datadog        | Observability                  |

---

## Key Principles

### 1. AI-Native

Every system is designed for AI collaboration:

- Human-in-the-loop by default
- Audit trails for all AI decisions
- Cost awareness built into workflows

### 2. Offline-Aware

Systems work across connectivity conditions:

- Progressive enhancement
- Graceful degradation
- Multi-channel delivery

### 3. [Global South / Target Market]-First

Optimized for our operating context:

- Low-bandwidth optimization
- Mobile-first design
- Local hosting where possible

### 4. Security-Conscious

Protecting sources and data:

- Encryption at rest and in transit
- Role-based access control
- Audit logging

---

## Hiring Priorities

### Phase 1 (Q1 2026)

1. **CTO** — Technical leadership, architecture
2. **Senior Full-Stack Engineer** — Platform foundation
3. **Data Engineer** — Pipeline architecture
4. **AI/ML Lead** — Agent system design

### Phase 2 (Q2-Q3 2026)

5. **Full-Stack Engineer** — Platform features
6. **Data Engineer** — [Intelligence Product], [Index Name]
7. **Frontend Engineer** — User interfaces
8. **DevOps/SRE** — Infrastructure

### Phase 3 (Q4 2026)

9-12. Scale based on product needs

---

## Working Model

### Remote-First

- Distributed team across time zones
- Async communication default
- Overlap hours: 14:00-17:00 UTC

### Tooling

| Function           | Tool             |
| ------------------ | ---------------- |
| Communication      | Slack            |
| Documentation      | Notion / GitBook |
| Code               | GitHub           |
| Project Management | Linear           |
| Design             | Figma            |

### Cadence

| Meeting         | Frequency     | Purpose                |
| --------------- | ------------- | ---------------------- |
| Daily standup   | Daily (async) | Status updates         |
| Sprint planning | Bi-weekly     | Work allocation        |
| Tech review     | Weekly        | Architecture decisions |
| All-hands       | Monthly       | Company alignment      |

---

## References

- [Newsroom Structure](tech-team.md)
- [AI Architecture](../../architecture/decisions/)
- [ADR-003: AI-Native Architecture](../../architecture/decisions/ADR-003-ai-native-architecture.md)
