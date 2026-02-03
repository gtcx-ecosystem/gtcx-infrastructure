# AMANI - Technical Architecture Specification

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Author**: GTCX Experience Engineering Team  
**Status**: In Development  


## 1. System Overview

### Architecture Philosophy
AMANI follows a **conversational AI architecture** designed for:
- **Accessibility**: Works for everyone, everywhere, in any language
- **Intelligence**: Context-aware, learning responses
- **Multilingual**: 200+ languages with cultural adaptation
- **Offline-First**: Full functionality without internet
- **Proactive**: Anticipates and prevents user struggles

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    AMANI GUIDANCE LAYER                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Multi-Modal │  │   Context    │  │   Response   │     │
│  │    Input     │→ │   Engine     │→ │  Generator   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↑                 ↑                  ↓              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Adaptive Learning System                   │  │
│  │    (User Patterns, Success Paths, Cultural Context)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │             Knowledge Graph & Memory                  │  │
│  │  [Regulations] [Procedures] [Cases] [Best Practices]  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


## 2. Component Architecture

### 2.1 Multi-Modal Input Processing

#### Input Channels
```python
class InputProcessor:
    """Handles inputs from all channels"""
    
    def __init__(self):
        self.text_processor = TextProcessor()
        self.voice_processor = WhisperProcessor()
        self.image_processor = VisionProcessor()
        self.ussd_handler = USSDHandler()
        self.sms_handler = SMSHandler()
        self.whatsapp_handler = WhatsAppHandler()
        
    async def process_input(self, input_data: InputData) -> ProcessedInput:
        match input_data.channel:
            case Channel.WEB_CHAT:
                return await self.process_web_chat(input_data)
            case Channel.VOICE:
                return await self.process_voice(input_data)
            case Channel.WHATSAPP:
                return await self.process_whatsapp(input_data)
            case Channel.SMS:
                return await self.process_sms(input_data)
            case Channel.USSD:
                return await self.process_ussd(input_data)
    
    async def process_voice(self, audio: AudioData) -> ProcessedInput:
        # Speech to text using Whisper
        transcript = await self.voice_processor.transcribe(audio)
        
        # Language detection
        language = self.detect_language(transcript)
        
        # Sentiment and emotion analysis
        emotion = self.analyze_emotion(audio)
        
        # Intent extraction
        intent = await self.extract_intent(transcript, language)
        
        return ProcessedInput(
            text=transcript,
            language=language,
            emotion=emotion,
            intent=intent,
            original_modality="voice"
        )
```

### 2.2 Language Processing

#### Multi-Language Support
```python
class LanguageProcessor:
    """Handles 200+ languages including dialects"""
    
    def __init__(self):
        self.translator = NLLB200Model()  # Meta's 200-language model
        self.dialect_mapper = DialectMapper()
        self.cultural_adapter = CulturalContextAdapter()
        self.local_models = self.load_local_models()  # Offline models
        
    async def process(self, text: str, language: str) -> ProcessedText:
        # Detect language if not specified
        if not language:
            language = self.detect_language(text)
            
        # Map dialect to standard form
        standard_lang = self.dialect_mapper.standardize(language)
        
        # Check if offline processing needed
        if self.is_offline() or self.should_use_local(language):
            return await self.process_locally(text, language)
        
        # Translate to English for processing
        english_text = await self.translator.translate(
            text,
            source=standard_lang,
            target="en"
        )
        
        # Extract cultural markers
        cultural_context = self.cultural_adapter.extract_context(
            text=text,
            language=language,
            region=self.get_user_region()
        )
        
        return ProcessedText(
            original=text,
            translated=english_text,
            language=language,
            cultural_markers=cultural_context,
            formality_level=self.detect_formality(text, language)
        )
    
    def get_language_config(self, language: str) -> LanguageConfig:
        """Get language-specific configuration"""
        configs = {
            "sw": LanguageConfig(
                name="Swahili",
                direction="ltr",
                formality_default="informal",
                greeting="Karibu",
                goodbye="Kwaheri"
            ),
            "yo": LanguageConfig(
                name="Yoruba",
                direction="ltr",
                formality_default="formal",
                greeting="E kaabo",
                goodbye="O dabo"
            ),
            "ar": LanguageConfig(
                name="Arabic",
                direction="rtl",
                formality_default="formal",
                greeting="مرحبا",
                goodbye="وداعا"
            )
        }
        return configs.get(language, self.default_config)
```

