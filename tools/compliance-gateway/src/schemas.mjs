/**
 * @fileoverview Request body schemas for the compliance gateway.
 *
 * All untrusted input is validated at the HTTP boundary with Zod.
 * Validation errors return 400 with the field paths that failed,
 * so clients can self-correct without revealing internal details.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { z } from 'zod';

// Single source of truth: the canonical jurisdiction catalog ships with
// @gtcx/compliance-data. Extending it is a deliberate signal that a new
// market is live; the schema picks up the new code on next deploy.
const __dirname = dirname(fileURLToPath(import.meta.url));
const jurisdictionsFile = join(__dirname, '../../compliance-data/jurisdictions.json');
let JURISDICTION_CODES = ['global'];
try {
  const data = JSON.parse(readFileSync(jurisdictionsFile, 'utf-8'));
  JURISDICTION_CODES = [...Object.keys(data.jurisdictions || {}), 'global'];
} catch {
  // Compliance-data file missing in a sandbox; fall back to a single
  // safe value rather than crashing the gateway at startup.
}
export { JURISDICTION_CODES };

export const QueryBodySchema = z
  .object({
    query: z
      .string()
      .min(1, 'query must be non-empty')
      .max(4096, 'query must be ≤ 4096 chars')
      .describe('Natural-language compliance question'),

    jurisdiction: z
      .enum(JURISDICTION_CODES)
      .optional()
      .describe('Two-letter or short-name jurisdiction code'),

    // `context` is treated as untrusted user content. It is shallow and
    // size-capped to limit prompt-injection blast radius. Anything that
    // doesn't fit here belongs in a separate, signed evidence bundle.
    context: z
      .record(
        z.string().max(64),
        z.union([
          z.string().max(2048),
          z.number(),
          z.boolean(),
          z.null(),
        ]),
      )
      .optional()
      .refine(
        (val) => !val || JSON.stringify(val).length <= 16_384,
        { message: 'context must serialize to ≤ 16384 bytes' },
      ),
  })
  .strict();

/**
 * Validate a parsed request body. Returns either { ok: true, data } or
 * { ok: false, status: 400, error: '...' } in a shape the server can
 * pass straight to sendJson.
 *
 * @param {unknown} body
 * @returns {{ ok: true, data: object } | { ok: false, status: 400, error: string, fieldErrors: Record<string, string[]> }}
 */
export function validateQueryBody(body) {
  const result = QueryBodySchema.safeParse(body);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const fieldErrors = result.error.flatten().fieldErrors;
  const firstField = Object.keys(fieldErrors)[0] ?? '_';
  const firstError = fieldErrors[firstField]?.[0] ?? 'invalid request body';
  return {
    ok: false,
    status: 400,
    error: `Invalid request body: ${firstField}: ${firstError}`,
    fieldErrors,
  };
}

/**
 * Build the user-facing prompt with the untrusted `context` clearly
 * delimited. Mirrored by an instruction in the system prompt that
 * tells the model to treat the delimited block as data, not directives.
 *
 * @param {object} parsed
 * @param {string} parsed.query
 * @param {string} [parsed.jurisdiction]
 * @param {object} [parsed.context]
 * @returns {string}
 */
export function buildUserMessage({ query, jurisdiction, context }) {
  const lines = [query];
  if (jurisdiction) {
    lines.push(`Jurisdiction: ${jurisdiction}`);
  }
  if (context && Object.keys(context).length > 0) {
    // The delimiter is explicit + matching tags. The system prompt
    // pins the same delimiter so any attempt to embed instructions
    // inside the context block is interpreted as data, not commands.
    lines.push('---BEGIN UNTRUSTED CONTEXT---');
    lines.push(JSON.stringify(context));
    lines.push('---END UNTRUSTED CONTEXT---');
  }
  return lines.join('\n');
}
