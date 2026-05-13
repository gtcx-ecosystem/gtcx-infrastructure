---
title: 'Model Card — Compliance Gateway (Tool Router)'
status: 'current'
date: '2026-05-12'
model_name: 'gtcx-compliance-gateway-router'
model_version: '1.0.0'
owner: 'ml-engineering'
tier: 'critical'
tags: ['model-card', 'nlp', 'tool-routing', 'ml']
review_cycle: 'quarterly'
---

# Model Card — Compliance Gateway (Tool Router)

**Model Name:** `gtcx-compliance-gateway-router`  
**Version:** 1.0.0  
**Type:** Rule-based natural language intent classifier  
**Deployment:** Node.js service (Kubernetes Deployment)  
**Last Updated:** 2026-05-12

---

## 1. Model Description

The compliance gateway router classifies natural-language user queries into tool invocations (transfer, query, etc.). It uses keyword-based heuristics with disambiguation logic for multi-intent queries.

**Input:** Natural language query string  
**Output:** Tool name + confidence score  
**Latency:** < 50ms per query

---

## 2. Intended Use

| Use Case                 | Supported  | Notes                                |
| ------------------------ | ---------- | ------------------------------------ |
| Route transfer requests  | ✅ Yes     | "Send", "transfer", "pay", "deposit" |
| Route query requests     | ✅ Yes     | "Balance", "history", "rate"         |
| Handle ambiguous queries | ⚠️ Partial | Simple disambiguation only           |
| Multi-turn conversations | ❌ No      | Single-turn classification           |
| Non-English queries      | ❌ No      | English only                         |

---

## 3. Model Architecture

```
User Query → Keyword Extraction → Intent Scoring → Tool Selection → Confidence
                  ↓                      ↓
            Transfer Keywords       Query Keywords
```

**Keyword Lists:**

| Intent   | Keywords                                                     |
| -------- | ------------------------------------------------------------ |
| transfer | send, transfer, pay, deposit, payment                        |
| query    | balance, history, list, rate, interest, show, what, how much |

**Disambiguation:** When both intent keywords match, money-action verbs take precedence over information nouns.

---

## 4. Training Data

**N/A** — Rule-based heuristic system. No training data required.

**Benchmark:** `tools/eval-pipeline/benchmarks/compliance-gateway.json`  
**Cases:** 10 hand-crafted queries covering common user intents

---

## 5. Evaluation

| Metric         | Value  | Benchmark |
| -------------- | ------ | --------- |
| Accuracy       | 1.0000 | ≥ 0.90 ✅ |
| Avg Confidence | 0.9500 | ≥ 0.85 ✅ |
| Latency (p99)  | 12ms   | ≤ 50ms ✅ |

**Eval Pipeline:** `tools/eval-pipeline/eval.mjs --model=compliance-gateway`  
**CI Gate:** Accuracy must be ≥ 0.90  
**Last Evaluation:** 2026-05-12

---

## 6. Limitations

1. **Keyword dependency:** Cannot handle paraphrased or novel expressions not in keyword lists.
2. **No context awareness:** Each query classified independently; no session memory.
3. **English only:** No multilingual support.
4. **Simple disambiguation:** Complex multi-intent queries may be misclassified.

---

## 7. Ethical Considerations

| Consideration   | Assessment                                                      |
| --------------- | --------------------------------------------------------------- |
| Privacy impact  | Low — queries may contain PII; logged with encryption           |
| Bias risk       | Medium — keyword lists may underrepresent non-standard dialects |
| Transparency    | High — all keywords documented, logic inspectable               |
| Human oversight | Required — mutating tools require approval ticket               |
| Auditability    | Full — all classifications logged with query + output           |

---

## 8. Deployment

| Environment | Status | Replicas | Resources        |
| ----------- | ------ | -------- | ---------------- |
| Staging     | Active | 2        | 384Mi / 200m CPU |
| Production  | Active | 3        | 1Gi / 500m CPU   |

**Rollback:** Kubernetes Deployment rollback to previous revision  
**Monitoring:** Latency and error rate dashboards in Grafana

---

## 9. Roadmap

| Version | ETA     | Changes                                                 |
| ------- | ------- | ------------------------------------------------------- |
| 1.1.0   | Q3 2026 | Add confidence threshold gating (reject low-confidence) |
| 2.0.0   | Q4 2026 | Migrate to fine-tuned LLM with RAG context              |

---

## 10. Changelog

| Version | Date       | Changes                   |
| ------- | ---------- | ------------------------- |
| 1.0.0   | 2026-05-12 | Initial rule-based router |

---

## 11. Contact

- **Model Owner:** ML Engineering (`@ml-engineering`)
- **On-Call:** SRE (`@sre-oncall`)
- **Security Questions:** Security Team (`@security`)
