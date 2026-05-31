/**
 * @fileoverview Prometheus-style metrics for the compliance gateway.
 *
 * Zero-dependency emitter: no prom-client, no external bundle. Counters
 * and gauges live in this module's closure and are scraped by the
 * compliance-gateway ServiceMonitor at /metrics.
 *
 * Metric naming follows the gateway scope:
 *   compliance_gateway_<subject>_<unit>
 * Labels are kept low-cardinality (provider, tier, status, principal,
 * action) and bounded — principal labels truncated to 64 chars.
 */

/** @type {Map<string, number>} */
const counters = new Map();
/** @type {Map<string, number>} */
const gauges = new Map();
/** @type {Map<string, string>} */
const meta = new Map();

function labelKey(name, labels) {
  if (!labels) return name;
  const flat = Object.entries(labels)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}="${escapeLabel(String(v))}"`)
    .sort()
    .join(',');
  return flat ? `${name}{${flat}}` : name;
}

function escapeLabel(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').slice(0, 64);
}

/**
 * Increment a counter by 1 (or `value`).
 * @param {string} name
 * @param {Record<string, string | number | undefined> | undefined} labels
 * @param {number} [value=1]
 */
export function incrementCounter(name, labels, value = 1) {
  const key = labelKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + value);
}

/**
 * Set a gauge to `value`.
 * @param {string} name
 * @param {Record<string, string | number | undefined> | undefined} labels
 * @param {number} value
 */
export function setGauge(name, labels, value) {
  const key = labelKey(name, labels);
  gauges.set(key, value);
}

/**
 * Attach a HELP comment that will be rendered next time `renderMetrics` runs.
 * @param {string} name
 * @param {string} help
 */
export function declareMetric(name, help) {
  meta.set(name, help);
}

/**
 * Render the Prometheus exposition payload.
 * @returns {string}
 */
export function renderMetrics() {
  const seenNames = new Set();
  const lines = [];

  const emit = (key, value) => {
    const name = key.split('{')[0];
    if (!seenNames.has(name)) {
      const help = meta.get(name);
      if (help) lines.push(`# HELP ${name} ${help}`);
      lines.push(`# TYPE ${name} ${gauges.has(key) ? 'gauge' : 'counter'}`);
      seenNames.add(name);
    }
    lines.push(`${key} ${value}`);
  };

  for (const [key, value] of counters) emit(key, value);
  for (const [key, value] of gauges) emit(key, value);

  return `${lines.join('\n')}\n`;
}

/**
 * Reset all metrics (intended for tests only).
 */
export function resetMetrics() {
  counters.clear();
  gauges.clear();
}

// Declare the canonical metric surface up-front so /metrics renders
// HELP comments even before the first observation.
declareMetric('compliance_gateway_audit_records_total', 'Signed audit records produced, by action');
declareMetric('compliance_gateway_audit_sign_failures_total', 'Audit signing failures');
declareMetric('compliance_gateway_audit_chain_in_memory', 'In-memory audit chain depth');
declareMetric(
  'compliance_gateway_audit_chain_total',
  'Total audit records signed (including checkpointed)'
);
declareMetric(
  'compliance_gateway_audit_signing',
  '1 if the gateway is producing signed audit records, 0 otherwise'
);
declareMetric(
  'compliance_gateway_audit_sink_connected',
  '1 if the audit sink is connected to its durable backend, 0 otherwise'
);
declareMetric('compliance_gateway_requests_total', 'HTTP requests, by route + status');
declareMetric(
  'compliance_gateway_exceptions_served_total',
  'Exception events returned by /v1/exceptions, by tenant and truncation state'
);
declareMetric(
  'compliance_gateway_evidence_bundle_records_total',
  'Audit records returned by /v1/audit/evidence-bundle, by tenant and format'
);
declareMetric('compliance_gateway_query_latency_ms', 'Per-provider /v1/query latency (ms)');
declareMetric(
  'compliance_gateway_cost_usd_total',
  'Cumulative estimated LLM cost in USD, by provider + tier + principal'
);
declareMetric(
  'compliance_gateway_throttle_total',
  'Requests throttled by per-principal budget, by reason'
);
declareMetric(
  'compliance_gateway_inflight_requests',
  'In-flight /v1/query requests on this pod — HPA scaling target'
);
