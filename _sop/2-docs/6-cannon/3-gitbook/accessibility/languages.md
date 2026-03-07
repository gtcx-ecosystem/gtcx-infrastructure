# Multi-Language Support

[Organization Name] content is available in [X] languages.

---

## Language Tiers

### Tier 1 — Full Support

All content translated, real-time alerts, human review.

| Language     | Code | Region   |
| ------------ | ---- | -------- |
| [Language 1] | [XX] | [Region] |
| [Language 2] | [XX] | [Region] |
| [Language 3] | [XX] | [Region] |

### Tier 2 — Key Content

Major reports and breaking alerts translated.

| Language     | Code | Region   |
| ------------ | ---- | -------- |
| [Language 4] | [XX] | [Region] |
| [Language 5] | [XX] | [Region] |

---

## Setting Your Language

### Web Dashboard

Go to **Settings → Language** and select your preference.

### Alerts

Set per-channel language preferences in **Settings → Alerts**.

### API

Include `Accept-Language` header:

```bash
curl -X GET "https://api.[organization-url]/v1/alerts" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Accept-Language: fr"
```

---

## Translation Quality

- Tier 1 languages: Human-reviewed translations
- Tier 2 languages: AI translation with domain glossary
- All translations: Domain terminology validated against the [Organization Name] glossary
