## Technology Stack

### Content Factory (NestJS + XState 5)

```
NestJS 10.x + PostgreSQL (Prisma ORM)
┌─────────────────────────────────────────────────────────┐
│ Content State Machine (XState 5)                         │
│                                                          │
│  draft → pending_review → approved → scheduled → published│
│    ↑                                              │       │
│    └──────────────── request_changes ─────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Data Model (Core Tables)

| Table                  | Purpose                              |
| ---------------------- | ------------------------------------ |
| `contents`             | Published content with state machine |
| `publications`         | Channel-specific publication records |
| `content_performances` | Engagement metrics                   |
| `insights`             | AI-synthesized intelligence          |
| `intelligence_sources` | Raw source material                  |
| `entities`             | People, organizations, regulations   |
| `daily_briefs`         | Automated briefing documents         |

---

## Key Architectural Decisions

See `/.gtcx/decisions/` for full ADRs.

| Decision                 | Choice                                      | Rationale                                        |
| ------------------------ | ------------------------------------------- | ------------------------------------------------ |
| Publishing orchestration | [AI System] + [AI System B]                 | Cost-effective, Git-as-memory, production-proven |
| Database                 | PostgreSQL                                  | Government-grade, PostGIS support                |
| Content state            | XState 5                                    | Clear workflow states, audit trail               |
| Admin                    | Next.js admin routes (`/admin/*`) with RBAC | Rapid development, full-stack TypeScript         |
| AI models                | Claude (via [AI System B])                  | Best for analysis and writing                    |
| Platform split           | By entity                                   | Clear commercial vs. credibility separation      |

---

## Architecture Principles

| Principle                     | Application                                         |
| ----------------------------- | --------------------------------------------------- |
| **Content-First**             | AI optimized for media production, not transactions |
| **Editorial Control**         | Human-in-loop for all published content             |
| **Global South Optimized**    | Offline-first, multi-channel, multi-language        |
| **[Platform F]-First Design** | Built for hardest environments, works everywhere    |
| **Cost-Aware**                | Budget-capped workflows, token optimization         |

### Design Principles

#### 1. Sovereign Accessibility

Design for frontier markets first. $50 device target, <100KB transactions, 45+ day offline capability.

#### 2. Regenerative Economics

Create non-zero-sum outcomes. Every participant benefits from system growth.

#### 3. Open Infrastructure

Build infrastructure others can build on. API-first, standards-compliant, interoperable.

#### 4. Engineering Excellence

Production-ready from day one. Comprehensive testing, observability, documentation.

---

## Global South Design

| Constraint       | Reality                            | Design Response                        |
| ---------------- | ---------------------------------- | -------------------------------------- |
| **Connectivity** | 40% feature phones, 2G/3G dominant | USSD, SMS, offline-first               |
| **Bandwidth**    | Expensive, unreliable              | 70-85% compression, <100KB/transaction |
| **Devices**      | $50 smartphones, 1GB RAM           | Lightweight PWA, minimal JS            |
| **Power**        | Intermittent, solar-dependent      | Battery-optimized, offline queuing     |
| **Literacy**     | Variable across regions            | Voice, icons, local languages          |
| **Languages**    | 15+ across target markets          | Multi-language content production      |

### Connectivity Profiles

| Profile     | Characteristics         | Content Delivery Strategy              |
| ----------- | ----------------------- | -------------------------------------- |
| `offline`   | Zero connectivity       | Cached content only, queue alerts      |
| `ussd-only` | Feature phone, 160 char | Headlines + USSD codes for details     |
| `edge`      | 2G/EDGE, <200 Kbps      | Text-only, high compression, no images |
| `degraded`  | 3G intermittent         | Compressed images, essential content   |
| `standard`  | 4G/WiFi                 | Full content, real-time updates        |
| `satellite` | High latency, expensive | Batched delivery, cost warnings        |

---

## Multi-Channel Distribution

8 channels optimized for different connectivity profiles and user preferences.

| Channel      | Connectivity      | Use Case                      |
| ------------ | ----------------- | ----------------------------- |
| **Email**    | Any (async)       | Digests, reports              |
| **WhatsApp** | Edge+             | High-engagement alerts        |
| **SMS**      | Any               | Critical alerts (160 char)    |
| **USSD**     | Feature phones    | Interactive menus             |
| **Telegram** | Edge+             | Tech-savvy users              |
| **Web/PWA**  | Standard/Degraded | Full content, offline-capable |
| **API**      | Standard          | Enterprise integration        |
| **Audio**    | Offline download  | Low-literacy users            |

---

## RAG Knowledge Architecture

6 vector collections for editorial memory:

| Domain                   | Sources                                                              | Update Frequency |
| ------------------------ | -------------------------------------------------------------------- | ---------------- |
| **Regulatory Corpus**    | Government gazettes, ministry announcements, [Regulatory body] rules | Daily            |
| **Country Profiles**     | [X] countries/markets + key trade partners                           | Weekly           |
| **Editorial Guidelines** | Voice guide, style manual, topic taxonomies                          | As needed        |
| **Domain Glossaries**    | Terminology per language (6 Tier 1 + 5 Tier 2)                       | As needed        |
| **Industry Landscape**   | Competitor profiles, market structure, key players                   | Monthly          |
| **Content Archive**      | Past articles, reports, alerts (2+ years)                            | Continuous       |

---

## MCP Server Ecosystem

5 custom Model Context Protocol servers provide live data access to agents:

| MCP Server                    | Function                       | Global South Feature           |
| ----------------------------- | ------------------------------ | ------------------------------ |
| `[org]-sources`               | News, gov portals, market data | Gov portal caching for offline |
| `[org]-[intelligence-module]` | Regulatory database            | Offline-syncable snapshots     |
| `[org]-analytics`             | Engagement metrics             | Low-bandwidth tracking         |
| `[org]-distribution`          | Multi-channel delivery         | USSD, SMS, WhatsApp            |
| `[org]-i18n`                  | Translation engine             | 6+ language support            |

---

## Core Services

### Content Service

Manages all content creation, storage, and retrieval.

| Component | Technology    | Function                      |
| --------- | ------------- | ----------------------------- |
| CMS API   | NestJS        | Content CRUD, workflows       |
| Search    | Elasticsearch | Full-text, faceted search     |
| Assets    | Cloud Storage | Images, documents, media      |
| Cache     | Redis         | Content delivery acceleration |

### Identity Service

Authentication, authorization, user management.

| Component | Technology            | Function                   |
| --------- | --------------------- | -------------------------- |
| Auth      | Auth0 / Supabase Auth | SSO, MFA, social login     |
| Users     | PostgreSQL            | User profiles, preferences |
| Roles     | RBAC                  | Permission management      |
| API Keys  | Custom                | [Platform G] API access    |

**User Types**: Anonymous readers, Registered users (free), Subscribers (paid), Contributors, Editors, Administrators.

### Commerce Service

Subscriptions, billing, payments.

| Component     | Technology     | Function           |
| ------------- | -------------- | ------------------ |
| Subscriptions | Stripe         | Plan management    |
| Payments      | Stripe + Local | Card, mobile money |
| Invoicing     | Custom         | B2B billing        |
| Usage         | Custom         | API metering       |

---

## Intelligence Pipelines

### [Index A] Pipeline

```
Sources -> Collectors -> Validation -> Calculation -> Storage -> Publication
             |              |            |            |           |
             v              v            v            v           v
         Scheduled      Quality       Index       PostgreSQL   Website
         + Triggered    Checks       Algorithm    + Search     + API
```

### [Intelligence Product] Pipeline

```
Sources -> Scraping -> Processing -> Classification -> Alerting -> Distribution
             |            |              |              |            |
             v            v              v              v            v
         Playwright    OCR/NLP       Taxonomy       Webhooks     Email
         + APIs        + Translation  + AI          + Push       + SMS
```

---

## Detailed Technology Stack

### Backend

| Layer     | Technology    | Version | Purpose          |
| --------- | ------------- | ------- | ---------------- |
| Runtime   | Node.js       | 20 LTS  | Server runtime   |
| Framework | NestJS        | 10.x    | API framework    |
| Database  | PostgreSQL    | 15      | Primary data     |
| Search    | Elasticsearch | 8.x     | Full-text search |
| Cache     | Redis         | 7.x     | Caching, queues  |
| Queue     | BullMQ        | 4.x     | Job processing   |

### Frontend

| Layer     | Technology      | Version | Purpose       |
| --------- | --------------- | ------- | ------------- |
| Framework | Next.js         | 14      | React SSR     |
| Styling   | Tailwind CSS    | 3.x     | Utility CSS   |
| State     | Zustand         | 4.x     | Client state  |
| Forms     | React Hook Form | 7.x     | Form handling |

### AI/ML

| Component       | Technology                                | Purpose                      |
| --------------- | ----------------------------------------- | ---------------------------- |
| Agent Framework | LangGraph, Agno, CrewAI, PydanticAI       | Agent orchestration          |
| LLM             | Claude (Anthropic), GPT-4                 | Content generation, analysis |
| RAG             | LlamaIndex, Qdrant (cloud), Chroma (edge) | Knowledge retrieval          |
| TTS             | Piper, Coqui                              | Audio content generation     |
| Observability   | LangSmith                                 | Agent monitoring             |

### Infrastructure

| Layer     | Technology                       | Purpose                    |
| --------- | -------------------------------- | -------------------------- |
| Cloud     | Google Cloud                     | Primary cloud              |
| Compute   | Cloud Run                        | Serverless containers      |
| Database  | Cloud SQL                        | Managed PostgreSQL         |
| Storage   | Cloud Storage                    | File storage               |
| CDN       | Cloudflare                       | Edge delivery              |
| DNS       | Cloudflare                       | DNS management             |
| Messaging | [SMS/messaging provider], Twilio | SMS/USSD/WhatsApp delivery |

### DevOps

| Layer      | Technology            | Purpose          |
| ---------- | --------------------- | ---------------- |
| Repository | GitHub                | Code hosting     |
| CI/CD      | GitHub Actions        | Automation       |
| Monitoring | Datadog               | Observability    |
| Logging    | Datadog Logs          | Centralized logs |
| Secrets    | Google Secret Manager | Credentials      |

---

## Architecture Decision Records

We document significant architecture decisions in ADRs:

| ADR     | Title                         | Status   |
| ------- | ----------------------------- | -------- |
| ADR-001 | Monorepo Structure            | Accepted |
| ADR-002 | Commodity Agnostic Design     | Accepted |
| ADR-003 | AI-Native Architecture        | Accepted |
| ADR-004 | Offline-First Mobile          | Accepted |
| ADR-005 | Jurisdiction Plugins          | Accepted |
| ADR-006 | Package Boundaries            | Accepted |
| ADR-007 | Content-First Architecture    | Accepted |
| ADR-008 | Multi-Channel Distribution    | Accepted |
| ADR-009 | Platform Architecture Pattern | Accepted |
| ADR-010 | Service Taxonomy              | Accepted |

---

## Key Architectural Layers

### 1. Intelligence Layer

The foundation of all [Organization Name] products — proprietary indices, research, and knowledge bases.

| Component                  | Function                                                             |
| -------------------------- | -------------------------------------------------------------------- |
| **[Index A]**              | Commodity Trade Integrity Index — jurisdiction-level scoring         |
| **[Index C]**              | Civic Digital Infrastructure Index — government transparency scoring |
| **[Intelligence Product]** | Real-time regulatory monitoring and alerts                           |
| **Knowledge Base**         | Entities, regulatory tracker, glossary, market structure             |

### 2. Publishing Layer ([AI System])

AI-native content production system with 15 agents across 9 workflows.

| Component             | Function                                    |
| --------------------- | ------------------------------------------- |
| **Scout Agents**      | Monitor sources, detect breaking stories    |
| **Analyst Agents**    | Synthesize implications, provide context    |
| **Writer Agents**     | Draft content in appropriate formats        |
| **QA Agents**         | Fact-check, style-check, validate           |
| **Translation Agent** | Multi-language output (6 Tier 1 + 5 Tier 2) |
| **Human Gates**       | Editorial approval before publication       |

### 3. Distribution Layer

8 channels optimized for different connectivity profiles and user preferences.

| Channel      | Connectivity      | Use Case                      |
| ------------ | ----------------- | ----------------------------- |
| **Email**    | Any (async)       | Digests, reports              |
| **WhatsApp** | Edge+             | High-engagement alerts        |
| **SMS**      | Any               | Critical alerts (160 char)    |
| **USSD**     | Feature phones    | Interactive menus             |
| **Telegram** | Edge+             | Tech-savvy users              |
| **Web/PWA**  | Standard/Degraded | Full content, offline-capable |
| **API**      | Standard          | Enterprise integration        |
| **Audio**    | Offline download  | Low-literacy users            |

### 4. Platform Layer

| Category               | Products                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| **Platforms/Networks** | [Platform A], [Platform B]                                           |
| **Research & Media**   | [Platform D], [Platform C], [Platform E], [Platform F], [Platform G] |

---
