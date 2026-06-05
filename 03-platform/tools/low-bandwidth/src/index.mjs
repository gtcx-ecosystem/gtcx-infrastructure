/**
 * @gtcx/low-bandwidth — Server-side adaptive low-bandwidth middleware.
 *
 * Exports:
 * - Content negotiation (resolveLevel, acceptsLowBandwidth, encodingForLevel)
 * - Response encoding (encode, decode, compact/minimal binary formats)
 * - Field trimming (buildMinimalResponse, trimObject)
 * - Telemetry (createDegradationEvent, shouldAlert, toPrometheusMetrics)
 * - HTTP middleware (createTransform, createEventFromRequest)
 */

export {
  resolveLevel,
  acceptsLowBandwidth,
  mostRestrictive,
  encodingForLevel,
  replayWindowForLevel,
} from './negotiator.mjs';

export { encode, decode, encodeMinimalBinary, decodeMinimalBinary } from './encoder.mjs';

export { buildMinimalResponse, trimObject, estimateReduction } from './trimmer.mjs';

export {
  createDegradationEvent,
  shouldAlert,
  toPrometheusMetrics,
} from './telemetry.mjs';

export { createTransform, createEventFromRequest } from './middleware.mjs';
