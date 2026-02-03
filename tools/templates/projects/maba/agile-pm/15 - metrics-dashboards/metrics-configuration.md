# MABA - Metrics & Dashboard Configuration

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Platform**: Grafana + Prometheus  


## 1. Key Performance Indicators (KPIs)

### Business Metrics
```yaml
Revenue_Metrics:
  - Monthly Recurring Revenue (MRR)
  - Annual Recurring Revenue (ARR)
  - Customer Acquisition Cost (CAC)
  - Customer Lifetime Value (CLV)
  - Revenue per transformation

Operational_Metrics:
  - Records processed per day
  - Average transformation time
  - Success rate (%)
  - Error rate (%)
  - Customer satisfaction (NPS)

Growth_Metrics:
  - New customers per month
  - Customer retention rate
  - Feature adoption rate
  - Market penetration by country
```

## 2. Technical Metrics

### System Performance
```yaml
Performance_Metrics:
  throughput:
    metric: records_per_second
    target: ">10000"
    alert_threshold: "<5000"
  
  latency:
    metric: p95_response_time
    target: "<100ms"
    alert_threshold: ">500ms"
  
  availability:
    metric: uptime_percentage
    target: "99.9%"
    alert_threshold: "<99.5%"
  
  error_rate:
    metric: failed_requests_percentage
    target: "<0.1%"
    alert_threshold: ">1%"
```

### Resource Utilization
```prometheus
# CPU Usage
rate(process_cpu_seconds_total[5m]) * 100

# Memory Usage
process_resident_memory_bytes / node_memory_MemTotal_bytes * 100

# Disk I/O
rate(node_disk_io_time_seconds_total[5m])

# Network Traffic
rate(node_network_receive_bytes_total[5m])
```

## 3. Dashboard Configurations

### Executive Dashboard
```json
{
  "dashboard": {
    "title": "MABA Executive Overview",
    "panels": [
      {
        "title": "Total Records Processed",
        "type": "stat",
        "query": "sum(maba_records_processed_total)"
      },
      {
        "title": "Active Transformations",
        "type": "gauge",
        "query": "maba_active_jobs"
      },
      {
        "title": "Success Rate",
        "type": "graph",
        "query": "rate(maba_successful_transformations[24h])"
      },
      {
        "title": "Revenue This Month",
        "type": "stat",
        "query": "sum(maba_revenue_usd)"
      }
    ],
    "refresh": "10s"
  }
}
```

### Operations Dashboard
```yaml
panels:
  - Job Queue Status:
      type: graph
      metrics:
        - pending_jobs
        - processing_jobs
        - completed_jobs
        - failed_jobs
  
  - Processing Speed:
      type: timeseries
      metric: records_per_minute
      period: 24h
  
  - Error Distribution:
      type: piechart
      breakdown:
        - schema_errors
        - connection_errors
        - validation_errors
        - timeout_errors
  
  - Resource Usage:
      type: heatmap
      resources:
        - cpu_usage
        - memory_usage
        - disk_usage
        - network_usage
```

### Customer Success Dashboard
```yaml
Customer_Metrics:
  - Active Customers:
      query: count(distinct customer_id)
      period: current_month
  
  - Usage by Customer:
      type: table
      columns:
        - customer_name
        - records_processed
        - last_activity
        - health_score
  
  - Feature Adoption:
      type: funnel
      stages:
        - registered
        - first_transformation
        - api_integrated
        - daily_active
  
  - Support Tickets:
      type: stacked_bar
      categories:
        - critical
        - high
        - medium
        - low
```

## 4. Alert Configurations

### Critical Alerts (P0)
```yaml
alerts:
  - name: Service Down
    condition: up == 0
    duration: 1m
    channels: [pagerduty, slack-critical]
  
  - name: Data Loss Risk
    condition: error_rate > 5%
    duration: 5m
    channels: [pagerduty, email-oncall]
  
  - name: Security Breach
    condition: unauthorized_access > 0
    duration: 0s
    channels: [security-team, management]
```

### Warning Alerts (P1)
```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 1%
    duration: 10m
    channels: [slack-ops, email-team]
  
  - name: Slow Processing
    condition: avg_processing_time > 5s
    duration: 15m
    channels: [slack-ops]
  
  - name: Queue Backup
    condition: queue_depth > 10000
    duration: 30m
    channels: [ops-team]
```

## 5. Real-time Monitoring

### Live Processing Monitor
```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('ws://metrics.maba.local/live');

ws.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  updateDashboard({
    currentThroughput: metrics.records_per_sec,
    activeJobs: metrics.active_jobs,
    queueDepth: metrics.queue_depth,
    errorRate: metrics.error_rate
  });
};
```

