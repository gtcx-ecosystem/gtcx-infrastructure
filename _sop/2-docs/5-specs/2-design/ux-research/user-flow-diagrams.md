# User Flow Diagrams

> End-to-end journey maps for [Organization Name]'s key user flows.

---

## How to Read These Diagrams

```
[Trigger / Entry Point]
        ↓
[Step] → [Decision?] → Yes → [Step]
                    → No  → [Alternative step]
        ↓
[Outcome]
```

Symbols:

- `[ ]` — Screen or action
- `< >` — Decision / branch
- `( )` — System action (automated)
- `→` — Happy path
- `⚠` — Error or edge case

---

## Flow 1: [Flow Name — e.g., New User Onboarding]

**Persona**: [Primary persona]
**Entry point**: [How user arrives]
**Success outcome**: [What done looks like]

```
[Entry: Landing page / referral / direct]
        ↓
[Sign up form]
        ↓
(Send verification email)
        ↓
[Verify email]
        ↓
<Profile setup required?>
    Yes → [Profile setup wizard]
            ↓
           [Step 1: [Details]]
            ↓
           [Step 2: [Preferences]]
            ↓
    No  → [Skip to home]
        ↓
[Home / Dashboard]
(Trigger: welcome tour)
        ↓
[First core action]
        ↓
✓ Onboarding complete
```

**Error states**:

- Email already registered → "Sign in instead" prompt
- Verification email not received → Resend option
- Profile setup abandoned → Resume prompt on next login

---

## Flow 2: [Flow Name — e.g., Subscribe]

**Persona**: [Primary persona]
**Entry point**: [Paywall / upgrade prompt / pricing page]
**Success outcome**: [Subscription active, user accessing paid content]

```
[Upgrade prompt / pricing page]
        ↓
<Already signed in?>
    No  → [Sign up or sign in]
    Yes → Continue
        ↓
[Plan selection]
        ↓
[Payment form]
        ↓
(Process payment via [payment provider])
        ↓
<Payment successful?>
    Yes → (Activate subscription)
           ↓
           [Confirmation screen]
           (Send receipt email)
           ↓
           [Access granted → return to origin]
    No  → [Payment error — retry or alternative payment]
```

**Error states**:

- Card declined → Show error, offer alternative methods
- Network failure mid-checkout → Resume from last saved state

---

## Flow 3: [Flow Name — e.g., Core Workflow]

**Persona**: [Primary persona]
**Entry point**: [How triggered — alert, scheduled, manual]
**Success outcome**: [What done looks like]

```
[Trigger]
        ↓
[Screen A]
        ↓
[Action / interaction]
        ↓
[Screen B]
        ↓
✓ [Success state]
```

---

## Flow 4: [Flow Name — e.g., Alert Received → Action Taken]

**Persona**: [Primary persona]
**Entry point**: [Push notification / email / in-app]
**Success outcome**: [User has taken relevant action]

```
[Notification received]
        ↓
<User clicks/taps?>
    Yes → [Deeplink to content]
    No  → [Notification dismissed — end of flow]
        ↓
[Content detail screen]
        ↓
<Action available?>
    Yes → [Take action]
           (Record engagement)
           ↓
           [Confirmation / result]
    No  → [Read-only view]
```

---

## Edge Cases and Failure Flows

| Flow       | Edge Case              | Handling                                         |
| ---------- | ---------------------- | ------------------------------------------------ |
| [Flow 1]   | [Edge case]            | [How system responds]                            |
| [Flow 2]   | [Edge case]            | [Response]                                       |
| [Any flow] | No internet connection | [Offline state / cached content / queue action]  |
| [Any flow] | Session expired        | [Re-auth prompt, return to original destination] |

---

_Flow diagrams are updated when core user journeys change. Last reviewed: {YYYY-MM-DD}._