### 2.3 Context Management

#### Conversation State
```python
class ContextEngine:
    """Maintains conversation and user context"""
    
    def __init__(self):
        self.redis_store = RedisSessionStore()
        self.user_profile = UserProfileManager()
        self.journey_tracker = JourneyTracker()
        self.knowledge_graph = Neo4jKnowledgeGraph()
        
    async def build_context(self, user_id: str, session_id: str) -> Context:
        # Get conversation history
        history = await self.redis_store.get_history(session_id)
        
        # Load user profile
        profile = await self.user_profile.get(user_id)
        
        # Current journey stage
        journey = await self.journey_tracker.get_stage(user_id)
        
        # Query knowledge graph for relevant info
        knowledge = await self.knowledge_graph.query_relevant(
            intent=self.extract_intent(history),
            user_role=profile.role,
            country=profile.country
        )
        
        # Get system states from MABA/KORA
        system_states = await self.get_system_states(user_id)
        
        # Build rich context
        return Context(
            conversation_history=history,
            user_profile=profile,
            journey_stage=journey,
            relevant_knowledge=knowledge,
            system_states=system_states,
            emotional_state=self.assess_emotional_state(history),
            task_progress=self.calculate_task_progress(journey),
            next_best_action=self.predict_next_action(history, journey),
            timestamp=datetime.now()
        )
    
    async def get_system_states(self, user_id: str) -> SystemStates:
        """Query MABA and KORA for current states"""
        maba_status = await self.query_maba(user_id)
        kora_status = await self.query_kora(user_id)
        
        return SystemStates(
            ingestion_status=maba_status.get("ingestion"),
            transformation_progress=maba_status.get("progress"),
            verification_status=kora_status.get("verification"),
            pending_actions=self.extract_pending_actions(maba_status, kora_status)
        )
```

### 2.4 Response Generation

#### Adaptive Response System
```python
class ResponseGenerator:
    """Generates contextual, helpful responses"""
    
    def __init__(self):
        self.llm = FineTunedGPT4("amani-gtcx-v1")
        self.template_engine = TemplateEngine()
        self.personalization = PersonalizationEngine()
        self.translation = TranslationEngine()
        
    async def generate_response(
        self,
        context: Context,
        intent: Intent
    ) -> Response:
        # Select response strategy based on context
        strategy = self.select_strategy(intent, context)
        
        # Get relevant templates
        templates = self.template_engine.get_templates(
            intent=intent,
            language=context.user_language,
            role=context.user_profile.role,
            country=context.user_profile.country
        )
        
        # Build prompt with context
        prompt = self.build_prompt(
            context=context,
            intent=intent,
            templates=templates,
            system_info=context.system_states
        )
        
        # Generate base response
        base_response = await self.llm.generate(
            prompt=prompt,
            temperature=self.get_temperature(strategy),
            max_tokens=self.get_max_tokens(context.channel)
        )
        
        # Personalize response
        personalized = self.personalization.adapt(
            response=base_response,
            user_profile=context.user_profile,
            cultural_context=context.cultural_markers,
            emotional_state=context.emotional_state,
            formality=context.formality_preference
        )
        
        # Add interactive elements
        with_actions = self.add_interactive_elements(
            response=personalized,
            available_actions=self.get_available_actions(context),
            channel=context.channel
        )
        
        # Translate to user's language
        final_response = await self.translation.translate(
            with_actions,
            target_language=context.user_language,
            formality_level=context.formality_preference,
            cultural_adaptation=True
        )
        
        # Add channel-specific formatting
        formatted = self.format_for_channel(
            final_response,
            context.channel
        )
        
        return formatted
    
    def format_for_channel(self, response: str, channel: Channel) -> Response:
        """Format response for specific channel"""
        match channel:
            case Channel.SMS:
                return self.format_for_sms(response)  # 160 chars
            case Channel.USSD:
                return self.format_for_ussd(response)  # Menu format
            case Channel.WHATSAPP:
                return self.format_for_whatsapp(response)  # Rich media
            case Channel.VOICE:
                return self.format_for_voice(response)  # SSML
            case _:
                return response
```

