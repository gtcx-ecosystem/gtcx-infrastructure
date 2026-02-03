# AMANI - Product Requirements Document (PRD)

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Status**: In Development  
**Product Owner**: GTCX Experience Team  


## 1. Executive Summary

### Product Vision
AMANI (Guidance & Concierge) is the human interface layer that transforms complex technical systems into accessible, intuitive experiences for every user. It ensures that farmers in rural Africa can access the same powerful GTCX capabilities as banks in capital cities, breaking down barriers of language, literacy, and connectivity.

### Problem Statement
- 70% of potential users struggle with complex technical systems
- Language barriers exclude millions (2000+ African languages)
- Limited internet connectivity prevents rural adoption
- Regulatory compliance is too complex for average users
- No 24/7 support in local languages

### Solution
AMANI provides an intelligent guidance system that:
- Communicates in 200+ languages including local dialects
- Works offline via SMS/USSD for basic phones
- Provides 24/7 AI-powered support
- Guides users through complex processes step-by-step
- Learns and improves from every interaction


## 2. Goals & Objectives

### Primary Goals
1. **Universal Accessibility**: Support 200+ languages
2. **Instant Help**: <200ms response time
3. **High Success**: 90% task completion rate
4. **User Satisfaction**: 80%+ CSAT score
5. **Offline-First**: Full functionality without internet

### Success Metrics
| Metric | Target | Current | Priority |
|--------|--------|---------|----------|
| Languages Supported | 200+ | - | P0 |
| Response Time | <200ms | - | P0 |
| Task Completion | 90% | - | P0 |
| User Satisfaction | 80% | - | P0 |
| Offline Success Rate | 85% | - | P1 |
| Cost per Conversation | <$0.01 | - | P2 |


## 3. User Personas

### Primary Users

#### Rural Farmer (Kwame)
- **Demographics**: 45, Ghana, basic education, speaks Twi
- **Tech Level**: Feature phone, limited internet
- **Needs**: Register land, get loan, sell crops
- **Pain Points**: Complex forms, English only, no help
- **Success**: Completes tasks via voice in Twi

#### Government Clerk (Fatima)
- **Demographics**: 28, Kenya, college educated, speaks Swahili/English
- **Tech Level**: Smartphone, intermittent internet
- **Needs**: Process registrations, verify documents
- **Pain Points**: No training, complex procedures
- **Success**: Guided through workflows efficiently

#### Bank Officer (Chen)
- **Demographics**: 35, Rwanda, university degree, speaks Kinyarwanda/French/English
- **Tech Level**: Computer, reliable internet
- **Needs**: Verify collateral, process loans
- **Pain Points**: Multiple systems, slow verification
- **Success**: One-click verification with confidence

#### Community Leader (Amara)
- **Demographics**: 50, Nigeria, traditional authority, speaks Yoruba
- **Tech Level**: Basic smartphone, limited data
- **Needs**: Validate community claims, resolve disputes
- **Pain Points**: No digital literacy, language barrier
- **Success**: Voice-guided validation in Yoruba

### Secondary Users

#### Field Agent
- **Role**: Helps rural communities with registration
- **Needs**: Offline tools, simple interfaces
- **Success**: Registers 50+ farmers per day

#### System Administrator
- **Role**: Manages GTCX systems
- **Needs**: Monitoring, troubleshooting help
- **Success**: Resolves issues quickly with AI help


## 4. User Requirements

### Functional Requirements

#### Conversational Interface
- **REQ-001**: Natural language understanding in 200+ languages
- **REQ-002**: Voice input/output support
- **REQ-003**: Context preservation across sessions
- **REQ-004**: Personality adaptation based on user
- **REQ-005**: Emotion detection and empathetic responses
- **REQ-006**: Multi-turn conversation support

#### Guidance System
- **REQ-007**: Step-by-step workflow guidance
- **REQ-008**: Proactive help based on user behavior
- **REQ-009**: Visual guides with screenshots
- **REQ-010**: Video tutorials in local languages
- **REQ-011**: Interactive demos and simulations
- **REQ-012**: Personalized learning paths

