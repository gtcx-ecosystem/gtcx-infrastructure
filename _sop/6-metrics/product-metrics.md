# [Product Name] — Product & Business Metrics

**Document ID**: [PRD]-METRICS-001
**Version**: 1.0
**Date**: [Month Year]
**Status**: Active

---

## North Star Metric

| Metric       | Definition                              | Target   | Current   |
| ------------ | --------------------------------------- | -------- | --------- |
| [North Star] | [What this measures and why it matters] | {target} | {current} |

---

## Acquisition

| Metric              | Definition                                          | Target     | Measurement                   |
| ------------------- | --------------------------------------------------- | ---------- | ----------------------------- |
| Signups / month     | New registered accounts                             | {n}        | Auth events                   |
| Activation rate     | Users completing [key first action] within 7 days   | {n}%       | [First action] event / signup |
| Time to activate    | Median time from signup to [key first action]       | < {n} days | Event timestamps              |
| Channel attribution | Signups by source (organic, paid, referral, direct) | —          | UTM tracking                  |

---

## Engagement

| Metric            | Definition                            | Target | Measurement         |
| ----------------- | ------------------------------------- | ------ | ------------------- |
| DAU               | Distinct active users in a day        | {n}    | Session events      |
| MAU               | Distinct active users in a month      | {n}    | Session events      |
| DAU / MAU ratio   | Stickiness index                      | {n}%   | DAU ÷ MAU           |
| Session frequency | Avg sessions per active user per week | {n}    | Session events      |
| Session depth     | Avg [key actions] per session         | {n}    | Action events       |
| Feature adoption  | % of active users using [key feature] | {n}%   | Feature event / MAU |

---

## Retention

| Metric            | Definition                             | Target | Measurement                        |
| ----------------- | -------------------------------------- | ------ | ---------------------------------- |
| Day 1 retention   | % of new users returning on day 1      | {n}%   | Cohort analysis                    |
| Day 7 retention   | % of new users returning on day 7      | {n}%   | Cohort analysis                    |
| Day 30 retention  | % of new users returning on day 30     | {n}%   | Cohort analysis                    |
| Monthly churn     | % of active users lost per month       | < {n}% | Lost users / start-of-month active |
| Resurrection rate | % of churned users returning in period | {n}%   | Reactivation events                |

---

## Revenue

| Metric         | Definition                            | Target       | Measurement                                      |
| -------------- | ------------------------------------- | ------------ | ------------------------------------------------ |
| MRR            | Monthly recurring revenue             | ${n}         | Billing system                                   |
| ARR            | Annualized recurring revenue          | ${n}         | MRR × 12                                         |
| MRR growth     | Month-over-month MRR change           | {n}%         | (MRR*t − MRR*{t-1}) / MRR\_{t-1}                 |
| ARPU           | Average revenue per active user       | ${n}         | MRR / MAU                                        |
| LTV            | Predicted lifetime value per customer | ${n}         | ARPU × avg customer lifespan                     |
| CAC            | Cost to acquire one paying customer   | ${n}         | Total sales + marketing spend / new paying users |
| LTV:CAC ratio  | Unit economics health                 | > {n}:1      | LTV ÷ CAC                                        |
| Payback period | Months to recover CAC                 | < {n} months | CAC ÷ monthly ARPU                               |

---

## Conversion

| Metric                  | Definition                                | Target | Measurement                            |
| ----------------------- | ----------------------------------------- | ------ | -------------------------------------- |
| Free → paid conversion  | % of free users converting to paid        | {n}%   | Subscription events / free users       |
| Trial conversion        | % of trial users converting to paid       | {n}%   | Paid events / trial starts             |
| Upgrade rate            | % of paid users upgrading tier            | {n}%   | Upgrade events / paid users            |
| Downgrade / cancel rate | % of paid users downgrading or cancelling | < {n}% | Downgrade + cancel events / paid users |

---

## Satisfaction

| Metric                  | Definition                   | Target      | Measurement             |
| ----------------------- | ---------------------------- | ----------- | ----------------------- |
| NPS                     | Net Promoter Score           | > {n}       | In-app survey           |
| CSAT                    | Customer satisfaction score  | > {n}/5     | Post-interaction survey |
| Support ticket volume   | Tickets per 100 active users | < {n}       | Support system          |
| Support resolution time | Median time to resolution    | < {n} hours | Support system          |

---

## Funnel

Map your key conversion funnel. Example:

```
[Entry point]
    → [Activation step 1]   {n}% drop-off
    → [Activation step 2]   {n}% drop-off
    → [First value moment]  {n}% drop-off
    → [Paid conversion]     {n}% drop-off
```

| Step          | Users | Conversion | Drop-off |
| ------------- | ----- | ---------- | -------- |
| [Entry point] | {n}   | —          | —        |
| [Step 2]      | {n}   | {n}%       | {n}%     |
| [Step 3]      | {n}   | {n}%       | {n}%     |
| [Paid]        | {n}   | {n}%       | {n}%     |

---

## Dashboard

| Dashboard         | Tool                            | Owner     | Refresh   |
| ----------------- | ------------------------------- | --------- | --------- |
| Product health    | [Grafana / Metabase / Mixpanel] | [Product] | Daily     |
| Revenue           | [Stripe / Billing tool]         | [Finance] | Real-time |
| Retention cohorts | [Analytics tool]                | [Product] | Weekly    |
| Funnel            | [Analytics tool]                | [Growth]  | Daily     |

---

## Review Cadence

| Review        | Frequency | Audience         | Format            |
| ------------- | --------- | ---------------- | ----------------- |
| Pulse check   | Weekly    | Product + Growth | Async update      |
| Deep dive     | Monthly   | Leadership       | Deck + discussion |
| Cohort review | Monthly   | Product          | Cohort report     |
| OKR check-in  | Quarterly | All teams        | OKR scorecard     |

---

**Document Status**: Active
**Review Cycle**: Monthly
**Owner**: [Product Lead]
