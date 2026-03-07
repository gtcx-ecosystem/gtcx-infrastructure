# Quick Start Guide

Get up and running with [Platform Name] in 5 minutes.

---

## Step 1: Choose Your Access Level

| Level            | Best For                  | Includes                                    |
| ---------------- | ------------------------- | ------------------------------------------- |
| **Free**         | Exploring [Platform Name] | [Free tier features]                        |
| **Professional** | Individual [user type]    | [Professional tier features]                |
| **Enterprise**   | Teams & organizations     | Multi-seat, API access, custom integrations |

→ [View pricing](../resources/faq.md#pricing)

---

## Step 2: Set Up Alerts

### Via Web Dashboard

1. Log in to your [Platform Name] account
2. Navigate to **Settings → Alerts**
3. Select your preferences:
   - **[Filter 1]**: [Description — e.g., which jurisdictions to monitor]
   - **[Filter 2]**: [Description — e.g., which topics or categories]
   - **[Filter 3]**: [Description — e.g., alert severity levels]
4. Choose delivery channels (email, webhook, SMS)

### Via API

```bash
curl -X POST https://api.[your-domain].com/v1/alerts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "[filter_param_1]": ["[value1]", "[value2]"],
    "[filter_param_2]": ["[value1]"],
    "channels": ["email", "webhook"]
  }'
```

---

## Step 3: Explore Intelligence Products

### [Primary Product]

[Brief description of primary product and how to access it]:

1. Go to **[Nav section] → [Product]**
2. [Step 2]
3. [Step 3]

→ [[Primary Product] Documentation](../[path]/[product].md)

### [Secondary Product]

[Brief description]:

1. Go to **[Nav section] → [Product]**
2. [Step 2]
3. [Step 3]

→ [[Secondary Product] Documentation](../[path]/[product].md)

---

## Step 4: Access the API (Enterprise)

### Get Your API Key

1. Go to **Settings → API**
2. Click **Generate API Key**
3. Copy and store securely

### Make Your First Request

```bash
curl -X GET https://api.[your-domain].com/v1/[resource]/[id] \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Response:

```json
{
  "[field_1]": "[value]",
  "[field_2]": "[value]",
  "[score_field]": 0,
  "updated_at": "YYYY-MM-DDT00:00:00Z"
}
```

→ [Full API Documentation](../api/README.md)

---

## Step 5: Set Up Integrations

### Webhooks

Receive real-time alerts in your systems:

1. Go to **Settings → Webhooks**
2. Add your endpoint URL
3. Select event types to receive
4. Test the connection

### [Integration Name — e.g., Slack Integration]

Get alerts directly in [tool]:

1. Go to **Settings → Integrations → [Tool]**
2. Click **Connect to [Tool]**
3. Select channels for different alert types

---

## Common Use Cases

### For [User Type 1]

- [Use case 1]
- [Use case 2]
- [Use case 3]

### For [User Type 2]

- [Use case 1]
- [Use case 2]
- [Use case 3]

### For [User Type 3]

- [Use case 1]
- [Use case 2]
- [Use case 3]

---

## Next Steps

- [Explore Platforms](../[platform-a]/README.md)
- [API Documentation](../api/README.md)
- [Contact Support](../resources/support.md)
