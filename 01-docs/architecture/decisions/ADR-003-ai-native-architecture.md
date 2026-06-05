---
title: 'ADR-003: AI-Native Architecture'
status: 'current'
date: '2026-05-27'
owner: 'quality-evidence-lead'
role: 'quality-evidence-lead'
tier: 'informational'
tags: ['crypto', 'compliance', 'architecture', 'infrastructure', 'frontend']
review_cycle: 'monthly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# ADR-003: AI-Native Architecture

## Status

Accepted

## Date

2026-01-19

## Context

[Organization Name] operates in an AI-native environment:

1. **AI agents generate content**: [AI System] + Amp orchestration produces analysis and reports
2. **AI agents monitor sources**: [Intelligence Product]™ uses AI for extraction and classification
3. **Operations must be auditable**: Editorial decisions and content quality need traceability
4. **LLM outputs are unpredictable**: Raw LLM responses need validation before use

Traditional content architecture assumes human-written, deterministic output. AI-native architecture must account for:

- **Non-deterministic outputs**: LLMs produce varying content for similar prompts
- **Structured data extraction**: LLMs output text that must be parsed into types
- **Quality gates**: AI content requires human approval checkpoints
- **Observability**: Every AI-influenced decision must be traceable

## Decision

We adopt **AI-Native Architecture Patterns** for content production:

### 1. Structured Output with Validation

All LLM outputs are validated against schemas before use:

```typescript
import { z } from 'zod';

const MarketBriefSchema = z.object({
  headline: z.string().max(100),
  summary: z.string().max(500),
  priceData: z.object({
    current: z.number(),
    change: z.number(),
    changePercent: z.number(),
  }),
  drivers: z.array(
    z.object({
      factor: z.string(),
      impact: z.enum(['bullish', 'bearish', 'neutral']),
      magnitude: z.enum(['high', 'medium', 'low']),
    })
  ),
  sources: z.array(z.string().url()),
  qualityScore: z.number().min(0).max(100),
});

const result = MarketBriefSchema.safeParse(llmOutput);
if (result.success) {
  processContent(result.data);
} else {
  flagForRevision(result.error);
}
```

### 2. Agent Context Management

AI agents receive standardized context:

```yaml
# Agent context for [AI System] workflow
context:
  product: signal
  content_type: market_brief
  voice_guidelines: publishing/agentic/AGENT.md
  quality_threshold: 82
  sources:
    - research/market-scan.md
    - research/price-data.md
  stakeholders:
    - government
    - investor
    - producer
```

### 3. Iteration Tracking

Every workflow iteration is logged:

```typescript
interface IterationLog {
  workflowId: string;
  iterationNumber: number;
  agentName: string;
  inputHash: string;
  outputHash: string;
  qualityScore: number | null;
  tokensUsed: number;
  costUsd: number;
  duration: number;
  outcome: 'continue' | 'complete' | 'escalate';
}
```

### 4. Human Gates

Critical decisions require human approval:

```yaml
human_gates:
  publication: always
  breaking_alert: review_optional_if_score_above_90
  source_sensitivity: always
  named_individuals: always
  market_moving: compliance_review
```

## Consequences

### Benefits

1. **Reliable content**: All outputs validated before publication
2. **Full auditability**: Every iteration logged with context
3. **Quality control**: Scores and thresholds ensure standards
4. **Cost management**: Token usage tracked per workflow
5. **Continuous improvement**: Logs enable model fine-tuning

### Drawbacks

1. **Overhead**: Validation adds processing time
2. **Storage**: Iteration logs grow with volume
3. **Complexity**: Developers must understand AI patterns
4. **Schema maintenance**: Schemas must evolve with content needs

## Implementation Notes

- Quality score thresholds: [Platform B] 88, [Platform C] 82, [Platform D] 85, [Platform E] 80
- Maximum iterations: 15 (regulatory brief), 8 (breaking alert)
- Cost limits: $5/workflow (regulatory brief), $1/workflow (breaking alert)
- Human approval required for all published content

## References

- AI-native standards are maintained in the shared ecosystem governance stack, not in this repository.
- Autonomous agent workflow guidance lives in the shared ecosystem guidance stack, not in this repository.
- ADR-007: Content-First Architecture (`ADR-007-content-first-architecture.md`)
