# AMANI - Universal Guidance Layer

**Guide any user through any process in 200+ languages**

## Overview

AMANI (meaning "peace" in Swahili) is the AI-driven guidance layer that makes complex systems accessible to everyone. It provides 24/7 intelligent support through multiple channels in 200+ languages, with offline-first design for frontier markets.

## Core Capabilities

- **Multi-Language**: Support for 200+ languages with cultural context
- **Multi-Channel**: WhatsApp, SMS, USSD, Voice, Web - meet users where they are
- **Adaptive Guidance**: Role-specific, context-aware assistance
- **Offline-First**: Works via SMS/USSD in low-connectivity areas
- **Proactive Support**: Detects struggles and offers help before users ask

## Performance

| Metric                   | Target            |
| ------------------------ | ----------------- |
| Concurrent conversations | 50K+              |
| Response latency         | <200ms            |
| Language coverage        | 200+              |
| Issue resolution         | 95% without human |
| User satisfaction        | >80% CSAT         |

## Tech Stack

- **Language**: Python 3.11+
- **AI/LLM**: GPT-4, Claude, Gemini (configurable)
- **Channels**: Twilio, WhatsApp Business API, Africa's Talking
- **APIs**: FastAPI, WebSockets
- **Database**: PostgreSQL, Redis (caching)
- **Orchestration**: Kubernetes, Docker

## Plugin Architecture

### Channels (Pluggable)

```
amani/channels/
├── whatsapp/         # WhatsApp Business API
├── sms/              # SMS gateway (Twilio, Africa's Talking)
├── ussd/             # USSD for feature phones
├── voice/            # Voice calls with speech-to-text
├── web/              # Web chat widget
├── telegram/         # Telegram bot
├── slack/            # Slack integration
└── custom/           # Your custom channel
```

### Languages

```
amani/languages/
├── african/
│   ├── twi/          # Ghana
│   ├── hausa/        # Nigeria, Niger
│   ├── swahili/      # East Africa
│   ├── amharic/      # Ethiopia
│   ├── zulu/         # South Africa
│   └── [50+ more]
├── european/
│   ├── english/
│   ├── french/
│   ├── portuguese/
│   └── [20+ more]
├── asian/
│   ├── mandarin/
│   ├── hindi/
│   └── [30+ more]
└── [200+ total]
```

### Journeys (Configurable)

```
amani/journeys/
├── gtcx/
│   ├── miner-onboarding/      # New miner registration
│   ├── trader-compliance/      # Compliance guidance
│   ├── payment-status/         # "Where's my money?"
│   └── dispute-resolution/     # Handle conflicts
├── land/
│   ├── citizen-digitization/   # Land title registration
│   └── surveyor-workflow/      # Surveyor guidance
├── government/
│   ├── official-training/      # Train ministry staff
│   └── system-navigation/      # Help with dashboards
└── custom/
    └── your-journeys/          # Your domain flows
```

## Configuration

```python
from amani import GuidanceEngine

engine = GuidanceEngine()

# Configure for your domain
engine.configure(
    channels=["whatsapp", "sms", "ussd"],
    languages=["en", "tw", "ha", "fr"],
    journeys="journeys/gtcx/",
    llm_provider="anthropic",  # or "openai", "google"
    options={
        "offline_fallback": True,
        "cultural_adaptation": True,
        "proactive_support": True
    }
)

# Start serving
engine.serve(port=8080)
```

## Example Conversation

```
User (WhatsApp, Twi): "Me payment no ba" (My payment hasn't come)

AMANI: "Akwaaba! Me hwε wo payment status. Wo lot number yε dεn?"
       (Welcome! Let me check your payment status. What's your lot number?)

User: "GT-001234"

AMANI: "Wo payment for GT-001234 wↄ release 3 hours ago after vault
        confirmation. Check wo VaultCard balance. Sε εnyε work a, ka kyerε me."
       (Your payment for GT-001234 was released 3 hours ago after vault
        confirmation. Check your VaultCard balance. If it's not working,
        let me know.)
```

## Integration

### Upstream

- **MABA**: Uses indexed data for contextual guidance
- **KORA**: Displays verification status to users

### Downstream

- Provides guidance across all GTCX platforms (CRX, SGX, AGX)
- Supports VIA/VXA field applications

## Documentation

Full agile-pm documentation in `agile-pm/` folder:

- Conversational UX: `03 - design/`
- Technical architecture: `04 - spec/`
- Language support: `11 - support/`

_Source: Originally from the GTCX monorepo migration tools; now maintained in gtcx-infrastructure (templates)_
