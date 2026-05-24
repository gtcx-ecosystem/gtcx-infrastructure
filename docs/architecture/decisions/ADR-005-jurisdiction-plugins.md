---
title: 'ADR-005: Jurisdiction Plugin Architecture'
status: 'current'
date: '2026-05-02'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['security', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'monthly'
---

# ADR-005: Jurisdiction Plugin Architecture

## Status

Adopted (from [Protocol Partner])

## Date

2026-01-27

## Context

[Organization Name] covers intelligence across multiple jurisdictions ([Country A], [Country B], [Country C], etc.) with different:

- Regulatory agencies and structures
- Export requirements and duties
- Tax regimes and royalties
- Compliance frameworks
- Market structures

We needed to decide how to handle jurisdiction-specific content without:

- Duplicating content templates per country
- Hardcoding country-specific data
- Creating maintenance nightmares

## Decision

**Jurisdiction-specific data is CONFIGURATION, not CODE.** Each country has a plugin that configures [Index A] scoring, regulatory monitoring, and content templates.

### Plugin Structure

```typescript
interface JurisdictionPlugin {
  // Identity
  countryCode: string; // ISO 3166-1 alpha-2 (e.g., "GH", "RW")
  countryName: string;
  currency: string;
  timezone: string;
  languages: string[];

  // [Index A] Configuration
  ctii: {
    physicalComponents: PhysicalComponent[];
    digitalComponents: DigitalComponent[];
    regulatoryComponents: RegulatoryComponent[];
    benchmarkCountries: string[]; // For comparison
  };

  // [Intelligence Product] Configuration
  regulatory: {
    agencies: Agency[];
    gazetteUrl: string | null;
    primarySources: Source[];
    monitoringFrequency: 'realtime' | 'daily' | 'weekly';
  };

  // Content Configuration
  content: {
    keyTopics: string[];
    primaryCommodities: CommodityType[];
    stakeholderMix: StakeholderWeights;
    localExperts: Expert[];
  };
}
```

### Plugin Example: [Country A]

```typescript
export const countryAPlugin: JurisdictionPlugin = {
  countryCode: '[XX]', // ISO 3166-1 alpha-2
  countryName: '[Country A]',
  currency: '[CUR]',
  timezone: '[Region/City]',
  languages: ['[lang-a]', '[lang-b]'],

  regulatory: {
    agencies: [
      { id: '[agency-a]', name: '[Primary Regulatory Agency]', url: 'https://[agency-a-url]' },
      { id: '[agency-b]', name: '[Secondary Agency]', url: 'https://[agency-b-url]' },
    ],
    gazetteUrl: 'https://[gazette-url]',
    primarySources: [
      { type: 'gazette', url: 'https://[gazette-url]/feed' },
      { type: 'ministry', url: 'https://[ministry-url]/news' },
    ],
    monitoringFrequency: 'daily',
  },

  content: {
    keyTopics: ['[Topic A]', '[Topic B]', '[Topic C]'],
    primaryCommodities: ['[domain-item-a]', '[domain-item-b]'],
    stakeholderMix: {
      government: 0.3,
      industry: 0.3,
      civil_society: 0.2,
      international: 0.2,
    },
    localExperts: [{ name: '[Expert Name]', role: '[Role / Affiliation]' }],
  },
};
```

### Plugin Example: [Country B]

```typescript
export const countryBPlugin: JurisdictionPlugin = {
  countryCode: '[YY]',
  countryName: '[Country B]',
  currency: '[CUR]',
  timezone: '[Region/City]',
  languages: ['[lang-a]', '[lang-b]'],

  regulatory: {
    agencies: [
      { id: '[agency-a]', name: '[Primary Regulatory Agency]', url: 'https://[agency-a-url]' },
      { id: '[agency-b]', name: '[Secondary Agency]', url: 'https://[agency-b-url]' },
    ],
    gazetteUrl: 'https://[gazette-url]',
    primarySources: [
      { type: 'gazette', url: 'https://[gazette-url]/feed' },
      { type: 'ministry', url: 'https://[ministry-url]/news' },
    ],
    monitoringFrequency: 'daily',
  },

  content: {
    keyTopics: ['[Topic A]', '[Topic B]', '[Topic C]'],
    primaryCommodities: ['[domain-item-a]', '[domain-item-b]'],
    stakeholderMix: {
      government: 0.35,
      industry: 0.3,
      civil_society: 0.2,
      international: 0.15,
    },
    localExperts: [{ name: '[Expert Name]', role: '[Role / Affiliation]' }],
  },
};
```

## Consequences

### Benefits

- Deploy to new country in days (create plugin, not code)
- Country teams can own their configuration
- [Index A] methodology consistent, data varies
- Content templates work across jurisdictions

### Drawbacks

- Plugin schema must be comprehensive
- Edge cases may require template changes
- Plugin validation becomes critical

## Related Decisions

- ADR-002: Commodity-Agnostic Design
- ADR-004: Content-First Architecture
