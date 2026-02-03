# AMANI - Frontend Conversational Interface

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Tech Stack**: React, TypeScript, WebRTC  


## 1. Technology Stack

```yaml
Framework: React 18.2
Language: TypeScript 5.0
State: Zustand
Styling: Tailwind CSS + HeadlessUI
Chat: Socket.io
Voice: WebRTC + Web Audio API
Mobile: React Native
PWA: Workbox
Localization: i18next
```

## 2. Multi-Channel Architecture

```
src/
├── channels/
│   ├── web/              # Web chat interface
│   ├── whatsapp/         # WhatsApp Business integration
│   ├── ussd/             # USSD simulator
│   ├── sms/              # SMS gateway
│   └── voice/            # Voice interface
├── components/
│   ├── chat/             # Chat components
│   ├── voice/            # Voice components
│   ├── language/         # Language switcher
│   └── shared/           # Shared components
├── contexts/
│   ├── conversation/     # Conversation state
│   ├── language/         # Language context
│   └── user/            # User context
└── hooks/
    ├── useChat/         # Chat functionality
    ├── useVoice/        # Voice features
    └── useTranslation/  # Multi-language
```

## 3. Chat Interface Component

```tsx
interface ChatInterfaceProps {
  userId: string;
  language: Language;
  channel: Channel;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  language,
  channel
}) => {
  const { messages, sendMessage, isTyping } = useChat(userId);
  const { t } = useTranslation(language);
  const [input, setInput] = useState('');
  
  return (
    <ChatContainer>
      <ChatHeader>
        <Avatar src="/amani-avatar.png" />
        <Title>{t('chat.title')}</Title>
        <LanguageSelector 
          current={language}
          onChange={handleLanguageChange}
        />
      </ChatHeader>
      
      <MessageList>
        {messages.map(message => (
          <Message 
            key={message.id}
            message={message}
            isUser={message.sender === 'user'}
          />
        ))}
        {isTyping && <TypingIndicator />}
      </MessageList>
      
      <InputArea>
        <SuggestedActions 
          actions={getCurrentSuggestions()}
          onSelect={handleActionSelect}
        />
        
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => {
            sendMessage(input);
            setInput('');
          }}
          placeholder={t('chat.placeholder')}
        />
        
        <VoiceButton onRecord={handleVoiceInput} />
      </InputArea>
    </ChatContainer>
  );
};
```

## 4. Voice Interface

```tsx
export const VoiceInterface: React.FC = () => {
  const { startRecording, stopRecording, isRecording } = useVoiceRecorder();
  const { playResponse } = useTextToSpeech();
  const [transcript, setTranscript] = useState('');
  
  // Web Speech API for voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = getCurrentLanguage();
      
      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1];
        setTranscript(result[0].transcript);
        
        if (result.isFinal) {
          processVoiceCommand(result[0].transcript);
        }
      };
      
      if (isRecording) {
        recognition.start();
      } else {
        recognition.stop();
      }
      
      return () => recognition.stop();
    }
  }, [isRecording]);
  
  return (
    <VoiceContainer>
      <WaveformVisualizer isActive={isRecording} />
      
      <VoiceButton
        isRecording={isRecording}
        onPress={isRecording ? stopRecording : startRecording}
      />
      
      <TranscriptDisplay>{transcript}</TranscriptDisplay>
      
      <VoiceSettings>
        <SpeedControl />
        <VoiceSelector />
        <VolumeControl />
      </VoiceSettings>
    </VoiceContainer>
  );
};
```

## 5. USSD Simulator

```tsx
export const USSDSimulator: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [currentMenu, setCurrentMenu] = useState<USSDMenu>();
  const [input, setInput] = useState('');
  
  const handleUSSDInput = (value: string) => {
    // Simulate USSD interaction
    const response = processUSSDInput(value, currentMenu);
    
    if (response.type === 'CON') {
      // Continue session
      setCurrentMenu(response.menu);
    } else if (response.type === 'END') {
      // End session
      setSessionActive(false);
      showCompletionMessage(response.message);
    }
  };
  
  return (
    <PhoneSimulator>
      <PhoneScreen>
        {!sessionActive ? (
          <DialPad>
            <Display>{phoneNumber}</Display>
            <NumberPad onPress={setPhoneNumber} />
            <CallButton 
              onPress={() => {
                if (phoneNumber === '*384#') {
                  setSessionActive(true);
                  initializeUSSDSession();
                }
              }}
            />
          </DialPad>
        ) : (
          <USSDDisplay>
            <MenuText>{currentMenu?.text}</MenuText>
            <USSDInput 
              value={input}
              onChange={setInput}
              onSubmit={handleUSSDInput}
            />
            <KeypadHint>Reply with number (1-9)</KeypadHint>
          </USSDDisplay>
        )}
      </PhoneScreen>
    </PhoneSimulator>
  );
};
```

## 6. Multi-Language Support