### 2.5 Offline Capabilities

#### USSD Implementation
```python
class USSDHandler:
    """Handles USSD sessions for feature phones"""
    
    def __init__(self):
        self.session_manager = USSDSessionManager()
        self.menu_builder = MenuBuilder()
        self.state_machine = USSDStateMachine()
        
    async def handle_ussd(
        self,
        session_id: str,
        service_code: str,
        phone_number: str,
        user_input: str
    ) -> str:
        # Get or create session
        session = await self.session_manager.get_or_create(
            session_id,
            phone_number
        )
        
        # Process input through state machine
        next_state = self.state_machine.transition(
            current_state=session.state,
            user_input=user_input
        )
        
        # Build menu for next state
        menu = self.menu_builder.build(
            state=next_state,
            language=session.language,
            max_length=160  # USSD character limit
        )
        
        # Update session
        await self.session_manager.update(
            session_id,
            state=next_state,
            last_activity=datetime.now()
        )
        
        return menu
    
    def build_menu(self, state: USSDState) -> str:
        """Build USSD menu within 160 character limit"""
        match state.type:
            case MenuType.MAIN:
                return """GTCX Services
1. Check Land Status
2. Start Verification  
3. Get Help
4. Change Language
0. Exit"""
            
            case MenuType.LAND_STATUS:
                return f"""Land Status:
Parcel: {state.parcel_id[:10]}
Status: {state.status}
1. Details
9. Back
0. Exit"""
            
            case MenuType.LANGUAGE:
                return """Select Language:
1. English
2. Swahili
3. French
4. Arabic
5. More
9. Back"""
```

#### SMS Handler
```python
class SMSHandler:
    """Handles SMS interactions"""
    
    def __init__(self):
        self.command_parser = CommandParser()
        self.natural_language = NaturalLanguageProcessor()
        self.message_splitter = MessageSplitter()
        
    async def handle_sms(self, sms: SMS) -> List[SMS]:
        # Parse command or natural language
        if self.is_command(sms.text):
            response = await self.handle_command(sms)
        else:
            response = await self.handle_natural_language(sms)
        
        # Split long messages
        if len(response) > 160:
            messages = self.split_message(response)
            return [SMS(text=msg, to=sms.from_number) for msg in messages]
        
        return [SMS(text=response, to=sms.from_number)]
    
    def split_message(self, text: str) -> List[str]:
        """Split into 160-character chunks intelligently"""
        parts = []
        current = ""
        
        for sentence in self.split_sentences(text):
            if len(current) + len(sentence) <= 155:  # Leave room for (1/2)
                current += sentence + " "
            else:
                parts.append(current.strip())
                current = sentence + " "
        
        if current:
            parts.append(current.strip())
        
        # Add part numbers
        if len(parts) > 1:
            return [f"({i+1}/{len(parts)}) {part}" 
                   for i, part in enumerate(parts)]
        
        return parts
```

### 2.6 Knowledge Graph

