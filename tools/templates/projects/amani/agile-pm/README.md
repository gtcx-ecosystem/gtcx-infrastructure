# AMANI - Guidance & Concierge Agile PM

*AI-Driven Guidance System for GTCX Ecosystem*

## Project Overview

**Component Name**: AMANI (Guidance & Concierge)  
**Type**: User Experience & Support Service  
**Priority**: P0 - Critical Adoption Component  
**Status**: Active Development  
**Sprint Cycle**: 2 weeks  
**Current Sprint**: Sprint 1 - Core Guidance Engine  


## Quick Start for Developers

```bash
# Navigate to project
cd /Users/amanianai/Documents/_claude/amani/agile-pm

# Check current priorities
cat 06\ -\ planning/priority-framework.md

# Review technical specs
cat 04\ -\ spec/technical-architecture-template.md

# View current sprint
cat 06\ -\ planning/current-sprint.md
```


## What is AMANI?

AMANI (meaning "peace" or "wishes fulfilled" in Swahili) is the **AI-driven guidance layer** that makes the GTCX ecosystem accessible to everyone. It serves as the always-available guide, trainer, and support system for users across governments, banks, and communities.

### Core Capabilities
- **24/7 Intelligent Support**: AI concierge in 200+ languages
- **Adaptive Onboarding**: Role-specific guidance paths
- **Compliance Navigation**: Step-by-step regulatory guidance
- **Proactive Assistance**: Detects and prevents user struggles
- **Offline-First**: Works via SMS/USSD in low-connectivity areas

### Key Metrics
- 90% reduction in onboarding time
- 80% user satisfaction score
- 200+ language support
- <200ms response time
- 95% issue resolution without human help


## Agile PM Structure

```
amani/agile-pm/
├── 01 - overview/          # Project navigation
├── 02 - vision/            # Product requirements (PRD)
├── 03 - design/            # Conversational UX design ⭐
├── 04 - spec/              # AI architecture specs ⭐
├── 05 - roadmap/           # Feature roadmap & epics
├── 06 - planning/          # Sprint planning & stories ⭐
├── 07 - backend/           # AI/ML implementation
├── 08 - frontend/          # Chat interfaces
├── 09 - security/          # Privacy & data protection
├── 10 - compliance/        # Multi-jurisdiction support
├── 11 - support/           # Training materials
├── 12 - gtm/               # Adoption strategy
├── 13 - agent-resources/   # AI agent guidelines
├── 14 - automation/        # Conversation scripts
└── 15 - metrics-dashboards/# User success metrics
```


## Current Sprint Focus

### Sprint 1: Core Guidance Engine (Weeks 1-2)
- AMANI-001: Conversational AI Core [P0, 13pts]
- AMANI-002: Multi-Language Processing [P0, 8pts]
- AMANI-003: Context Management System [P0, 8pts]

### Upcoming Sprints
- Sprint 2: Knowledge Graph Integration
- Sprint 3: Proactive Guidance System
- Sprint 4: Offline Capabilities (SMS/USSD)


## Technology Stack

### Core Technologies
- **AI Model**: Fine-tuned GPT-4 for GTCX domain
- **Local Models**: Llama 3 for edge deployment
- **Voice**: Whisper + local TTS
- **Translation**: NLLB-200 (200+ languages)
- **Knowledge Base**: Neo4j graph database
- **Session**: Redis for conversation state
- **Delivery**: React Native, Next.js, USSD

### Architecture Pattern
- Conversational AI architecture
- Multi-modal input processing
- Context-aware responses
- Federated learning for improvement


## Priority Framework

| Priority | Description | Response Time | Current Count |
|----------|------------|---------------|---------------|
| **P0** | Critical - Users blocked without it | Immediate | 3 |
| **P1** | High - Core guidance features | Within sprint | 7 |
| **P2** | Medium - Enhanced assistance | 2-3 sprints | 12 |
| **P3** | Low - Advanced features | Backlog | 20 |


## Definition of Done

### For Guidance Features
- Conversation flow implemented
- Multi-language support verified
- Context preservation working
- Response time <200ms
- Accuracy >95% for common queries
- Offline fallback implemented
- User satisfaction >80%
- Accessibility standards met
- Privacy compliance verified


## Integration Points

### Upstream Dependencies
- **MABA**: Queries data transformation status
- **KORA**: Retrieves verification information

### Downstream Consumers
- **Jengo**: Provides economic guidance
- **User Interfaces**: All GTCX applications

### External Systems
- Translation services
- Voice processing services
- SMS/USSD gateways
- Analytics platforms


## Success Metrics

### User Experience KPIs
- Task completion rate (%)
- Time to resolution (minutes)
- Conversation satisfaction (CSAT)
- Language coverage (%)
- Offline success rate (%)

### System KPIs
- Response latency (ms)
- Concurrent conversations
- Knowledge gap detection
- Learning improvement rate
- Cost per conversation


## Team & Contacts

### Core Team
- **Tech Lead**: AI architecture & models
- **ML Engineers**: Model fine-tuning
- **NLP Engineers**: Language processing
- **UX Designers**: Conversation design
- **QA**: Multi-language testing

### Stakeholders
- **User Communities**: Feedback & testing
- **Government Partners**: Compliance requirements
- **Field Agents**: Offline scenarios
- **Support Teams**: Escalation handling


## Important Links

### Documentation
- [Conversational Architecture](04%20-%20spec/conversational-ai-spec.md)
- [Language Processing](04%20-%20spec/language-processing.md)
- [Knowledge Graph Schema](07%20-%20backend/knowledge-graph.md)
- [Conversation Flows](03%20-%20design/conversation-flows.md)

### Development Resources
- [Model Fine-tuning Guide](11%20-%20support/fine-tuning.md)
- [Language Testing Framework](06%20-%20planning/language-testing.md)
- [Offline Testing Guide](14%20-%20automation/offline-test.md)


## For AI Agents

### Before You Start
1. Read [Conversation Design Principles](03%20-%20design/conversation-principles.md)
2. Review [Language Guidelines](04%20-%20spec/language-guidelines.md)
3. Understand [Context Management](04%20-%20spec/context-management.md)
4. Check [Current Sprint](06%20-%20planning/current-sprint.md)

### Key Commands
```bash
# Test conversation flows
python test_conversations.py --language sw --scenario onboarding

# Validate language models
./scripts/validate-translations.sh

# Check response metrics
python 15\ -\ metrics-dashboards/conversation-metrics.py

# Run offline simulation
./tools/offline-simulator --mode ussd
```


## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-11-15 | Initial Amani agile-pm structure |
| 1.1.0 | 2024-11-15 | Added conversational AI specs |
| 1.2.0 | 2024-11-15 | Integrated multi-language support |


**Last Updated**: November 15, 2024  
**Status**: Active Development 
**Next Review**: Sprint 1 Retrospective (Week 2)

*This agile-pm structure ensures AMANI development creates the most intuitive and helpful user experience across all languages and contexts.*
