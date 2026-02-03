# AMANI - Conversational Analytics & Metrics

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Platform**: Grafana + Prometheus + ElasticSearch  


## 1. Conversation Metrics

### Core KPIs
```yaml
Engagement_Metrics:
  daily_active_users:
    target: 100000
    current: 87432
    growth: +12% MoM
    
  conversation_completion_rate:
    target: 85%
    current: 82%
    trend: improving
    
  average_session_duration:
    target: 8_minutes
    current: 7.3_minutes
    
  user_satisfaction_score:
    target: 4.5/5
    current: 4.3/5
```

### Language Distribution
```sql
-- Active users by language
SELECT 
  language,
  COUNT(DISTINCT user_id) as users,
  COUNT(*) as conversations,
  AVG(satisfaction_score) as avg_satisfaction,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY session_duration) as median_duration
FROM conversations
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY language
ORDER BY users DESC;
```

## 2. Channel Performance

### Multi-Channel Analytics
```python
def analyze_channel_performance():
    """Compare performance across channels"""
    
    channels = ['whatsapp', 'sms', 'ussd', 'web', 'voice']
    metrics = {}
    
    for channel in channels:
        metrics[channel] = {
            'users': count_unique_users(channel),
            'conversations': count_conversations(channel),
            'completion_rate': calculate_completion_rate(channel),
            'avg_messages': avg_message_count(channel),
            'response_time': avg_response_time(channel),
            'satisfaction': avg_satisfaction(channel),
            'cost_per_conversation': calculate_cost(channel)
        }
    
    return metrics
```

### Channel Dashboard
```json
{
  "dashboard": {
    "title": "AMANI Channel Performance",
    "panels": [
      {
        "title": "Channel Distribution",
        "type": "pie",
        "query": "sum by (channel) (amani_conversations_total)"
      },
      {
        "title": "Response Time by Channel",
        "type": "bar",
        "query": "avg by (channel) (amani_response_time_seconds)"
      },
      {
        "title": "Channel Availability",
        "type": "stat",
        "targets": [
          "up{job='whatsapp_handler'}",
          "up{job='sms_handler'}",
          "up{job='ussd_handler'}",
          "up{job='voice_handler'}"
        ]
      }
    ]
  }
}
```

## 3. Natural Language Understanding Metrics

### Intent Recognition Performance
```yaml
NLU_Metrics:
  intent_accuracy:
    overall: 94.5%
    by_language:
      english: 97.2%
      swahili: 95.1%
      arabic: 93.8%
      french: 94.9%
      
  entity_extraction:
    precision: 92.3%
    recall: 89.7%
    f1_score: 91.0%
    
  language_detection:
    accuracy: 99.1%
    confusion_pairs:
      - [swahili, english]  # Most confused
      - [french, english]
```

### Model Performance Tracking
```python
class NLUMetrics:
    def track_model_performance(self, predictions, ground_truth):
        """Track NLU model performance"""
        
        return {
            'intent_metrics': {
                'accuracy': accuracy_score(ground_truth.intents, predictions.intents),
                'precision': precision_score(ground_truth.intents, predictions.intents, average='weighted'),
                'recall': recall_score(ground_truth.intents, predictions.intents, average='weighted'),
                'confusion_matrix': confusion_matrix(ground_truth.intents, predictions.intents)
            },
            'entity_metrics': {
                'exact_match': self.entity_exact_match(ground_truth.entities, predictions.entities),
                'partial_match': self.entity_partial_match(ground_truth.entities, predictions.entities),
                'type_accuracy': self.entity_type_accuracy(ground_truth.entities, predictions.entities)
            },
            'confidence_calibration': {
                'ece': expected_calibration_error(predictions.confidence, ground_truth.correct),
                'brier_score': brier_score_loss(ground_truth.correct, predictions.confidence)
            }
        }
```

## 4. User Journey Analytics

### Journey Completion Funnel
```sql
-- User journey funnel analysis
WITH journey_stages AS (
  SELECT 
    user_id,
    journey_type,
    MAX(CASE WHEN stage = 'started' THEN 1 ELSE 0 END) as started,
    MAX(CASE WHEN stage = 'information_gathered' THEN 1 ELSE 0 END) as info_gathered,
    MAX(CASE WHEN stage = 'documents_uploaded' THEN 1 ELSE 0 END) as docs_uploaded,
    MAX(CASE WHEN stage = 'verification_complete' THEN 1 ELSE 0 END) as verified,
    MAX(CASE WHEN stage = 'completed' THEN 1 ELSE 0 END) as completed
  FROM user_journeys
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY user_id, journey_type
)
SELECT 
  journey_type,
  COUNT(*) as total_users,
  SUM(started) as started_count,
  SUM(info_gathered) as info_gathered_count,
  SUM(docs_uploaded) as docs_uploaded_count,
  SUM(verified) as verified_count,
  SUM(completed) as completed_count,
  ROUND(100.0 * SUM(completed) / COUNT(*), 2) as completion_rate
FROM journey_stages
GROUP BY journey_type;
```

