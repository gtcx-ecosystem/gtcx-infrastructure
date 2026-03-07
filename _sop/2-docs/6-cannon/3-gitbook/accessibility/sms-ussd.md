# SMS & USSD Access

Access [Organization Name] on feature phones without internet.

---

## USSD Service

Dial the [Organization Name] USSD code to access content:

```
*[ORG]*1#  →  Today's Headlines (3 stories)
*[ORG]*2#  →  [Domain Data] (e.g., price or index, local)
*[ORG]*3#  →  Regulatory Alerts (by country)
*[ORG]*4#  →  Subscribe/Manage Account
*[ORG]*5#  →  Help
*[ORG]*0#  →  Change Language
```

### Sample USSD Response

```
[ORG] HEADLINES [DD/MM]
1.[Headline 1 — brief]
2.[Headline 2 — brief]
3.[Headline 3 — brief]

Reply 1-3 for details
```

---

## SMS Alerts

Critical alerts delivered via SMS:

```
[ORG] ALERT: [Country] [policy]
change effective [date]. New
[requirement description].
Details:
[org.mk/alert-id]
```

### SMS Features

- 160 character limit
- 6 languages supported
- Delivery confirmation
- Reply STOP to unsubscribe

---

## Setup

### Enable SMS/USSD

1. Go to **Settings → Channels**
2. Enter your phone number
3. Verify via code
4. Select alert preferences

### Costs

- USSD: Standard network rates
- SMS: Incoming SMS free; we cover delivery costs

---

## Availability

| Country / Market | USSD | SMS |
| ---------------- | ---- | --- |
| [Market A]       | ✓    | ✓   |
| [Market B]       | ✓    | ✓   |
| [Market C]       | ✓    | ✓   |
| [Market D]       | —    | ✓   |

_[Additional markets to be added as coverage expands.]_
