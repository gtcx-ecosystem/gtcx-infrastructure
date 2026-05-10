# Content Schema

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

> Data structures for [Organization Name] content objects

---

## Overview

All [Organization Name] content follows standardized schemas that enable:

- Consistent AI processing
- Multi-channel distribution
- Search and discovery
- Analytics and tracking

---

## Core Content Types

### Article

The base content unit for all published content.

```typescript
interface Article {
  // Identity
  id: string; // UUID
  slug: string; // URL-friendly identifier
  type: ArticleType; // Content type classification

  // Content
  headline: string; // Primary headline (max 100 chars)
  subheadline?: string; // Secondary headline (max 150 chars)
  summary: string; // Executive summary (max 300 chars)
  body: string; // Full content (Markdown)
  body_html?: string; // Rendered HTML

  // Metadata
  author: Author; // Primary author
  contributors?: Author[]; // Additional contributors
  sources?: Source[]; // Cited sources

  // Classification
  categories: Category[]; // Primary categorization
  tags: Tag[]; // Topic tags
  commodities: Commodity[]; // Covered commodities
  jurisdictions: Jurisdiction[]; // Covered countries

  // Media
  featured_image?: Media; // Hero image
  media?: Media[]; // Embedded media

  // Distribution
  platforms: Platform[]; // Target platforms
  distribution: DistributionConfig; // Channel configuration

  // Lifecycle
  status: ArticleStatus;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
  scheduled_at?: Date;
  expires_at?: Date;

  // Access
  access_level: AccessLevel;
  paywall?: PaywallConfig;

  // Analytics
  word_count: number;
  read_time_minutes: number;

  // AI Metadata
  ai_generated: boolean;
  ai_model?: string;
  human_reviewed: boolean;
  review_notes?: string;
}

type ArticleType =
  | 'breaking-alert'
  | 'news-digest'
  | 'regulatory-brief'
  | 'sector-report'
  | 'field-dispatch'
  | 'policy-brief'
  | 'analysis'
  | 'opinion';

type ArticleStatus =
  | 'draft'
  | 'submitted'
  | 'in-review'
  | 'revision'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'killed';

type AccessLevel = 'public' | 'registered' | 'subscriber' | 'premium';
```

---

### Author

```typescript
interface Author {
  id: string;
  name: string;
  slug: string;
  type: 'staff' | 'contributor' | 'bureau' | 'ai';

  // Profile
  title?: string; // e.g. "[Region] Bureau Chief"
  bio?: string; // Short biography
  avatar?: Media;

  // Contact
  email?: string;
  twitter?: string;
  linkedin?: string;

  // Metadata
  articles_count: number;
  joined_at: Date;
  active: boolean;
}
```

---

### Source

```typescript
interface Source {
  id: string;
  type: SourceType;

  // Identity
  name: string; // Source name/description
  organization?: string; // Organization name
  title?: string; // Source's title/role

  // Attribution
  attribution: string; // How to cite
  confidential: boolean; // Anonymous source

  // Verification
  verified: boolean;
  verification_method?: string;
  verified_by?: string;
  verified_at?: Date;

  // Contact (internal only)
  contact_info?: string; // Not published
}

type SourceType =
  | 'official' // Government/official source
  | 'industry' // Industry source
  | 'expert' // Subject matter expert
  | 'document' // Document source
  | 'data' // Data source
  | 'anonymous'; // Confidential source
```

---

### Media

```typescript
interface Media {
  id: string;
  type: MediaType;

  // Files
  url: string; // Primary URL
  thumbnail_url?: string; // Thumbnail for images/video

  // Metadata
  filename: string;
  mime_type: string;
  file_size: number; // Bytes

  // Dimensions (images/video)
  width?: number;
  height?: number;
  duration?: number; // Seconds (video/audio)

  // Attribution
  caption?: string;
  alt_text?: string;
  credit?: string;
  source_url?: string;

  // Rights
  license?: string;
  usage_restrictions?: string;

  // Metadata
  created_at: Date;
  uploaded_by: string;
}

type MediaType = 'image' | 'video' | 'audio' | 'document' | 'chart' | 'infographic';
```

---

### Category & Tag

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string; // For hierarchy

  // Display
  color?: string;
  icon?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  type: TagType;

  // Metadata
  articles_count: number;
  trending: boolean;
}

type TagType = 'topic' | '[domain_category]' | 'jurisdiction' | 'organization' | 'person' | 'event';
```

---

### Jurisdiction & Commodity

```typescript
interface Jurisdiction {
  id: string;
  name: string;
  iso_code: string;                    // ISO 3166-1 alpha-2
  region: Region;

  // Intelligence
  [index_a]_score?: number;
  [index_a]_grade?: string;
  [index_b]_score?: number;