#### Multi-Channel Delivery
- **REQ-013**: Web chat interface
- **REQ-014**: Mobile app (iOS/Android)
- **REQ-015**: WhatsApp integration
- **REQ-016**: SMS support for feature phones
- **REQ-017**: USSD for offline access
- **REQ-018**: Voice hotline integration

#### Knowledge Management
- **REQ-019**: Searchable knowledge base
- **REQ-020**: Auto-updated documentation
- **REQ-021**: Community Q&A platform
- **REQ-022**: Expert escalation system
- **REQ-023**: Feedback and rating system
- **REQ-024**: Continuous learning from interactions

### Non-Functional Requirements

#### Performance
- **NFR-001**: <200ms response time for text
- **NFR-002**: <3s for voice responses
- **NFR-003**: Support 100K concurrent users
- **NFR-004**: 99.9% uptime

#### Accessibility
- **NFR-005**: WCAG 2.1 AA compliance
- **NFR-006**: Screen reader support
- **NFR-007**: High contrast mode
- **NFR-008**: Adjustable text size
- **NFR-009**: Keyboard navigation

#### Localization
- **NFR-010**: RTL language support
- **NFR-011**: Cultural adaptation
- **NFR-012**: Local date/time formats
- **NFR-013**: Currency localization
- **NFR-014**: Dialectal variations


## 5. Features & User Stories

### Epic 1: Conversational AI Core

#### Feature: Multi-Language Understanding
**User Story**: As a Swahili-speaking farmer, I want to ask questions in my language so that I can understand the system.

**Acceptance Criteria**:
- Understand queries in 200+ languages
- Respond in the same language
- Handle code-switching (multiple languages)
- Support voice input
- Accuracy >95% for common queries

#### Feature: Context-Aware Responses
**User Story**: As a returning user, I want the system to remember our previous conversation so that I don't have to repeat myself.

**Acceptance Criteria**:
- Maintain conversation history
- Reference previous interactions
- Personalize based on user profile
- Track task progress
- Resume interrupted workflows

### Epic 2: Proactive Guidance

#### Feature: Struggle Detection
**User Story**: As a new user, I want help when I'm stuck so that I can complete my task.

**Acceptance Criteria**:
- Detect user confusion patterns
- Offer help proactively
- Provide relevant suggestions
- Escalate to human if needed
- Learn from struggle patterns

#### Feature: Smart Notifications
**User Story**: As a busy professional, I want timely reminders so that I don't miss important deadlines.

**Acceptance Criteria**:
- Send contextual reminders
- Optimize timing based on user behavior
- Multi-channel notifications
- Actionable notification content
- Respect user preferences

### Epic 3: Offline Capabilities

#### Feature: USSD Interface
**User Story**: As a feature phone user, I want to access services via USSD so that I don't need internet.

**Acceptance Criteria**:
- Menu-driven USSD interface
- Session state management
- 160-character limit compliance
- Support for all core functions
- Graceful degradation

#### Feature: SMS Commands
**User Story**: As an offline user, I want to interact via SMS so that I can access services anywhere.

**Acceptance Criteria**:
- Natural language SMS processing
- Command shortcuts
- Status queries via SMS
- Multi-part message handling
- Cost-effective routing

### Epic 4: Knowledge Graph

#### Feature: Intelligent Search
**User Story**: As a government official, I want to find relevant procedures quickly so that I can serve citizens efficiently.

**Acceptance Criteria**:
- Semantic search capabilities
- Auto-complete suggestions
- Related topic discovery
- Ranked results by relevance
- Search in local language

#### Feature: Regulatory Guidance
**User Story**: As a bank compliance officer, I want to understand regulations so that we remain compliant.

**Acceptance Criteria**:
- Country-specific regulations
- Step-by-step compliance guides
- Automatic updates on changes
- Audit trail generation
- Multi-jurisdiction support


## 6. User Experience

### Design Principles
1. **Conversational**: Natural, friendly dialogue
2. **Empathetic**: Understand user emotions
3. **Patient**: Never rush the user
4. **Clear**: Simple, jargon-free language
5. **Inclusive**: Accessible to everyone

