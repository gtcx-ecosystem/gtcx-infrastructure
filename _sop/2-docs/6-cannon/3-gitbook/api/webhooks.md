# Webhooks

Receive real-time notifications when events occur.

---

## Setup

1. Go to **Settings → Webhooks** in [Platform B]
2. Add your endpoint URL
3. Select event types
4. Save and test

---

## Event Types

| Event                              | Description                  |
| ---------------------------------- | ---------------------------- |
| `alert.created`                    | New breaking alert published |
| `[index-a].updated`                | [Index A] score changed      |
| `[index-c].updated`                | [Index C] score changed      |
| `[intelligence-product].published` | New regulatory content       |
| `entity.flagged`                   | Counterparty red flag added  |

---

## Payload Format

```json
POST https://your-server.com/webhook
Content-Type: application/json
X-[Org]-Signature: sha256=abc123...

{
  "event": "alert.created",
  "timestamp": "2025-01-27T12:00:00Z",
  "data": {
    "id": "alert_xyz",
    "title": "[Country/Entity] [Policy/Rule] Change",
    "jurisdiction": "[COUNTRY_CODE]",
    "impact": "high"
  }
}
```

---

## Verification

Verify webhook authenticity using the signature header:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
```

---

## Retry Policy

Failed deliveries are retried:

- 1st retry: 1 minute
- 2nd retry: 5 minutes
- 3rd retry: 30 minutes
- 4th retry: 2 hours
- 5th retry: 24 hours

After 5 failures, webhook is disabled.