#### Neo4j Schema
```cypher
// Knowledge Graph Structure for Amani

// Core Entities
CREATE (r:Regulation {
    id: 'reg_001',
    title: 'Land Registration Act',
    country: 'KE',
    full_text: '...',
    summary: '...',
    keywords: ['registration', 'ownership', 'transfer'],
    language: 'en',
    last_updated: datetime()
})

CREATE (p:Procedure {
    id: 'proc_001',
    name: 'Title Deed Application',
    steps: ['Step 1...', 'Step 2...'],
    duration_days: 30,
    required_documents: ['ID', 'Survey Plan'],
    country: 'KE',
    language: 'en'
})

CREATE (f:FAQ {
    id: 'faq_001',
    question: 'How do I register my land?',
    answer: '...',
    language: 'en',
    views: 1523,
    helpful_count: 1245
})

CREATE (c:CommonIssue {
    id: 'issue_001',
    problem: 'Cannot find parcel number',
    solution: '...',
    frequency: 'high',
    resolution_time: '5 minutes'
})

// User Journey Patterns
CREATE (j:JourneyPattern {
    id: 'journey_001',
    user_type: 'farmer',
    goal: 'register_land',
    success_rate: 0.85,
    avg_time_minutes: 45,
    steps: ['verify_identity', 'locate_parcel', 'submit_docs']
})

// Relationships
CREATE (r)-[:REQUIRES]->(p)
CREATE (p)-[:ANSWERS]->(f)
CREATE (f)-[:RELATED_TO]->(f2:FAQ)
CREATE (c)-[:SOLVED_BY]->(p)
CREATE (j)-[:INCLUDES_PROCEDURE]->(p)

// Query for relevant knowledge
MATCH path = (u:User {id: $userId})-[:ASKS_ABOUT]->
              (topic:Topic)-[:RELATES_TO]->(knowledge)
WHERE knowledge:Regulation OR knowledge:Procedure OR knowledge:FAQ
RETURN knowledge
ORDER BY knowledge.relevance_score DESC
LIMIT 5
```

### 2.7 Learning & Adaptation

#### Success Path Learning
```python
class PathLearner:
    """Learns successful user journeys"""
    
    def __init__(self):
        self.journey_db = JourneyDatabase()
        self.ml_model = JourneySuccessPredictor()
        self.pattern_extractor = PatternExtractor()
        
    async def learn_from_journey(self, journey: UserJourney):
        # Only learn from successful journeys
        if journey.outcome != "success":
            return
            
        # Extract pattern from journey
        pattern = self.pattern_extractor.extract(journey)
        
        # Store successful pattern
        await self.journey_db.store_pattern(
            pattern=pattern,
            user_type=journey.user_type,
            context=journey.context,
            success_metrics=journey.metrics
        )
        
        # Update ML model
        await self.ml_model.train_on_success(journey)
        
        # Identify reusable components
        components = self.identify_reusable_components(pattern)
        await self.store_components(components)
        
        # Update knowledge graph
        await self.update_knowledge_graph(pattern)
    
    def predict_next_best_action(self, current_state: State) -> Action:
        """Predict what the user should do next"""
        # Find similar successful journeys
        similar = self.journey_db.find_similar(current_state)
        
        # Use ML to predict next action
        prediction = self.ml_model.predict_next(
            current_state=current_state,
            similar_journeys=similar
        )
        
        return Action(
            type=prediction.action_type,
            confidence=prediction.confidence,
            expected_outcome=prediction.outcome,
            alternatives=prediction.alternatives
        )
```

### 2.8 Proactive Assistance

#### Struggle Detection
```python
class ProactiveAssistant:
    """Detects and prevents user struggles"""
    
    def __init__(self):
        self.struggle_detector = StruggleDetector()
        self.intervention_engine = InterventionEngine()
        self.success_predictor = SuccessPredictor()
        
    async def monitor_user(self, user_id: str, session: Session):
        # Detect struggle patterns
        struggle_indicators = {
            "repeated_errors": session.error_count > 2,
            "long_pause": session.last_activity_gap > 60,
            "confusion_words": self.detect_confusion_language(session),
            "navigation_loops": self.detect_loops(session),
            "abandonment_risk": self.predict_abandonment(session)
        }
        
        if any(struggle_indicators.values()):
            # Determine intervention type
            intervention = self.intervention_engine.select_intervention(
                indicators=struggle_indicators,
                user_profile=session.user_profile,
                current_task=session.current_task
            )
            
            # Deliver proactive help
            await self.deliver_intervention(user_id, intervention)
    
    async def deliver_intervention(self, user_id: str, intervention: Intervention):
        """Deliver contextual help proactively"""
        match intervention.type:
            case InterventionType.GENTLE_HINT:
                message = "💡 Tip: " + intervention.content
            case InterventionType.STEP_BY_STEP:
                message = "Let me help you step by step:\n" + intervention.content
            case InterventionType.VIDEO_GUIDE:
                message = "Watch this quick guide: " + intervention.video_url
            case InterventionType.HUMAN_HANDOFF:
                message = "Let me connect you with an expert..."
                await self.initiate_human_handoff(user_id)
        
        await self.send_message(user_id, message)
```