```typescript
// Language configuration
export const languages = {
  en: { name: 'English', rtl: false },
  sw: { name: 'Kiswahili', rtl: false },
  ar: { name: 'العربية', rtl: true },
  fr: { name: 'Français', rtl: false },
  pt: { name: 'Português', rtl: false },
  am: { name: 'አማርኛ', rtl: false },
  ha: { name: 'Hausa', rtl: false },
  yo: { name: 'Yorùbá', rtl: false },
  ig: { name: 'Igbo', rtl: false },
  zu: { name: 'isiZulu', rtl: false }
};

// Dynamic language loading
export const LanguageProvider: React.FC = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  
  useEffect(() => {
    // Dynamically load language file
    import(`./locales/${language}.json`)
      .then(module => setTranslations(module.default))
      .catch(() => setTranslations({}));
  }, [language]);
  
  // Apply RTL if needed
  useEffect(() => {
    document.dir = languages[language].rtl ? 'rtl' : 'ltr';
  }, [language]);
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t: (key) => translations[key] || key 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

## 7. Progressive Web App

```javascript
// Service worker for offline support
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('amani-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/assets/chat-ui.js',
        '/assets/styles.css',
        '/locales/en.json',
        '/locales/sw.json'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache first, network fallback
      return response || fetch(event.request).catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});
```

## 8. WhatsApp Integration UI

```tsx
export const WhatsAppInterface: React.FC = () => {
  const { connected, messages, sendMessage } = useWhatsAppBusiness();
  
  return (
    <WhatsAppContainer>
      <StatusBar connected={connected} />
      
      <ChatWindow>
        {messages.map(msg => (
          <WhatsAppMessage
            key={msg.id}
            message={msg}
            status={msg.status} // sent, delivered, read
          />
        ))}
      </ChatWindow>
      
      <QuickReplies>
        {quickReplies.map(reply => (
          <QuickReplyButton
            key={reply.id}
            onClick={() => sendMessage(reply.text)}
          >
            {reply.label}
          </QuickReplyButton>
        ))}
      </QuickReplies>
      
      <MediaUpload 
        accept="image/*,application/pdf"
        onUpload={handleMediaUpload}
      />
    </WhatsAppContainer>
  );
};
```

## 9. Accessibility Features

```tsx
// Screen reader support
export const AccessibleChat: React.FC = () => {
  const { messages } = useChat();
  const lastMessage = messages[messages.length - 1];
  
  return (
    <div role="main" aria-label="Chat conversation">
      <div 
        role="log" 
        aria-live="polite" 
        aria-relevant="additions"
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            role="article"
            aria-label={`Message from ${msg.sender}`}
          >
            <span className="sr-only">
              {msg.sender} says:
            </span>
            {msg.text}
            <span className="sr-only">
              at {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}
      </div>
      
      <div aria-live="assertive" className="sr-only">
        {lastMessage && `New message: ${lastMessage.text}`}
      </div>
    </div>
  );
};
```

## 10. Journey Visualization

```tsx
export const UserJourney: React.FC = () => {
  const { currentStage, completedStages, nextSteps } = useJourney();
  
  return (
    <JourneyContainer>
      <ProgressBar 
        value={completedStages.length}
        max={totalStages}
      />
      
      <StageIndicator>
        {stages.map((stage, index) => (
          <Stage
            key={stage.id}
            completed={completedStages.includes(stage.id)}
            current={currentStage === stage.id}
            locked={index > completedStages.length}
          >
            <StageIcon type={stage.icon} />
            <StageLabel>{stage.label}</StageLabel>
          </Stage>
        ))}
      </StageIndicator>
      
      <NextSteps>
        <h3>Next Steps</h3>
        {nextSteps.map(step => (
          <Step key={step.id}>
            <StepNumber>{step.number}</StepNumber>
            <StepDescription>{step.description}</StepDescription>
            <StepAction onClick={() => navigateToStep(step)}>
              {step.actionLabel}
            </StepAction>
          </Step>
        ))}
      </NextSteps>
    </JourneyContainer>
  );
};
```

## 11. Performance Optimization

```typescript
// Message virtualization for long conversations
const VirtualizedChat = () => {
  const { messages } = useChat();
  const listRef = useRef<VariableSizeList>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    listRef.current?.scrollToItem(messages.length - 1, 'end');
  }, [messages.length]);
  
  const getItemSize = (index: number) => {
    // Calculate dynamic height based on message content
    const message = messages[index];
    const baseHeight = 60;
    const textLines = Math.ceil(message.text.length / 50);
    return baseHeight + (textLines * 20);
  };
  
  return (
    <VariableSizeList
      ref={listRef}
      height={600}
      itemCount={messages.length}
      itemSize={getItemSize}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <Message message={messages[index]} />
        </div>
      )}
    </VariableSizeList>
  );
};

// Lazy load language files
const loadLanguage = async (lang: string) => {
  const module = await import(
    /* webpackChunkName: "lang-[request]" */
    `./locales/${lang}.json`
  );
  return module.default;
};
```


**Document Status**: Frontend specification  
**Framework**: React with TypeScript  
**Review Cycle**: Every sprint  
**Owner**: Frontend Team Lead
