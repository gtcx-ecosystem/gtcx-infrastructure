# LLM Routing Strategy — Compliance Gateway

## Optimal Stack (Seed Stage, <$100/mo)

| Query Type         | % Traffic | Model             | Cost/1M in/out | Monthly @ 10K queries |
| ------------------ | --------- | ----------------- | -------------- | --------------------- |
| Simple (1 tool)    | 60%       | GPT-4.1-nano      | $0.10 / $0.40  | $0.30                 |
| Medium (2-3 tools) | 30%       | GPT-4.1-mini      | $0.40 / $1.60  | $1.80                 |
| Complex (4+ tools) | 10%       | Claude Sonnet 4.6 | $3.00 / $15.00 | $5.40                 |
| **Total**          |           |                   |                | **$7.50/mo**          |

## Free Fallbacks

| Provider      | Model            | Rate Limit        | Use Case                        |
| ------------- | ---------------- | ----------------- | ------------------------------- |
| Google Gemini | gemini-2.0-flash | 15 RPM, 1500 RPD  | Dev/test, classifier            |
| Groq          | llama-3.3-70b    | 30 RPM, 14.4K RPD | Fast fallback                   |
| Cerebras      | llama-3.3-70b    | Rate limited      | Emergency fallback (2100 tok/s) |

## Fallback Chain

```
Primary:     GPT-4.1-mini (simple/medium) / Claude Sonnet (complex)
Fallback 1:  Gemini 2.5 Flash / GPT-4.1
Fallback 2:  Groq Llama 3.3 / Gemini 2.5 Pro
Fallback 3:  Cerebras (emergency, free)
Circuit break: Return error, log for review
```

## Tool Calling Quality (ranked for 30+ tools, 5-step chains)

1. Claude Sonnet 4.6 — best overall reliability
2. GPT-4.1 — strongest structured output
3. Gemini 2.5 Pro — occasional schema drift
4. GPT-4.1-mini — sweet spot cost/quality
5. Gemini 2.5 Flash — fast, can hallucinate complex args
6. Llama 3.3 70B — accuracy drops past ~20 tools
7. DeepSeek V3 — cost-effective, latency spikes from China
8. GPT-4.1-nano — struggles with 5-step chains, fine for 1-2

## Cost Optimization Techniques

1. **Tool filtering** — classify intent first, send only relevant 5-8 tools instead of 30. Cuts input costs 60-70%.
2. **Semantic caching** — compliance queries are repetitive. 40-60% cache hit rate is realistic, halving costs.
3. **Batch API** — non-urgent queries via DeepSeek V3 at 50% discount.

## African Deployment Notes

- Google has edge nodes in South Africa (lowest latency for Gemini)
- Groq/Cerebras are US-only — add 150-400ms for Africa
- DeepSeek routes through China — 300-500ms extra, availability risks
- Cloudflare Workers AI for edge classification (free, 10K neurons/day)

## Provider API Keys Needed

| Priority | Provider      | Get key                                | Cost          |
| -------- | ------------- | -------------------------------------- | ------------- |
| 1        | Google Gemini | https://aistudio.google.com/apikey     | Free          |
| 2        | Groq          | https://console.groq.com/keys          | Free          |
| 3        | OpenAI        | https://platform.openai.com/api-keys   | Pay as you go |
| 4        | Anthropic     | https://console.anthropic.com/         | Pay as you go |
| 5        | DeepSeek      | https://platform.deepseek.com/api_keys | Pay as you go |