  // Metadata
  active: boolean;
  coverage_tier: 1 | 2 | 3;
}

type Region =
  | '[region_a]'
  | '[region_b]'
  | '[region_c]'
  | '[region_d]'
  | '[region_e]';

interface Commodity {
  id: string;
  name: string;
  symbol: string;                      // XAU, XAG, etc.
  type: CommodityType;

  // Market data
  current_price?: number;
  price_currency?: string;
  price_updated_at?: Date;
}

type CommodityType =
  | 'precious_metal'
  | 'base_metal'
  | 'mineral'
  | 'gemstone';
```

---

### Distribution Config

```typescript
interface DistributionConfig {
  // Channels
  website: boolean;
  email: EmailDistribution | false;
  linkedin: SocialDistribution | false;
  twitter: SocialDistribution | false;
  whatsapp: WhatsAppDistribution | false;
  api: boolean;

  // Timing
  publish_immediately: boolean;
  scheduled_time?: Date;
  embargo_until?: Date;
}

interface EmailDistribution {
  segments: string[]; // Subscriber segments
  subject_line?: string; // Override default
  preview_text?: string;
}

interface SocialDistribution {
  enabled: boolean;
  custom_text?: string; // Platform-specific text
  image?: Media; // Platform-specific image
  scheduled_time?: Date; // Platform-specific timing
}

interface WhatsAppDistribution {
  lists: string[]; // Broadcast lists
  format: 'full' | 'summary' | 'alert';
}
```

---

## Content Type Specifications

### Breaking Alert

```typescript
interface BreakingAlert extends Article {
  type: 'breaking-alert';

  // Required fields
  alert_level: 'critical' | 'high' | 'medium';
  headline: string; // Max 80 chars
  summary: string; // Max 200 chars

  // Optional
  body?: string; // Brief expansion

  // Constraints
  // - Must publish within 30 minutes
  // - Requires L4 approval only
  // - Auto-distributes to all channels
}
```

### News Digest

```typescript
interface NewsDigest extends Article {
  type: 'news-digest';

  // Structure
  sections: DigestSection[];

  // Constraints
  // - 5-10 items per digest
  // - Published on schedule (daily/weekly)
}

interface DigestSection {
  title: string;
  items: DigestItem[];
}

interface DigestItem {
  headline: string;
  summary: string;
  source_url?: string;
  jurisdiction?: Jurisdiction;
  [domain_category]?: DomainCategory;
}
```

### Regulatory Brief

```typescript
interface RegulatoryBrief extends Article {
  type: 'regulatory-brief';

  // Regulatory metadata
  regulation_id?: string; // Link to [Intelligence Product]
  effective_date?: Date;
  jurisdiction: Jurisdiction;
  regulatory_body: string;

  // Impact assessment
  impact_level: 'high' | 'medium' | 'low';
  affected_stakeholders: string[];
  action_required?: string;
  deadline?: Date;

  // Constraints
  // - Requires L2 fact-check
  // - Must include official source
}
```

### Sector Report

```typescript
interface SectorReport extends Article {
  type: 'sector-report';

  // Structure
  executive_summary: string; // 300-500 words
  sections: ReportSection[];
  methodology?: string;
  data_sources: string[];

  // Classification
  sector: string;
  sub_sector?: string;
  time_period: string; // "Q1 2026", "2025", etc.

  // Constraints
  // - Requires L2 + L3 review
  // - Minimum 2000 words
  // - Must include data visualization
}

interface ReportSection {
  title: string;
  content: string;
  charts?: Chart[];
  tables?: Table[];
}
```

---

## Validation Rules

### Common Validations

| Field           | Rule                                   |
| --------------- | -------------------------------------- |
| `headline`      | Required, 10-100 characters            |
| `summary`       | Required, 50-300 characters            |
| `body`          | Required for non-alerts, min 200 words |
| `author`        | Required                               |
| `categories`    | At least 1 required                    |
| `jurisdictions` | At least 1 for regional content        |

### Type-Specific Validations

| Type               | Additional Rules                               |
| ------------------ | ---------------------------------------------- |
| `breaking-alert`   | Headline ≤80 chars, summary ≤200 chars         |
| `regulatory-brief` | Jurisdiction required, effective_date required |
| `sector-report`    | Executive summary required, ≥2000 words        |
| `field-dispatch`   | Author must be contributor/bureau              |

---

## JSON Schema

Full JSON Schema available at:

- `/data-models/article.schema.json`
- `/data-models/author.schema.json`
- `/data-models/media.schema.json`

---

## References

- [Database Schema](./database-schema.md)
- [Editorial Independence](../agents/governance/editorial-independence.md)
