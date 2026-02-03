# KORA - Trust Metrics & Dashboard Configuration

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Platform**: Grafana + Prometheus + Neo4j  


## 1. Core Trust Metrics

### Trust Score Calculation
```python
def calculate_trust_score(verification):
    """Calculate composite trust score"""
    
    weights = {
        'government_registry': 0.35,
        'community_validation': 0.25,
        'satellite_verification': 0.20,
        'field_verification': 0.15,
        'historical_accuracy': 0.05
    }
    
    score = sum(
        source.confidence * weights.get(source.type, 0)
        for source in verification.sources
    )
    
    # Apply penalties
    if verification.has_disputes:
        score *= 0.85
    if verification.age_days > 365:
        score *= 0.95
    
    return min(score, 1.0)
```

### Key Performance Indicators
```yaml
Trust_KPIs:
  verification_accuracy:
    target: 99.5%
    current: 99.2%
    trend: improving
    
  false_positive_rate:
    target: <0.1%
    current: 0.08%
    trend: stable
    
  dispute_resolution_time:
    target: <72_hours
    current: 48_hours
    trend: improving
    
  cross_border_success:
    target: 95%
    current: 92%
    trend: improving
```

## 2. Verification Metrics

### Real-time Metrics
```prometheus
# Verification rate
rate(kora_verifications_total[5m])

# Verification latency (p95)
histogram_quantile(0.95, 
  rate(kora_verification_duration_seconds_bucket[5m])
)

# Source availability
up{job="government_registry"} == 1
up{job="satellite_api"} == 1
up{job="community_validators"} == 1

# Consensus achievement rate
rate(kora_consensus_reached_total[1h]) / 
rate(kora_verification_attempts_total[1h])
```

### Verification Dashboard
```json
{
  "dashboard": {
    "title": "KORA Verification Overview",
    "panels": [
      {
        "title": "Live Verifications",
        "type": "stat",
        "query": "kora_active_verifications"
      },
      {
        "title": "Trust Distribution",
        "type": "histogram",
        "query": "kora_trust_scores_bucket"
      },
      {
        "title": "Source Reliability",
        "type": "gauge",
        "targets": [
          "avg(kora_source_accuracy{source='government'})",
          "avg(kora_source_accuracy{source='community'})",
          "avg(kora_source_accuracy{source='satellite'})"
        ]
      },
      {
        "title": "Verification Flow",
        "type": "graph",
        "query": "rate(kora_verifications_by_status[5m])"
      }
    ]
  }
}
```

## 3. Fraud Detection Metrics

### Fraud Indicators
```yaml
Fraud_Metrics:
  detection_rate:
    formula: frauds_detected / total_verifications
    target: capture_95_percent_of_fraud
    
  false_accusations:
    formula: false_positives / fraud_flags
    target: less_than_5_percent
    
  pattern_recognition:
    new_patterns_identified: 12_this_month
    patterns_prevented: 847_attempts
    
  suspicious_activity:
    velocity_violations: 23
    duplicate_attempts: 45
    unusual_patterns: 67
```

### ML Model Performance
```python
class FraudMetrics:
    def calculate_model_metrics(self, predictions, actuals):
        return {
            'precision': precision_score(actuals, predictions),
            'recall': recall_score(actuals, predictions),
            'f1': f1_score(actuals, predictions),
            'auc_roc': roc_auc_score(actuals, predictions),
            'confusion_matrix': confusion_matrix(actuals, predictions)
        }
    
    def monitor_drift(self, current_distribution, baseline):
        """Detect model drift"""
        kl_divergence = calculate_kl_divergence(
            current_distribution, 
            baseline
        )
        return {
            'drift_detected': kl_divergence > 0.1,
            'drift_score': kl_divergence,
            'action_required': kl_divergence > 0.2
        }
```

## 4. Dispute Resolution Metrics

### Dispute Analytics
```sql
-- Dispute resolution funnel
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolution_time) as median_time
FROM disputes
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'filed' THEN 1
    WHEN 'investigating' THEN 2
    WHEN 'evidence_collection' THEN 3
    WHEN 'arbitration' THEN 4
    WHEN 'resolved' THEN 5
  END;
```

### Resolution Dashboard
```yaml
Dispute_Dashboard:
  widgets:
    - Active_Disputes:
        type: counter
        value: SELECT COUNT(*) FROM disputes WHERE status != 'resolved'
    
    - Resolution_Rate:
        type: percentage
        value: resolved_last_30d / total_filed_last_30d
    
    - Average_Time:
        type: duration
        value: AVG(resolution_time) WHERE resolved_at > NOW() - '30d'
    
    - By_Type:
        type: pie_chart
        categories: [ownership, boundary, fraud, documentation]
```

## 5. Federation Network Metrics

### Partner Trust Scores
```python
def calculate_partner_trust(partner_id):
    """Calculate trust score for federation partner"""
    
    metrics = {
        'verification_accuracy': get_accuracy(partner_id),
        'response_time': get_avg_response_time(partner_id),
        'dispute_rate': get_dispute_rate(partner_id),
        'uptime': get_uptime(partner_id),
        'data_quality': assess_data_quality(partner_id)
    }
    
    # Weighted scoring
    trust_score = (
        metrics['verification_accuracy'] * 0.4 +
        (1 - metrics['response_time']/10) * 0.2 +  # Normalize to 0-1
        (1 - metrics['dispute_rate']) * 0.2 +
        metrics['uptime'] * 0.1 +
        metrics['data_quality'] * 0.1
    )
    
    return {
        'partner_id': partner_id,
        'trust_score': trust_score,
        'metrics': metrics,
        'rating': get_rating(trust_score)
    }
```

