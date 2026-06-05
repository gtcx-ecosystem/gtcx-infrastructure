/**
 * Zod schemas for POST /audit/query.
 *
 * Source of truth: gtcx-mobile/apps/web/portal/lib/audit-client.ts
 * (`QueryAuditRequest` / `QueryAuditResponse` interfaces).
 *
 * AgentOutputEventSchema is declared inline (not imported from
 * audit-bundles/) so this module is independent of the audit-bundles
 * branch state. The two endpoints share the AgentOutputEvent contract
 * because mobile defines it once in
 * gtcx-mobile/03-platform/packages/agents/src/transport-contract.ts — if the two
 * server-side declarations ever diverge, mobile is canonical.
 */

import { z } from 'zod';

export const AgentOutcomeSchema = z.enum(['continue', 'complete', 'escalate', 'failure']);

export const AgentOutputEventSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  workflowId: z.string().min(1),
  iterationNumber: z.number().int().nonnegative(),
  agentId: z.string().min(1),
  promptVersionId: z.string().min(1),
  inputHash: z.string().min(1),
  outputHash: z.string().min(1),
  qualityScore: z.number().nullable(),
  tokensUsed: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
  outcome: AgentOutcomeSchema,
  schemaValid: z.boolean().nullable(),
  previousHash: z.string().nullable(),
  eventHash: z.string().min(1),
  synced: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const QueryAuditRequestSchema = z.object({
  agentId: z.string().min(1).max(256).optional(),
  actorDid: z.string().min(1).max(256).optional(),
  outcome: AgentOutcomeSchema.optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});

/**
 * Server side never emits the `source` field — that's a client-side
 * annotation in audit-client.ts to distinguish live vs fixture data.
 * Our response is always live-source.
 */
export const QueryAuditResponseSchema = z.object({
  events: z.array(AgentOutputEventSchema),
  totalMatched: z.number().int().nonnegative(),
  truncated: z.boolean(),
});