### Key Workflows

#### Workflow 1: First-Time Onboarding
1. Language selection (voice or text)
2. Role identification (farmer, official, etc.)
3. Guided tour of capabilities
4. First task assistance
5. Feedback collection

#### Workflow 2: Task Assistance
1. User states goal
2. System confirms understanding
3. Step-by-step guidance
4. Progress tracking
5. Completion celebration

#### Workflow 3: Problem Resolution
1. User describes issue
2. System diagnoses problem
3. Provides solution steps
4. Confirms resolution
5. Learns from issue

### Conversation Design
```yaml
greeting:
  swahili: "Karibu! Ninaweza kukusaidia vipi leo?"
  english: "Welcome! How can I help you today?"
  yoruba: "E kaabo! Bawo ni mo se le ran yin lowo loni?"

personality:
  tone: Warm, professional, patient
  style: Clear, concise, encouraging
  humor: Light, culturally appropriate
  formality: Adapts to user preference
```


## 7. Technical Constraints

### Integration Requirements
- Must query MABA for data status
- Must access KORA for verification info
- Must trigger JENGO for economic functions
- Must work with all GTCX interfaces

### Compliance Requirements
- GDPR for data privacy
- Local language laws
- Accessibility regulations
- Financial advisory restrictions

### Technical Limitations
- LLM token limits
- Translation accuracy varies
- Voice recognition in noisy environments
- USSD session timeouts
- SMS character limits


## 8. Release Strategy

### MVP (Month 1-2)
- English + 5 major languages
- Basic chat interface
- Simple workflow guidance
- FAQ system

### Version 1.0 (Month 3-4)
- 50+ languages
- Voice support
- Proactive guidance
- Mobile apps

### Version 2.0 (Month 5-6)
- 200+ languages
- Full offline support
- Advanced personalization
- Video tutorials


## 9. Success Criteria

### Launch Success
- 10,000 active users
- 80% task completion
- 4.0+ star rating
- 5 languages supported
- <1 minute to first value

### Long-term Success
- 1M+ active users
- 200+ languages
- 90% self-service rate
- 50% cost reduction in support
- Industry standard for AI guidance


## 10. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Language translation errors | High | Medium | Human review, continuous improvement |
| Cultural misunderstanding | High | Medium | Local experts, cultural training |
| LLM hallucination | High | Low | Constrained responses, fact checking |
| Offline limitations | Medium | High | Progressive enhancement, clear expectations |
| User trust issues | High | Medium | Transparency, human escalation |


## 11. Dependencies

### Internal Dependencies
- MABA for data information
- KORA for verification status
- JENGO for economic guidance
- Platform team for infrastructure

### External Dependencies
- OpenAI/Anthropic for LLM
- Google for translation
- Twilio for SMS/Voice
- African telcos for USSD


## 12. Open Questions

1. How do we handle languages without written forms?
2. What's the escalation path to human support?
3. How do we measure conversation quality?
4. What's the pricing model for different channels?
5. How do we ensure cultural sensitivity?


## Appendix A: Language Priority

| Tier | Languages | Timeline | Rationale |
|------|-----------|----------|-----------|
| 1 | English, Swahili, French, Arabic, Portuguese | Month 1 | Official languages |
| 2 | Yoruba, Hausa, Igbo, Amharic, Zulu | Month 2 | Major regional |
| 3 | Twi, Lingala, Wolof, Somali, Kinyarwanda | Month 3 | Important local |
| 4 | 50+ additional | Month 4-6 | Full coverage |


## Appendix B: Channel Comparison

| Channel | Cost | Reach | Features | Limitations |
|---------|------|-------|----------|-------------|
| Web Chat | Low | Medium | Full | Needs internet |
| WhatsApp | Low | High | Rich | Needs smartphone |
| SMS | Medium | Highest | Basic | 160 chars |
| USSD | Low | Highest | Menu | Session timeout |
| Voice | High | High | Natural | Cost, quality |


**Document Status**: Living document, updated each sprint  
**Next Review**: End of Sprint 1  
**Approval**: Pending Experience Team review