### Federation Dashboard
```yaml
Federation_Metrics:
  network_health:
    active_partners: 15
    average_trust: 0.87
    total_verifications: 1_234_567
    
  cross_border_flow:
    kenya_to_tanzania: 234
    nigeria_to_ghana: 156
    south_africa_to_botswana: 89
    
  performance:
    avg_latency: 2.3s
    success_rate: 94%
    data_quality: 96%
```

## 6. Graph Analytics (Neo4j)

### Relationship Metrics
```cypher
// Trust network density
MATCH (n:Verifier)-[r:TRUSTS]->(m:Verifier)
RETURN COUNT(r) as trust_relationships,
       AVG(r.weight) as avg_trust_weight

// Verification chains
MATCH path = (p:Parcel)-[:VERIFIED_BY*1..3]->(v:Verifier)
RETURN p.id, LENGTH(path) as chain_length, 
       REDUCE(s = 1.0, r in relationships(path) | s * r.confidence) as chain_confidence

// Fraud detection patterns
MATCH (u:User)-[r:REQUESTED_VERIFICATION]->(p:Parcel)
WHERE r.timestamp > datetime() - duration('P7D')
WITH u, COUNT(DISTINCT p) as parcels_count
WHERE parcels_count > 10
RETURN u.id as suspicious_user, parcels_count
```

## 7. Performance Monitoring

### System Metrics
```yaml
Infrastructure:
  cpu_usage:
    target: <70%
    alert: >85%
    current: 45%
    
  memory_usage:
    target: <80%
    alert: >90%
    current: 62%
    
  disk_io:
    read: 150MB/s
    write: 100MB/s
    
  network:
    ingress: 1Gbps
    egress: 500Mbps
    
Database:
  postgres:
    connections: 45/100
    query_time_p95: 12ms
    deadlocks: 0
    
  neo4j:
    nodes: 12_456_789
    relationships: 45_678_901
    query_time_p95: 8ms
```

## 8. Business Intelligence

### Revenue Metrics
```sql
-- Revenue by verification type
SELECT 
  verification_type,
  COUNT(*) as count,
  SUM(fee_amount) as revenue,
  AVG(fee_amount) as avg_fee
FROM verifications
WHERE created_at >= DATE_TRUNC('month', NOW())
GROUP BY verification_type
ORDER BY revenue DESC;

-- Customer lifetime value
WITH customer_revenue AS (
  SELECT 
    customer_id,
    SUM(fee_amount) as total_revenue,
    COUNT(*) as verification_count,
    MIN(created_at) as first_verification,
    MAX(created_at) as last_verification
  FROM verifications
  GROUP BY customer_id
)
SELECT 
  AVG(total_revenue) as avg_ltv,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_revenue) as median_ltv,
  AVG(verification_count) as avg_verifications,
  AVG(last_verification - first_verification) as avg_customer_lifetime
FROM customer_revenue;
```

## 9. Alert Configuration

### Critical Alerts
```yaml
alerts:
  - name: Verification_Service_Down
    expr: up{job="verification_engine"} == 0
    for: 1m
    severity: critical
    action: page_oncall
    
  - name: High_Fraud_Rate
    expr: rate(fraud_detections[5m]) > 0.01
    for: 5m
    severity: warning
    action: notify_security
    
  - name: Partner_Unavailable
    expr: federation_partner_up == 0
    for: 10m
    severity: warning
    action: notify_operations
    
  - name: Database_Connection_Pool_Exhausted
    expr: pg_connections_active / pg_connections_max > 0.9
    for: 5m
    severity: critical
    action: scale_connections
```

## 10. Compliance Reporting

### Regulatory Reports
```python
def generate_compliance_report(period):
    """Generate regulatory compliance report"""
    
    return {
        'period': period,
        'total_verifications': count_verifications(period),
        'verification_accuracy': calculate_accuracy(period),
        'dispute_statistics': {
            'total': count_disputes(period),
            'resolved': count_resolved(period),
            'avg_resolution_time': avg_resolution_time(period)
        },
        'data_protection': {
            'access_requests': count_access_requests(period),
            'deletion_requests': count_deletion_requests(period),
            'breaches': count_breaches(period)
        },
        'audit_trail': {
            'completeness': verify_audit_completeness(period),
            'integrity': verify_audit_integrity(period)
        }
    }
```

## 11. Custom Dashboards

### Executive Dashboard
```json
{
  "panels": [
    {
      "title": "Trust Network Health",
      "metric": "overall_trust_score",
      "visualization": "gauge",
      "thresholds": {
        "good": ">0.9",
        "warning": "0.7-0.9",
        "critical": "<0.7"
      }
    },
    {
      "title": "Monthly Verifications",
      "metric": "verification_count",
      "visualization": "bar_chart",
      "groupBy": "country"
    },
    {
      "title": "Revenue Trend",
      "metric": "monthly_revenue",
      "visualization": "line_chart",
      "comparison": "previous_year"
    },
    {
      "title": "Partner Network",
      "metric": "federation_map",
      "visualization": "geo_map",
      "showConnections": true
    }
  ]
}
```

## 12. Data Export

### Metric Export Configuration
```yaml
Export_Config:
  formats:
    - JSON
    - CSV
    - Parquet
    - PostgreSQL
    
  schedule:
    daily: [operational_metrics]
    weekly: [performance_summary]
    monthly: [compliance_report, executive_summary]
    
  destinations:
    s3_bucket: s3://kora-metrics/exports/
    bigquery: kora_analytics.metrics
    email: analytics@kora.global
```


**Document Status**: Metrics configuration  
**Platform**: Grafana 9.5 + Prometheus + Neo4j  
**Review Cycle**: Weekly  
**Owner**: Data Analytics Team
