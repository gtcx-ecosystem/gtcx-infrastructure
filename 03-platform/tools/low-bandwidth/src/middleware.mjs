/**
 * HTTP middleware for adaptive low-bandwidth mode.
 *
 * Wraps a Node.js HTTP response to automatically negotiate encoding,
 * trim non-essential fields, and emit telemetry events.
 */

import { encode } from './encoder.mjs';
import {
  resolveLevel,
  encodingForLevel,
  replayWindowForLevel,
} from './negotiator.mjs';
import { createDegradationEvent } from './telemetry.mjs';
import { buildMinimalResponse, estimateReduction } from './trimmer.mjs';

/**
 * @typedef {object} MiddlewareOptions
 * @property {string} [serviceName]
 * @property {string} [defaultRegion]
 * @property {Record<string, string[]>} [schemas]
 * @property {function} [onDegradation]
 */

/**
 * Create low-bandwidth middleware configuration for a request.
 *
 * Returns an object with helpers to encode and trim responses.
 *
 * @param {object} requestLike
 * @param {string | undefined} requestLike.url
 * @param {Record<string, string | string[] | undefined>} [requestLike.headers]
 * @param {MiddlewareOptions} [options]
 * @returns {{ level: string; encoding: string; replayWindow: number; transform: (data: unknown, schemaKey?: string) => { body: string | Buffer; encoding: string; metrics: object } }}
 */
export function createTransform(requestLike, options = {}) {
  const url = requestLike?.url ?? '';
  const headers = requestLike?.headers ?? {};

  // Parse query string for ?mode=minimal etc.
  let mode;
  const qIndex = url.indexOf('?');
  if (qIndex !== -1) {
    const params = new URLSearchParams(url.slice(qIndex + 1));
    mode = params.get('mode') ?? undefined;
  }

  const level = resolveLevel({
    mode,
    acceptEncoding: headers['accept-encoding'],
  });
  const encoding = encodingForLevel(level);
  const replayWindow = replayWindowForLevel(level);

  const schemas = options.schemas ?? {};

  /**
   * Transform a response payload for the negotiated level.
   *
   * @param {unknown} data
   * @param {string} [schemaKey]
   * @returns {{ body: string | Buffer; encoding: string; metrics: { level: string; encoding: string; replayWindow: number; reductionPercent: number; originalBytes: number; outputBytes: number } }}
   */
  function transform(data, schemaKey) {
    let payload = data;

    if (level === 'minimal' && schemaKey && schemas[schemaKey]) {
      payload = buildMinimalResponse({
        data,
        essentialFields: schemas[schemaKey],
      });
    }

    const body = encode(payload, encoding);
    const fullJson = JSON.stringify(data);
    const { originalBytes, reductionPercent } = estimateReduction({
      fullJson,
      trimmedJson:
        level === 'minimal' ? JSON.stringify(payload) : fullJson,
    });

    const metrics = {
      level,
      encoding,
      replayWindow,
      reductionPercent: level === 'minimal' ? reductionPercent : 0,
      originalBytes,
      outputBytes: Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body, 'utf8'),
    };

    return { body, encoding, metrics };
  }

  return { level, encoding, replayWindow, transform };
}

/**
 * Create a degradation event from request context and metrics.
 *
 * @param {object} requestLike
 * @param {object} metrics
 * @param {MiddlewareOptions} [options]
 * @returns {import('./telemetry.mjs').DegradationEvent}
 */
export function createEventFromRequest(requestLike, metrics, options = {}) {
  const headers = requestLike?.headers ?? {};
  const region =
    headers['x-gtcx-region'] ?? options.defaultRegion ?? 'unknown';
  return createDegradationEvent({
    level: metrics.level,
    region,
    service: options.serviceName,
  });
}