## 3. Channel Specifications

### 3.1 WhatsApp Business API
```python
class WhatsAppHandler:
    """WhatsApp Business API integration"""
    
    async def handle_message(self, message: WhatsAppMessage):
        # Process different message types
        match message.type:
            case "text":
                return await self.handle_text(message)
            case "voice":
                return await self.handle_voice_note(message)
            case "image":
                return await self.handle_image(message)
            case "location":
                return await self.handle_location(message)
            case "document":
                return await self.handle_document(message)
            case "interactive":
                return await self.handle_interactive(message)
    
    def create_interactive_message(self, options: List[str]) -> InteractiveMessage:
        """Create WhatsApp interactive buttons/lists"""
        return InteractiveMessage(
            type="button",
            body={"text": "Please select an option:"},
            action={
                "buttons": [
                    {"type": "reply", "reply": {"id": f"opt_{i}", "title": opt}}
                    for i, opt in enumerate(options[:3])  # Max 3 buttons
                ]
            }
        )
```

### 3.2 Voice Interface
```python
class VoiceHandler:
    """Voice call interface using Twilio/Africa's Talking"""
    
    async def handle_call(self, call: VoiceCall):
        # Generate TwiML/SSML response
        response = VoiceResponse()
        
        # Greeting in user's language
        language = await self.get_user_language(call.from_number)
        greeting = self.get_greeting(language)
        
        response.say(greeting, voice="alice", language=language)
        
        # Gather user input
        gather = response.gather(
            input="speech",
            timeout=3,
            language=language,
            action="/process-voice"
        )
        
        gather.say("How can I help you today?")
        
        return str(response)
```


## 4. Performance Optimization

### 4.1 Caching Strategy
```yaml
caching:
  conversation_cache:
    store: Redis
    ttl: 24_hours
    max_size: 10MB_per_user
    
  knowledge_cache:
    store: Redis
    ttl: 1_hour
    invalidation: on_knowledge_update
    
  translation_cache:
    store: Local_LRU
    max_entries: 10000
    ttl: 7_days
    
  response_cache:
    store: CDN
    ttl: 5_minutes
    vary_by: [language, user_role, country]
    
  offline_cache:
    store: Device_local
    size: 50MB
    sync: on_connection
```

### 4.2 Response Time Optimization
```python
class PerformanceOptimizer:
    """Optimize response times"""
    
    async def optimize_response(self, request: Request) -> Response:
        # Check cache first
        if cached := await self.cache.get(request.cache_key):
            return cached
        
        # Use progressive response
        initial_response = await self.generate_quick_response(request)
        await self.send_immediate(initial_response)
        
        # Generate full response in background
        full_response = await self.generate_full_response(request)
        await self.send_update(full_response)
        
        # Cache for future
        await self.cache.set(request.cache_key, full_response)
        
        return full_response
```


## 5. Monitoring & Analytics

