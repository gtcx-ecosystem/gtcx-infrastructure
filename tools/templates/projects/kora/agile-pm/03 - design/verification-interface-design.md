# KORA - Verification Interface Design

**Version**: 1.0.0  
**Last Updated**: November 15, 2024  
**Status**: In Development  


## 1. Design Philosophy

### Trust-First Design
- **Transparency**: Show verification sources and confidence
- **Clarity**: Make complex proofs understandable
- **Authority**: Convey trust and reliability
- **Accessibility**: Work across all devices and contexts
- **Security**: Visible security indicators


## 2. Visual Identity

### 2.1 Color System
```css
:root {
  /* Trust Colors */
  --verified-green: #059669;
  --pending-amber: #D97706;
  --disputed-red: #DC2626;
  --trusted-blue: #2563EB;
  
  /* Confidence Levels */
  --high-confidence: #10B981;
  --medium-confidence: #F59E0B;
  --low-confidence: #EF4444;
  
  /* Neutrals */
  --slate-900: #0F172A;
  --slate-100: #F1F5F9;
}
```

### 2.2 Trust Indicators
```
✓ Verified     - Green checkmark with shield
⚠ Pending      - Amber warning triangle
✗ Failed       - Red X with alert
🔒 Secured     - Lock icon for encrypted
🔍 Under Review - Magnifying glass
```


## 3. Verification Dashboard

### 3.1 Main Interface
```
┌────────────────────────────────────────────────────────┐
│  KORA Verification Oracle          [🔔] [Help] [User]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Verification Status Overview                    │  │
│  │                                                  │  │
│  │  ✓ Verified: 1,234    ⚠ Pending: 56            │  │
│  │  ✗ Failed: 12         🔍 Disputed: 3           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Recent Verifications                           │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ Parcel #12345    ✓ Verified    95% ▓▓▓▓▓ │ │  │
│  │  │ Sources: Gov ✓ Community ✓ Satellite ✓    │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ Parcel #12346    ⚠ Pending     72% ▓▓▓░░ │ │  │
│  │  │ Sources: Gov ✓ Community ⚠ Satellite ✓    │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 3.2 Verification Details View
```
┌────────────────────────────────────────────────────────┐
│  Verification Details - Parcel #12345                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Confidence Score: ████████░░ 85%                      │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Verification Sources                           │  │
│  │                                                  │  │
│  │  ✓ Government Registry      [100%] ▓▓▓▓▓▓▓▓▓▓ │  │
│  │  ✓ Community Validation     [85%]  ▓▓▓▓▓▓▓▓░░ │  │
│  │  ✓ Satellite Imagery        [90%]  ▓▓▓▓▓▓▓▓▓░ │  │
│  │  ⚠ Field Verification       [60%]  ▓▓▓▓▓▓░░░░ │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Cryptographic Proof                            │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ [QR CODE]  Merkle Root: 0x7f3a...9b2c    │ │  │
│  │  │            Signatures: 3/5                 │ │  │
│  │  │            Valid Until: Dec 31, 2025      │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │  [Download Proof] [Share] [Verify]             │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```


## 4. Mobile Experience

### 4.1 Mobile Verification View
```
┌─────────────────┐
│ KORA  [≡]       │
├─────────────────┤
│                 │
│ Parcel #12345   │
│                 │
│ ✓ VERIFIED      │
│ ████████░░ 85%  │
│                 │
│ Sources:        │
│ ✓ Government    │
│ ✓ Community     │
│ ✓ Satellite     │
│                 │
│ [View Proof]    │
│ [Share]         │
└─────────────────┘
```

### 4.2 QR Code Verification
- Scannable QR codes for offline verification
- Embedded proof data
- Works without internet
- Visual confirmation


## 5. Dispute Resolution Interface

### 5.1 Dispute Filing
```
┌────────────────────────────────────────────────────────┐
│  File Dispute - Parcel #12345                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Dispute Type:                                         │
│  ○ Ownership claim                                     │
│  ● Boundary dispute                                    │
│  ○ Document authenticity                               │
│  ○ Other                                               │
│                                                         │
│  Evidence Upload:                                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 📎 land_deed.pdf (2.3 MB)                       │  │
│  │ 📎 survey_map.jpg (1.1 MB)                      │  │
│  │ [+ Add More Evidence]                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  Description:                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ The eastern boundary extends 10m beyond...      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  [Submit Dispute] [Save Draft]                         │
└────────────────────────────────────────────────────────┘
```


## 6. Trust Visualization

### 6.1 Confidence Meter
```
Low    Medium    High    Verified
│───────┼────────┼────────│
        ▲
       72%
```

### 6.2 Source Verification Matrix
```
         Gov  Comm  Sat  Field
Parcel A  ✓    ✓    ✓    ✓    [100%]
Parcel B  ✓    ✓    ✓    ⚠    [85%]
Parcel C  ✓    ⚠    ✓    ✗    [60%]
Parcel D  ✗    ✗    ✗    ✗    [0%]
```


## 7. Animation & Feedback

### 7.1 Loading States
```javascript
// Verification in progress animation
const VerificationLoader = () => (
  <div className="verification-loader">
    <div className="pulse-ring"></div>
    <div className="status-text">
      Verifying with {currentSource}...
    </div>
    <div className="progress-bar">
      <div className="progress-fill" style={{width: `${progress}%`}}/>
    </div>
  </div>
);
```

### 7.2 Success/Error States
```css
@keyframes success-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

.verification-success {
  animation: success-pulse 0.5s ease;
  color: var(--verified-green);
}
```


## 8. Accessibility Features

### 8.1 Screen Reader Support
```html
<div role="status" aria-live="polite">
  <span class="sr-only">
    Verification complete. Confidence: 85 percent. 
    3 of 4 sources confirmed.
  </span>
</div>
```

### 8.2 Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate
- Escape to cancel
- Arrow keys for navigation


## 9. Federation Interface

### 9.1 Cross-Border Verification
```
┌────────────────────────────────────────────────────────┐
│  Cross-Border Verification Request                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  From: 🇰🇪 Kenya Registry                              │
│  To:   🇹🇿 Tanzania Registry                          │
│                                                         │
│  Status: ⚠ Pending Federation Response                 │
│                                                         │
│  Trust Level: ████████░░ 80%                          │
│  Previous Verifications: 156                           │
│  Success Rate: 94%                                     │
│                                                         │
│  [View Details] [Contact Partner]                      │
└────────────────────────────────────────────────────────┘
```


## 10. Error Handling UI

### 10.1 Error Messages
```yaml
Errors:
  Connection_Lost:
    icon: "🔌"
    message: "Connection lost. Retrying..."
    action: "Retry Now"
  
  Verification_Failed:
    icon: "❌"
    message: "Verification failed. Multiple sources unavailable."
    action: "Try Alternative Sources"
  
  Timeout:
    icon: "⏱️"
    message: "Verification taking longer than expected."
    action: "Continue Waiting / Cancel"
```


**Document Status**: Design specification  
**Review Cycle**: Every sprint  
**Approval**: UX Design Lead
