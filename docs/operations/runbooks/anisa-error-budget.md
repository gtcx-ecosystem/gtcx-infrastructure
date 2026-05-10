# ANISA Error Budget Runbook

> **Status:** Current
> **Date:** 2026-05-10
> **Owner:** GTCX Infrastructure

## Alert

- `ANISAErrorBudgetFastBurn` — 14.4x burn rate (page immediately)
- `ANISAErrorBudgetSlowBurn` — 6x burn rate (create ticket)

## Impact

ANISA (AI-driven intelligence service) is failing or returning low-confidence results at an unsustainable rate.

## Initial Response (5 minutes)

1. Check ANISA health: `GET https://api.gtcx.io/intelligence/health`
2. Review intelligence logs:
   ```bash
   kubectl logs -n intelligence -l app=anisa --tail=500
   ```
3. Check external LLM provider status (Anthropic, OpenAI)
4. Verify circuit breaker status:
   ```bash
   kubectl exec -n intelligence deploy/anisa -- curl -s localhost:8100/metrics | grep circuit
   ```

## Common Causes

| Cause               | Indicator                               | Fix                                 |
| ------------------- | --------------------------------------- | ----------------------------------- |
| LLM provider outage | High `intelligence_circuit_trips_total` | Enable sandbox mode or fallback     |
| Rate limiting       | 429 errors from provider                | Reduce batch size or add backoff    |
| Degraded model      | Low confidence scores                   | Roll back to previous model version |

## Escalation

- Escalate to `@gtcx/platform-team` and intelligence team lead.