### Performance Tracking
```sql
-- Query for transformation performance
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_jobs,
  AVG(processing_time) as avg_time,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time) as p95_time,
  SUM(records_processed) as total_records
FROM transformation_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

## 6. Custom Metrics

### Business Intelligence Queries
```sql
-- Customer Health Score
WITH customer_metrics AS (
  SELECT 
    customer_id,
    COUNT(*) as total_transformations,
    AVG(success_rate) as avg_success,
    MAX(last_activity) as last_seen,
    SUM(records_processed) as total_records
  FROM customer_activity
  WHERE period = 'last_30_days'
  GROUP BY customer_id
)
SELECT 
  customer_id,
  CASE
    WHEN avg_success > 0.95 AND last_seen > NOW() - INTERVAL '7 days' THEN 'Healthy'
    WHEN avg_success > 0.85 AND last_seen > NOW() - INTERVAL '14 days' THEN 'At Risk'
    ELSE 'Critical'
  END as health_status
FROM customer_metrics;
```

## 7. Data Retention & Aggregation

### Metrics Retention Policy
```yaml
retention:
  raw_metrics: 7_days
  5min_aggregates: 30_days
  hourly_aggregates: 90_days
  daily_aggregates: 2_years
  monthly_aggregates: indefinite

aggregation_rules:
  - metric: throughput
    method: average
    intervals: [5m, 1h, 1d]
  
  - metric: errors
    method: sum
    intervals: [5m, 1h, 1d]
  
  - metric: latency
    method: percentile
    percentiles: [50, 95, 99]
    intervals: [5m, 1h]
```

## 8. Reporting Automation

### Scheduled Reports
```yaml
daily_report:
  schedule: "0 9 * * *"  # 9 AM daily
  recipients: [ops-team@maba.com]
  contents:
    - yesterday_summary
    - error_analysis
    - performance_trends
    - top_customers

weekly_executive:
  schedule: "0 10 * * 1"  # Monday 10 AM
  recipients: [executives@maba.com]
  contents:
    - weekly_kpis
    - customer_growth
    - revenue_metrics
    - market_penetration

monthly_board:
  schedule: "0 0 1 * *"  # First of month
  recipients: [board@maba.com]
  format: pdf
  contents:
    - executive_summary
    - financial_metrics
    - growth_analysis
    - strategic_initiatives
```

## 9. API Metrics Endpoints

### Metrics API
```yaml
endpoints:
  GET /metrics/health:
    response:
      status: healthy|degraded|critical
      uptime: 99.95
      response_time: 45ms
  
  GET /metrics/throughput:
    params:
      - period: 1h|24h|7d|30d
    response:
      average: 10234
      peak: 45678
      current: 12345
  
  GET /metrics/customers/{id}:
    response:
      usage: {...}
      health_score: 85
      last_activity: timestamp
```

## 10. Visualization Best Practices

### Chart Selection Guide
```yaml
Time_Series: Use for trends over time
  - Processing speed
  - Error rates
  - Revenue growth

Gauges: Use for current status
  - System health
  - Queue depth
  - Active jobs

Heatmaps: Use for patterns
  - Usage by hour/day
  - Geographic distribution
  - Error patterns

Tables: Use for detailed data
  - Customer list
  - Job details
  - Error logs
```

## 11. Performance Optimization

### Query Optimization
```sql
-- Use materialized views for heavy queries
CREATE MATERIALIZED VIEW hourly_stats AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as job_count,
  SUM(records_processed) as total_records,
  AVG(processing_time) as avg_time
FROM transformation_jobs
GROUP BY hour;

-- Refresh every hour
REFRESH MATERIALIZED VIEW hourly_stats;
```

### Caching Strategy
```yaml
cache_layers:
  browser: 
    ttl: 10s
    for: real-time metrics
  
  cdn:
    ttl: 60s
    for: dashboard assets
  
  application:
    ttl: 300s
    for: aggregated metrics
  
  database:
    ttl: 3600s
    for: historical data
```

## 12. Troubleshooting Guide

### Common Issues
| Issue | Cause | Solution |
|-------|-------|----------|
| Missing metrics | Collector down | Restart Prometheus |
| Slow dashboards | Heavy queries | Add indexes, use caching |
| Alert fatigue | Too sensitive | Adjust thresholds |
| Data gaps | Network issues | Check connectivity |


**Document Status**: Metrics configuration  
**Platform**: Grafana 9.0 + Prometheus 2.40  
**Review Cycle**: Monthly  
**Owner**: DevOps Team
