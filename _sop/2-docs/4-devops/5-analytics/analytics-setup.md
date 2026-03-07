# Analytics Setup

> KPI definitions, instrumentation standards, and dashboard specifications for [Organization Name].

---

## 1. KPI Framework

### North Star Metric

> **[North Star Metric]** — [One-sentence definition of the metric that best captures the value delivered to users]

_Example: "Weekly Active Subscribers who consumed at least [N] intelligence items" — measures both retention and value delivery._

### Tier 1 — Business Health Metrics

Reviewed weekly by leadership.

| Metric                          | Definition                                                   | Target   | Owner    |
| ------------------------------- | ------------------------------------------------------------ | -------- | -------- |
| Monthly Active Users (MAU)      | Unique users who performed [core action] in the last 30 days | [Target] | Product  |
| Monthly Recurring Revenue (MRR) | Total recurring subscription revenue                         | [Target] | Business |
| Subscriber Retention (30-day)   | % of subscribers still active after 30 days                  | >[N]%    | Product  |
| Net Revenue Retention (NRR)     | Revenue from existing subscribers including expansions       | >[N]%    | Business |

### Tier 2 — Product Health Metrics

Reviewed weekly by product and engineering.

| Metric                   | Definition                                           | Target       |
| ------------------------ | ---------------------------------------------------- | ------------ |
| Daily Active Users (DAU) | Unique users performing [core action] per day        | [Target]     |
| Feature Adoption Rate    | % of users using [key feature] in first [N] days     | >[N]%        |
| Time to Value (TTV)      | Median time from signup to first [core value action] | <[N] minutes |
| Content Consumption Rate | Avg. [items] consumed per active user per week       | [Target]     |
| Alert Open Rate          | % of distributed alerts opened within [N] hours      | >[N]%        |

### Tier 3 — Engineering Health Metrics

Reviewed weekly by engineering.

| Metric               | Definition                                    | Target    |
| -------------------- | --------------------------------------------- | --------- |
| API Availability     | % of time API health checks return 200        | >[N]%     |
| p95 API Latency      | 95th percentile response time (ms)            | <[N]ms    |
| Error Rate           | % of requests returning 5xx errors            | <[N]%     |
| Deployment Frequency | Deployments to production per week            | >[N]/week |
| MTTR                 | Mean time to recover from incidents (minutes) | <[N] min  |

---

## 2. Instrumentation Standards

### Event Naming Convention

```
[noun]_[verb]                    # user-triggered events
[noun]_[verb]_[modifier]         # with context

Examples:
  alert_viewed
  subscription_started
  content_published
  search_performed
  onboarding_completed
```

### Required Properties on Every Event

| Property      | Type     | Description                             |
| ------------- | -------- | --------------------------------------- |
| `user_id`     | string   | Authenticated user ID (or anonymous ID) |
| `session_id`  | string   | Current session identifier              |
| `timestamp`   | ISO 8601 | UTC timestamp of event                  |
| `platform`    | enum     | `web` / `mobile` / `api` / `email`      |
| `environment` | enum     | `production` / `staging`                |

### Core Events to Instrument

| Event                    | Trigger                   | Key Properties                         |
| ------------------------ | ------------------------- | -------------------------------------- |
| `user_signed_up`         | Account creation          | `plan`, `source`, `referral`           |
| `user_logged_in`         | Successful authentication | `method`, `platform`                   |
| `content_viewed`         | Content item opened       | `content_id`, `content_type`, `source` |
| `alert_received`         | Alert delivered to user   | `channel`, `alert_id`                  |
| `alert_viewed`           | Alert opened              | `channel`, `time_to_open_seconds`      |
| `search_performed`       | Search submitted          | `query`, `results_count`               |
| `subscription_started`   | Paid plan activated       | `plan_id`, `price`, `trial`            |
| `subscription_cancelled` | Cancellation initiated    | `plan_id`, `reason`, `tenure_days`     |
| `feature_used`           | Key feature interaction   | `feature_name`, `outcome`              |

---

## 3. Dashboard Specifications

### Executive Dashboard

**Updated**: Daily
**Audience**: CEO, COO, investors

| Widget             | Metric                    | Visualization       |
| ------------------ | ------------------------- | ------------------- |
| MRR                | Monthly recurring revenue | Line chart (30-day) |
| MAU                | Monthly active users      | Line chart (30-day) |
| Subscriber count   | Total paying subscribers  | Gauge + trend       |
| Churn rate         | % cancelled this month    | Gauge + benchmark   |
| Revenue vs. target | MRR vs. monthly target    | Progress bar        |

### Product Health Dashboard

**Updated**: Hourly
**Audience**: Product, engineering leads

| Widget            | Metric                       | Visualization      |
| ----------------- | ---------------------------- | ------------------ |
| DAU/MAU ratio     | Stickiness                   | Line chart (7-day) |
| Feature adoption  | % users per feature          | Bar chart          |
| Top content       | Most-viewed items            | Table              |
| User funnel       | Signup → active → subscriber | Funnel chart       |
| Alert performance | Open rates by channel        | Bar chart          |

### Engineering Health Dashboard

**Updated**: Real-time
**Audience**: Engineering team, on-call

| Widget             | Metric                     | Visualization           |
| ------------------ | -------------------------- | ----------------------- |
| API availability   | Uptime % (24h rolling)     | Gauge                   |
| p95 latency        | By endpoint                | Line chart              |
| Error rate         | 5xx % (1h rolling)         | Gauge + alert threshold |
| Deployment tracker | Recent deploys + rollbacks | Timeline                |
| Active incidents   | Open P0/P1 incidents       | Table                   |

---

## 4. Reporting Cadences

| Report                  | Frequency         | Audience                 | Owner                 |
| ----------------------- | ----------------- | ------------------------ | --------------------- |
| Weekly metrics digest   | Weekly (Monday)   | Leadership               | Product               |
| Monthly business review | Monthly           | Board / leadership       | CEO + COO             |
| Quarterly OKR review    | Quarterly         | All teams                | Product + Engineering |
| Incident review         | After every P0/P1 | Engineering + leadership | Engineering lead      |

---

## 5. Privacy and Compliance

- No PII in analytics event payloads (use opaque user IDs)
- Respect user opt-out of analytics tracking (GDPR Article 21)
- Analytics data retained for [N] months; then aggregated and source deleted
- Consent obtained for analytics tracking where required by jurisdiction

---

_Measure what matters. Every metric on a dashboard should inform a decision — if it doesn't, remove it._
