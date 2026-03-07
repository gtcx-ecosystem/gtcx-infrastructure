# ADR-006: Multi-Channel Distribution

## Status

Accepted

## Date

2026-01-27

## Context

[Organization Name] serves audiences across varied connectivity conditions:

| Condition             | Characteristics         | Audience                           |
| --------------------- | ----------------------- | ---------------------------------- |
| **Full connectivity** | 4G/WiFi, rich media     | Urban professionals, international |
| **Limited data**      | 3G, metered connections | Semi-urban / frontier markets      |
| **Text-only**         | SMS, WhatsApp, USSD     | Rural areas, field operators       |
| **Email digest**      | Async, batched          | Corporate subscribers              |

A single distribution channel excludes significant portions of our target audience.

## Decision

Implement **multi-channel distribution** where content adapts to channel constraints:

### Channel Matrix

| Channel       | Format       | Length        | Media   | Frequency      |
| ------------- | ------------ | ------------- | ------- | -------------- |
| **Website**   | Full HTML    | Unlimited     | Rich    | Real-time      |
| **Email**     | HTML + plain | 2,000 words   | Images  | 2-3x/week      |
| **LinkedIn**  | Native post  | 700 words     | 1 image | Daily          |
| **Twitter/X** | Thread       | 280 chars x 5 | None    | Multiple daily |
| **WhatsApp**  | Plain text   | 500 words     | 1 image | Daily digest   |
| **SMS**       | Plain text   | 160 chars     | None    | Breaking only  |

### Content Transformation

Each piece of content generates multiple outputs:

```
Source Content (1,500 words)
    │
    ├─► Website: Full article
    ├─► Email: Full article + summary
    ├─► LinkedIn: 700-word adaptation
    ├─► Twitter: 5-tweet thread
    ├─► WhatsApp: 3-paragraph summary
    └─► SMS: Single sentence + link
```

### SMS for Breaking News

Critical alerts reach SMS subscribers:

```
[[ORG] ALERT] [Country]: New regulatory rules effective [Date].
Details: [org].mk/[slug]
```

160-character limit. Link to full content.

### WhatsApp Business

Daily digest via WhatsApp broadcast:

```
📊 [Organization Name] Daily - [Date]

[METRIC]: [Value] ([Change])
[Index A] [Country]: [Score] ([Rating])

Top Story: [Headline summary]...

Full brief: [org].mk/daily-[slug]
```

## Consequences

### Benefits

- Reach audiences across all connectivity levels
- Meet users where they are (match dominant channels in your target market)
- Breaking news reaches everyone immediately
- Flexibility for user preference

### Drawbacks

- Content must be transformed per channel
- Multiple platform management
- SMS costs for breaking alerts
- WhatsApp Business API limitations

### Cost Considerations

| Channel  | Cost Model                        |
| -------- | --------------------------------- |
| Website  | Hosting only                      |
| Email    | ~$0.001/email (Sendgrid/Postmark) |
| LinkedIn | Free (organic)                    |
| Twitter  | Free (organic)                    |
| WhatsApp | ~$0.05/message (Business API)     |
| SMS      | ~$0.03/message                    |

## Implementation

AI workflows generate multi-format outputs:

```yaml
# In workflow config
outputs:
  - format: full
    channel: website
  - format: email
    channel: email
  - format: linkedin
    max_words: 700
  - format: twitter_thread
    max_tweets: 5
  - format: whatsapp
    max_words: 500
  - format: sms
    max_chars: 160
    trigger: breaking_only
```

## Related Decisions

- ADR-003: AI-Native Architecture
- ADR-004: Content-First Architecture