### Drop-off Analysis
```python
def analyze_dropoff_points(journey_id):
    """Identify where users drop off in journeys"""
    
    stages = get_journey_stages(journey_id)
    dropoffs = []
    
    for i in range(len(stages) - 1):
        current_stage = stages[i]
        next_stage = stages[i + 1]
        
        current_users = count_users_at_stage(current_stage)
        next_users = count_users_at_stage(next_stage)
        
        dropoff_rate = (current_users - next_users) / current_users
        
        if dropoff_rate > 0.2:  # More than 20% drop-off
            dropoffs.append({
                'from_stage': current_stage,
                'to_stage': next_stage,
                'dropoff_rate': dropoff_rate,
                'users_lost': current_users - next_users,
                'common_reasons': analyze_dropoff_reasons(current_stage)
            })
    
    return dropoffs
```

## 5. Response Quality Metrics

### Response Appropriateness
```yaml
Response_Quality:
  relevance_score:
    target: >95%
    current: 93.8%
    
  completeness_score:
    target: >90%
    current: 91.2%
    
  accuracy_score:
    target: >98%
    current: 97.5%
    
  helpfulness_rating:
    user_rated: 4.2/5
    expert_rated: 4.4/5
```

### Conversation Quality Dashboard
```prometheus
# Average conversation quality score
avg(amani_conversation_quality_score)

# Response generation time
histogram_quantile(0.95, 
  rate(amani_response_generation_seconds_bucket[5m])
)

# Fallback rate (when AI can't answer)
rate(amani_fallback_triggered_total[1h]) / 
rate(amani_messages_total[1h])

# Human escalation rate
rate(amani_human_escalation_total[1h]) / 
rate(amani_conversations_total[1h])
```

## 6. Language Coverage Metrics

### Translation Quality
```python
def measure_translation_quality():
    """Measure translation quality across language pairs"""
    
    language_pairs = [
        ('en', 'sw'), ('en', 'ar'), ('en', 'fr'),
        ('sw', 'en'), ('ar', 'en'), ('fr', 'en')
    ]
    
    quality_metrics = {}
    
    for source, target in language_pairs:
        quality_metrics[f"{source}->{target}"] = {
            'bleu_score': calculate_bleu(source, target),
            'meteor_score': calculate_meteor(source, target),
            'human_eval': get_human_evaluation(source, target),
            'semantic_similarity': calculate_semantic_similarity(source, target)
        }
    
    return quality_metrics
```

### Language Parity Dashboard
```yaml
Language_Parity:
  feature_availability:
    english: 100%
    swahili: 98%
    arabic: 95%
    french: 96%
    portuguese: 94%
    others: 85-92%
    
  response_quality_by_language:
    english: 4.5/5
    swahili: 4.3/5
    arabic: 4.2/5
    french: 4.3/5
    
  processing_time_by_language:
    english: 1.2s
    swahili: 1.4s
    arabic: 1.6s
    french: 1.3s
```

## 7. Cost & Efficiency Metrics

### Cost per Conversation
```python
def calculate_conversation_costs():
    """Calculate cost breakdown per conversation"""
    
    costs = {
        'whatsapp': {
            'api_cost': 0.005,  # per message
            'compute': 0.002,
            'storage': 0.001,
            'total_per_conversation': 0.08
        },
        'sms': {
            'carrier_cost': 0.02,  # per message
            'compute': 0.002,
            'total_per_conversation': 0.15
        },
        'ussd': {
            'session_cost': 0.01,
            'compute': 0.001,
            'total_per_conversation': 0.05
        },
        'web': {
            'hosting': 0.001,
            'compute': 0.002,
            'total_per_conversation': 0.02
        }
    }
    
    return costs
```

### Efficiency Dashboard
```yaml
Efficiency_Metrics:
  cost_per_user:
    monthly_average: $0.45
    by_channel:
      whatsapp: $0.32
      sms: $0.89
      ussd: $0.28
      web: $0.15
      
  automation_rate:
    fully_automated: 78%
    partial_human: 18%
    full_human: 4%
    
  resource_utilization:
    cpu_usage: 45%
    memory_usage: 62%
    api_quota_usage: 34%
```

## 8. User Satisfaction Metrics