### 5.1 Conversation Metrics
```python
class ConversationAnalytics:
    """Track conversation quality and success"""
    
    metrics = {
        "task_completion_rate": "% of users achieving goal",
        "conversation_length": "Average messages to resolution",
        "satisfaction_score": "CSAT rating (1-5)",
        "language_distribution": "Usage by language",
        "channel_distribution": "Usage by channel",
        "dropout_points": "Where users abandon",
        "confusion_patterns": "Common misunderstandings",
        "escalation_rate": "% requiring human help",
        "response_time": "Time to first response",
        "resolution_time": "Total time to resolve issue"
    }
    
    async def track_conversation(self, conversation: Conversation):
        # Calculate metrics
        metrics = {
            "duration": conversation.end_time - conversation.start_time,
            "message_count": len(conversation.messages),
            "task_completed": conversation.goal_achieved,
            "satisfaction": conversation.user_rating,
            "language": conversation.language,
            "channel": conversation.channel
        }
        
        # Store in analytics database
        await self.store_metrics(metrics)
        
        # Update real-time dashboards
        await self.update_dashboard(metrics)
```

### 5.2 Learning Metrics
```yaml
learning_metrics:
  model_performance:
    - intent_accuracy: 95%
    - language_detection: 98%
    - sentiment_accuracy: 88%
    
  adaptation_metrics:
    - new_patterns_learned: 150/day
    - knowledge_graph_growth: 5%/month
    - success_rate_improvement: 2%/week
    
  user_satisfaction:
    - nps_score: 72
    - csat_score: 4.2/5
    - resolution_rate: 85%
```


## 6. Security & Privacy

### 6.1 Data Protection
```python
class PrivacyManager:
    """Manage user privacy and data protection"""
    
    def anonymize_conversation(self, conversation: Conversation) -> Conversation:
        """Remove PII from conversations for training"""
        anonymized = conversation.copy()
        
        # Remove personal identifiers
        anonymized.user_id = self.hash_user_id(conversation.user_id)
        anonymized.phone_number = None
        anonymized.name = None
        
        # Redact PII from messages
        for message in anonymized.messages:
            message.text = self.redact_pii(message.text)
        
        return anonymized
    
    def redact_pii(self, text: str) -> str:
        """Redact personally identifiable information"""
        # Phone numbers
        text = re.sub(r'\b\d{10,}\b', '[PHONE]', text)
        # Email addresses
        text = re.sub(r'\S+@\S+', '[EMAIL]', text)
        # ID numbers
        text = re.sub(r'\b\d{8,}\b', '[ID]', text)
        
        return text
```


## 7. Deployment Architecture

### 7.1 Container Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amani-guidance-layer
  namespace: gtcx-core
spec:
  replicas: 5
  selector:
    matchLabels:
      app: amani
  template:
    metadata:
      labels:
        app: amani
    spec:
      containers:
      - name: amani-api
        image: gtcx/amani:v1.0.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            memory: "8Gi"
            cpu: "4"
          limits:
            memory: "16Gi"
            cpu: "8"
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: amani-secrets
              key: openai-key
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: amani-secrets
              key: redis-url
```

### 7.2 Edge Deployment
```yaml
edge_deployment:
  offline_models:
    - llama3_quantized: 4GB
    - whisper_tiny: 39MB
    - nllb_subset: 2GB
    
  local_storage:
    - knowledge_base: 500MB
    - conversation_cache: 100MB
    - user_profiles: 50MB
    
  sync_strategy:
    - incremental_updates: daily
    - full_sync: weekly
    - priority_sync: critical_updates
```


## Appendix A: Language Support

| Tier | Languages | Coverage | Offline |
|------|-----------|----------|---------|
| 1 | English, French, Arabic, Portuguese, Swahili | Full | Yes |
| 2 | Hausa, Yoruba, Igbo, Amharic, Zulu | Full | Yes |
| 3 | 50+ regional languages | Partial | Limited |
| 4 | 140+ additional languages | Basic | No |


## Appendix B: Channel Comparison

| Channel | Cost | Reach | Features | Limitations |
|---------|------|-------|----------|-------------|
| Web Chat | Low | Medium | Rich UI | Needs internet |
| WhatsApp | Low | High | Media, buttons | Smartphone required |
| SMS | Medium | Highest | Universal | 160 chars |
| USSD | Low | Highest | No internet | Menu-based |
| Voice | High | High | Natural | Cost, quality |


**Document Status**: Technical specification for implementation  
**Review Cycle**: Every sprint  
**Approval**: Chief Experience Officer & Chief Technology Officer
