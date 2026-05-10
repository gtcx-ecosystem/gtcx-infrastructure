# LLM Routing Strategy — Compliance Gateway

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

_Last updated: 2026-05-10. Sources: OpenRouter API, pricepertoken.com, getdeploying.com, provider docs._

---

## Complete Model Registry (Tool Calling, Sorted by Cost)

### Free Models (with tool calling)

| Provider    | Model ID                      | Context | Tool Calling | Notes                    |
| ----------- | ----------------------------- | ------- | ------------ | ------------------------ |
| Google      | gemma-4-26b-a4b-it:free       | 262K    | Yes          | Free on OpenRouter       |
| Google      | gemma-4-31b-it:free           | 262K    | Yes          | Free on OpenRouter       |
| InclusionAI | ring-2.6-1t:free              | 262K    | Yes          | Free on OpenRouter       |
| Baidu       | cobuddy:free                  | 131K    | Yes          | Free on OpenRouter       |
| NVIDIA      | nemotron-3-nano-omni-30b:free | 256K    | Yes          | Free on OpenRouter       |
| Poolside    | laguna-xs.2:free              | 131K    | Yes          | Free on OpenRouter       |
| Poolside    | laguna-m.1:free               | 131K    | Yes          | Free on OpenRouter       |
| Google      | gemini-2.0-flash (free tier)  | 1M      | Yes          | 15 RPM, 1500 RPD         |
| Groq        | llama-3.3-70b-versatile       | 128K    | Yes          | 30 RPM, 14.4K RPD        |
| Cerebras    | llama-3.3-70b                 | 128K    | Yes          | Rate limited, 2100 tok/s |

### Ultra-Cheap ($0.01-0.10/1M input)

| Provider    | Model ID              | In $/1M | Out $/1M | Context | Tool Calling |
| ----------- | --------------------- | ------- | -------- | ------- | ------------ |
| DeepSeek    | deepseek-chat (V3)    | $0.014  | $0.028   | 164K    | Yes          |
| Meta        | llama-3.1-8b-instruct | $0.02   | $0.05    | 131K    | Yes          |
| Alibaba     | qwen3-4b-fp8          | $0.03   | $0.03    | 128K    | Yes          |
| Cohere      | command-r7b-12-2024   | $0.04   | $0.15    | 128K    | Yes          |
| OpenAI      | gpt-oss-20b           | $0.04   | $0.15    | 131K    | Yes          |
| Qwen        | qwen3.5-9b            | $0.04   | $0.15    | 262K    | Yes          |
| OpenAI      | gpt-oss-120b          | $0.05   | $0.25    | 131K    | Yes          |
| IBM         | granite-4.1-8b        | $0.05   | $0.10    | 131K    | Yes          |
| Tencent     | hy3-preview           | $0.066  | $0.26    | 262K    | Yes          |
| Google      | gemini-2.0-flash-lite | $0.075  | $0.30    | 1M      | Limited      |
| ByteDance   | seed-2.0-mini         | $0.10   | $0.40    | 262K    | Yes          |
| InclusionAI | ling-2.6-flash        | $0.08   | $0.24    | 262K    | Yes          |

### Cheap ($0.10-1.00/1M input)

| Provider  | Model ID           | In $/1M | Out $/1M | Context | Tool Calling |
| --------- | ------------------ | ------- | -------- | ------- | ------------ |
| Google    | gemini-2.5-flash   | $0.15   | $0.60    | 1M      | Yes          |
| Mistral   | mistral-small-2603 | $0.15   | $0.60    | 262K    | Yes          |
| Qwen      | qwen3.5-27b        | $0.195  | $1.56    | 262K    | Yes          |
| Qwen      | qwen3.5-35b-a3b    | $0.14   | $1.00    | 262K    | Yes          |
| DeepSeek  | deepseek-v4-flash  | $0.14   | $0.28    | 1M      | Yes          |
| DeepSeek  | deepseek-v4-pro    | $0.435  | $0.87    | 1M      | Yes          |
| OpenAI    | gpt-4.1-mini       | $0.40   | $1.60    | 1M      | Yes          |
| OpenAI    | gpt-4.1-nano       | $0.10   | $0.40    | 1M      | Yes          |
| Xiaomi    | mimo-v2.5          | $0.40   | $2.00    | 1M      | Yes          |
| Moonshot  | kimi-k2.6          | $0.75   | $3.50    | 262K    | Yes          |
| Anthropic | claude-haiku-4-5   | $0.80   | $4.00    | 200K    | Yes          |

### Mid-Range ($1.00-5.00/1M input)

