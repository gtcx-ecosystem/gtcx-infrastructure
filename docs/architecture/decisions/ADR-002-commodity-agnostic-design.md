---
title: 'ADR-002: Commodity-Agnostic Design'
status: 'current'
date: '2026-05-02'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['architecture', 'infrastructure', 'frontend', 'ux', 'mobile']
review_cycle: 'monthly'
---

# ADR-002: Commodity-Agnostic Design

## Status

Adopted (from [Protocol Partner])

## Date

2026-01-19

## Context

[Organization Name] covers intelligence and analysis across **25+ commodities**:

- **Precious Metals**: gold, silver, platinum, palladium, rhodium
- **Agricultural**: cocoa, coffee, cotton, sugar, vanilla, palm oil, rubber
- **Industrial Minerals**: cobalt, lithium, copper, tin, tantalum, tungsten
- **Gemstones**: diamond, ruby, emerald, sapphire
- **Energy**: crude oil, natural gas, LNG

Using gold-specific naming throughout would require duplicating content templates, analysis frameworks, and data models for each commodity.

## Decision

We implement **commodity-agnostic design** where:

1. **Commodities are attributes, not types** — Content and indices are parameterized by commodity
2. **All analysis logic is configurable** — Templates accept commodity configuration
3. **UI components are commodity-aware** — Same components display different commodities

### Core Abstractions

```typescript
type CommodityType =
  | 'gold'
  | 'silver'
  | 'platinum'
  | 'palladium'
  | 'rhodium'
  | 'cocoa'
  | 'coffee'
  | 'cotton'
  | 'sugar'
  | 'vanilla'
  | 'cobalt'
  | 'lithium'
  | 'copper'
  | 'tin'
  | 'tantalum'
  | 'diamond'
  | 'ruby'
  | 'emerald'
  | 'sapphire'
  | 'crude_oil'
  | 'natural_gas';

interface CommodityConfig {
  type: CommodityType;
  category: 'precious_metal' | 'agricultural' | 'industrial' | 'gemstone' | 'energy';
  displayName: string;
  defaultUnit: MeasurementUnit;
  hasPurity: boolean;
  qualityGrades: string[];
  primaryProducers: string[]; // Key producing countries
  keyBenchmarks: string[]; // [Benchmark bodies for this domain]
  verificationFrameworks: string[]; // [Applicable verification frameworks]
}
```

### Naming Conventions

| Wrong (Commodity-Specific) | Right (Generic)                            |
| -------------------------- | ------------------------------------------ |
| `gold-market-analysis`     | `market-analysis` with `commodity: 'gold'` |
| `Gold[Index A]Score`       | `[Index A]Score` with `commodity` field    |
| `goldPrice`                | `price` with `commodity` and `unit`        |

## Consequences

### Benefits

- Single codebase handles all commodities
- Easy expansion: Adding cocoa = configuration, not code
- Consistent UX across commodity coverage
- [Index A]/[Index B] indices work for any commodity

### Drawbacks

- Initial complexity in generic types
- Some fields only apply to certain commodities
- Validation rules vary by commodity type