### CSAT Tracking
```sql
-- Customer satisfaction by various dimensions
SELECT 
  DATE_TRUNC('day', created_at) as date,
  AVG(satisfaction_score) as avg_csat,
  COUNT(CASE WHEN satisfaction_score >= 4 THEN 1 END)::FLOAT / 
    COUNT(*) as satisfaction_rate,
  COUNT(*) as total_responses
FROM satisfaction_surveys
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;

-- Satisfaction drivers analysis
SELECT 
  CASE 
    WHEN resolution_time < 300 THEN 'fast'
    WHEN resolution_time < 600 THEN 'medium'
    ELSE 'slow'
  END as speed_category,
  AVG(satisfaction_score) as avg_satisfaction,
  COUNT(*) as count
FROM conversations c
JOIN satisfaction_surveys s ON c.id = s.conversation_id
GROUP BY speed_category;
```

### NPS Calculation
```python
def calculate_nps(period='30d'):
    """Calculate Net Promoter Score"""
    
    scores = get_nps_scores(period)
    
    promoters = len([s for s in scores if s >= 9]) / len(scores)
    detractors = len([s for s in scores if s <= 6]) / len(scores)
    
    nps = (promoters - detractors) * 100
    
    return {
        'nps': nps,
        'promoters': promoters * 100,
        'passives': (1 - promoters - detractors) * 100,
        'detractors': detractors * 100,
        'response_count': len(scores)
    }
```

## 9. Operational Metrics

### System Health Dashboard
```yaml
System_Health:
  uptime:
    target: 99.95%
    current: 99.97%
    
  latency:
    p50: 120ms
    p95: 450ms
    p99: 980ms
    
  error_rates:
    api_errors: 0.02%
    timeout_errors: 0.01%
    validation_errors: 0.15%
    
  queue_depth:
    message_queue: 234
    processing_queue: 45
    escalation_queue: 12
```

### Alert Configuration
```prometheus
groups:
  - name: amani_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(amani_errors_total[5m]) > 0.01
        for: 5m
        labels:
          severity: warning
        
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, amani_response_time_seconds) > 2
        for: 10m
        labels:
          severity: warning
          
      - alert: LowCompletionRate
        expr: amani_completion_rate < 0.7
        for: 15m
        labels:
          severity: critical
```

## 10. Growth Metrics

### User Acquisition & Retention
```python
def calculate_growth_metrics():
    """Calculate user growth and retention metrics"""
    
    return {
        'new_users': {
            'daily': count_new_users('1d'),
            'weekly': count_new_users('7d'),
            'monthly': count_new_users('30d'),
            'growth_rate': calculate_growth_rate()
        },
        'retention': {
            'day_1': calculate_retention(1),
            'day_7': calculate_retention(7),
            'day_30': calculate_retention(30),
            'day_90': calculate_retention(90)
        },
        'engagement': {
            'dau': count_daily_active_users(),
            'wau': count_weekly_active_users(),
            'mau': count_monthly_active_users(),
            'stickiness': calculate_dau_mau_ratio()
        }
    }
```

## 11. Geographic Analytics

### Usage by Region
```sql
-- Geographic distribution of users
SELECT 
  country,
  region,
  COUNT(DISTINCT user_id) as users,
  COUNT(*) as conversations,
  AVG(session_duration) as avg_duration,
  MODE() WITHIN GROUP (ORDER BY language) as primary_language
FROM conversations c
JOIN users u ON c.user_id = u.id
WHERE c.created_at > NOW() - INTERVAL '30 days'
GROUP BY country, region
ORDER BY users DESC;
```

### Regional Dashboard
```yaml
Regional_Metrics:
  east_africa:
    countries: [Kenya, Tanzania, Uganda, Rwanda]
    users: 234567
    growth: +18% MoM
    
  west_africa:
    countries: [Nigeria, Ghana, Senegal]
    users: 345678
    growth: +22% MoM
    
  southern_africa:
    countries: [South Africa, Zimbabwe, Botswana]
    users: 123456
    growth: +15% MoM
```

## 12. Executive Dashboard

### High-Level KPIs
```json
{
  "executive_dashboard": {
    "panels": [
      {
        "title": "Total Users Served",
        "value": "2.3M",
        "change": "+15%",
        "sparkline": true
      },
      {
        "title": "Conversations Today",
        "value": "87.4K",
        "target": "100K",
        "progress": 87.4
      },
      {
        "title": "Languages Active",
        "value": "47/50",
        "subtitle": "3 in development"
      },
      {
        "title": "User Satisfaction",
        "value": "4.3/5",
        "trend": "stable",
        "responses": "12.3K"
      },
      {
        "title": "Cost per User",
        "value": "$0.45",
        "target": "<$0.50",
        "status": "on_track"
      }
    ]
  }
}
```


**Document Status**: Analytics configuration  
**Platform**: Grafana + Prometheus + ElasticSearch  
**Review Cycle**: Weekly  
**Owner**: Analytics Team
