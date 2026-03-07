# Authentication

All API requests require authentication via Bearer token.

---

## Getting Your API Key

1. Log in to your [Platform G] account
2. Navigate to **Settings → API**
3. Click **Generate API Key**
4. Copy and store securely

⚠️ **API keys are shown only once.** Store them securely.

---

## Using Your API Key

Include the key in the `Authorization` header:

```bash
curl -X GET "https://api.[organization-url]/v1/[index-a]/countries" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

---

## SDK Authentication

### Python

```python
from [org]_sdk import Client

client = Client(api_key="YOUR_API_KEY")
results = client.[resource].list()
```

### JavaScript

```javascript
import { OrgClient } from '@[org]/sdk';

const client = new OrgClient({ apiKey: 'YOUR_API_KEY' });
const results = await client.[resource].list();
```

---

## Key Management

### Permissions

API keys inherit the permissions of your account tier:

| Tier          | Endpoints Available                                         |
| ------------- | ----------------------------------------------------------- |
| Professional  | Alerts, [Index A], [Index C], [Intelligence Product] (read) |
| Institutional | All endpoints, webhooks, bulk export                        |

### Rotation

- Rotate keys every 90 days (recommended)
- Revoke compromised keys immediately
- Multiple active keys supported (Enterprise)

### Revocation

1. Go to **Settings → API**
2. Click **Revoke** next to the key
3. Key is immediately invalidated

---

## Security Best Practices

- Never expose keys in client-side code
- Use environment variables for key storage
- Rotate keys regularly
- Monitor usage for anomalies
- Use IP allowlists (Enterprise)

---

## Errors

| Code  | Meaning                                       |
| ----- | --------------------------------------------- |
| `401` | Missing or invalid API key                    |
| `403` | Key doesn't have permission for this endpoint |
| `429` | Rate limit exceeded                           |

```json
{
  "error": {
    "code": "invalid_api_key",
    "message": "The provided API key is invalid or expired."
  }
}
```