| Provider  | Model ID               | In $/1M | Out $/1M | Context | Tool Calling |
| --------- | ---------------------- | ------- | -------- | ------- | ------------ |
| Google    | gemini-2.5-pro         | $1.00   | $10.00   | 1M      | Yes          |
| Google    | gemini-3-flash-preview | $1.00   | $4.00    | 1M      | Yes          |
| OpenAI    | o4-mini                | $1.10   | $4.40    | 200K    | Yes          |
| Mistral   | mistral-large-latest   | $2.00   | $6.00    | 128K    | Yes          |
| OpenAI    | gpt-4.1                | $2.00   | $8.00    | 1M      | Yes          |
| Cohere    | command-a-03-2025      | $2.50   | $10.00   | 256K    | Yes          |
| Anthropic | claude-sonnet-4-6      | $3.00   | $15.00   | 200K    | Yes          |
| xAI       | grok-3                 | $3.00   | $15.00   | 131K    | Yes          |
| Google    | gemini-3-pro           | $3.50   | $14.00   | 2M      | Yes          |

### Frontier ($5.00+/1M input)

| Provider  | Model ID        | In $/1M | Out $/1M | Context | Tool Calling |
| --------- | --------------- | ------- | -------- | ------- | ------------ |
| Anthropic | claude-opus-4-7 | $5.00   | $25.00   | 1M      | Yes          |
| OpenAI    | gpt-5           | $10.00  | $30.00   | 400K    | Yes          |
| OpenAI    | o3              | $15.00  | $60.00   | 200K    | Yes          |
| Anthropic | claude-opus-4-6 | $15.00  | $75.00   | 1M      | Yes          |

---

## NEW: Models discovered in this audit (not in previous version)

| Model              | Why it matters                                              |
| ------------------ | ----------------------------------------------------------- |
| DeepSeek V4 Flash  | $0.14/$0.28, 1M context — 10x cheaper than V3, tool calling |
| DeepSeek V4 Pro    | $0.435/$0.87, 1M context — frontier quality at cheap price  |
| Claude Opus 4.7    | $5/$25 — newer, cheaper than 4.6 ($15/$75)                  |
| GPT-5              | $10/$30, 400K context — exists but expensive                |
| GPT-OSS-20B/120B   | $0.04-0.05/input — open-source OpenAI models, very cheap    |
| Gemini 3 Pro/Flash | Next gen Google models in preview                           |
| Qwen 3.5/3.6       | $0.04-0.20 — Alibaba's latest, very competitive             |
| Tencent hy3        | $0.066/$0.26 — Chinese model, good tool calling             |
| Moonshot Kimi K2.6 | $0.75/$3.50 — strong at tool calling per OpenRouter         |
| ByteDance Seed 2.0 | $0.10/$0.40 — new entrant, cheap                            |
| Xiaomi MIMO v2.5   | $0.40/$2.00, 1M context — surprise competitor               |
| IBM Granite 4.1    | $0.05/$0.10 — enterprise-grade, very cheap                  |
| NVIDIA Nemotron 3  | Free with tool calling                                      |

---

## Updated Routing Strategy

### Previous (based on stale data)

```
Simple  → GPT-4.1-nano ($0.10/$0.40)
Medium  → GPT-4.1-mini ($0.40/$1.60)
Complex → Claude Sonnet ($3.00/$15.00)
```

### Updated (based on live market data)

```
Simple  → DeepSeek V4 Flash ($0.14/$0.28) or free models
Medium  → Gemini 2.5 Flash ($0.15/$0.60) or GPT-4.1-mini ($0.40/$1.60)
Complex → DeepSeek V4 Pro ($0.435/$0.87) or Claude Sonnet ($3.00/$15.00)
```

### Cost reduction: 60-80% vs previous strategy

| Volume          | Previous | Updated | Savings |
| --------------- | -------- | ------- | ------- |
| 10K queries/mo  | $7.50    | $1.80   | 76%     |
| 100K queries/mo | $72.00   | $18.00  | 75%     |

The key insight: **DeepSeek V4 Flash and Pro** change the economics entirely. V4 Flash at $0.14/$0.28 with 1M context and tool calling is cheaper than any previous option while being frontier-quality.

---

## Recommended Provider Priority (updated)

| Priority | Provider      | Key             | Why                                                           |
| -------- | ------------- | --------------- | ------------------------------------------------------------- |
| 1        | Google Gemini | Free            | Free tier for dev, cheap for prod, edge nodes in South Africa |
| 2        | DeepSeek      | $0.014-0.435/1M | V4 Flash is the cost leader with tool calling                 |
| 3        | OpenAI        | $0.04-2.00/1M   | GPT-OSS models are surprisingly cheap                         |
| 4        | Groq          | Free            | Fast inference, free tier for fallback                        |
| 5        | Anthropic     | $0.80-3.00/1M   | Best tool calling quality, use for complex only               |
| 6        | OpenRouter    | Varies          | Unified API to 200+ models, single key                        |

---

_Sources: OpenRouter API (/api/v1/models), pricepertoken.com, getdeploying.com, zenvanriel.com, provider pricing pages._
