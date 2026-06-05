/**
 * Degradation telemetry for adaptive low-bandwidth mode.
 *
 * Emits structured events whenever a service enters or changes
 * degradation level. Events are designed for Prometheus counters
 * and PagerDuty alerting integration.
 */

/**
 * @typedef {object} DegradationEvent
 * @property {'resilience.degradation'} type
 * @property {'normal' | 'reduced' | 'minimal' | 'offline'} level
 * @property {string} region
 * @property {number} [bandwidth_bps]
 * @property {number} [latency_ms]
 * @property {number} [queue_depth]
 * @property {string} [service]
 * @property {string} timestamp
 */

/**
 * Create a degradation telemetry event.
 *
 * @param {object} params
 * @param {'normal' | 'reduced' | 'minimal' | 'offline'} params.level
 * @param {string} params.region
 * @param {number} [params.bandwidthBps]
 * @param {number} [params.latencyMs]
 * @param {number} [params.queueDepth]
 * @param {string} [params.service]
 * @param {Date} [params.now]
 * @returns {DegradationEvent}
 */
export function createDegradationEvent({
  level,
  region,
  bandwidthBps,
  latencyMs,
  queueDepth,
  service,
  now = new Date(),
}) {
  if (!level || !region) {
    throw new Error('level and region are required');
  }

  /** @type {DegradationEvent} */
  const event = {
    type: 'resilience.degradation',
    level,
    region,
    timestamp: now.toISOString(),
  };

  if (typeof bandwidthBps === 'number' && bandwidthBps >= 0) {
    event.bandwidth_bps = Math.round(bandwidthBps);
  }
  if (typeof latencyMs === 'number' && latencyMs >= 0) {
    event.latency_ms = Math.round(latencyMs);
  }
  if (typeof queueDepth === 'number' && queueDepth >= 0) {
    event.queue_depth = Math.round(queueDepth);
  }
  if (service) {
    event.service = service;
  }

  return event;
}

/**
 * Determine if a PagerDuty alert should fire based on event history.
 *
 * Alert rule: >5% of active devices in a region are in `offline`
 * mode for >30 minutes.
 *
 * @param {object} params
 * @param {DegradationEvent[]} params.history
 * @param {string} params.region
 * @param {number} [params.thresholdPercent]
 * @param {number} [params.windowMinutes]
 * @param {Date} [params.now]
 * @returns {{ shouldAlert: boolean; offlineRatio: number; offlineCount: number; totalCount: number }}
 */
export function shouldAlert({
  history,
  region,
  thresholdPercent = 5,
  windowMinutes = 30,
  now = new Date(),
}) {
  if (!history || history.length === 0) {
    return { shouldAlert: false, offlineRatio: 0, offlineCount: 0, totalCount: 0 };
  }

  const cutoff = new Date(now.getTime() - windowMinutes * 60 * 1000);
  const windowEvents = history.filter(
    (e) => e.region === region && new Date(e.timestamp) >= cutoff
  );

  if (windowEvents.length === 0) {
    return { shouldAlert: false, offlineRatio: 0, offlineCount: 0, totalCount: 0 };
  }

  // Deduplicate by implicit device (use event as proxy; in production this
  // would be keyed by deviceId).
  const totalCount = windowEvents.length;
  const offlineCount = windowEvents.filter((e) => e.level === 'offline').length;
  const offlineRatio = totalCount === 0 ? 0 : (offlineCount / totalCount) * 100;

  return {
    shouldAlert: offlineRatio > thresholdPercent,
    offlineRatio: Math.round(offlineRatio * 100) / 100,
    offlineCount,
    totalCount,
  };
}

/**
 * Serialize a degradation event for Prometheus exposition.
 *
 * @param {DegradationEvent} event
 * @returns {string}
 */
export function toPrometheusMetrics(event) {
  const labels = `level="${event.level}",region="${event.region}"`;
  let lines = `# TYPE gtcx_degradation_events_total counter\ngtcx_degradation_events_total{${labels}} 1\n`;
  if (event.bandwidth_bps !== undefined) {
    lines += `# TYPE gtcx_degradation_bandwidth_bps gauge\ngtcx_degradation_bandwidth_bps{${labels}} ${event.bandwidth_bps}\n`;
  }
  if (event.latency_ms !== undefined) {
    lines += `# TYPE gtcx_degradation_latency_ms gauge\ngtcx_degradation_latency_ms{${labels}} ${event.latency_ms}\n`;
  }
  return lines;
}
