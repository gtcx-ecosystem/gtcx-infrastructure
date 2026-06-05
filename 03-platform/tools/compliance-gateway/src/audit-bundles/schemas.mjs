/**
 * Zod schemas for POST /audit/bundles.
 *
 * Source of truth: gtcx-mobile/03-platform/packages/agents/src/transport-contract.ts.
 * These mirror that file exactly; if the two diverge, mobile is canonical
 * per the cross-team agreement on issue #50.
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

export const AuditBundleRequestSchema = z.object({
  bundleId: z.string().min(1).max(128),
  events: z.array(AgentOutputEventSchema).min(1).max(1000),
});
