---
title: 'GTCX USSD Protocol Specification'
status: 'draft'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['ussd', 'mobile', 'global-south', 'offline', 'resilience', 'protocol']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# GTCX USSD Protocol Specification

**Version:** 1.0.0-draft  
**Status:** Specification — implementation pending M3  
**Scope:** Mobile network operator (MNO) integration for feature-phone and low-bandwidth access

---

## 1. Problem Statement

In target African markets, **60–80% of mobile subscribers use feature phones** without data connectivity. USSD (_Unstructured Supplementary Service Data_) is the dominant interactive channel for:

- Mobile money (M-Pesa, EcoCash, Orange Money)
- Balance inquiries
- Airtime purchase
- Agricultural commodity price checks

GTCX must support USSD as a **first-class protocol** to achieve universal financial inclusion.

---

## 2. Design Principles

1. **Work on any GSM phone** — No app installation. No data plan. No smartphone.
2. **Offline-first session state** — USSD sessions are stateless at the MNO level. GTCX maintains session context server-side.
3. **Cryptographic security without TLS** — USSD rides on SS7/SIGTRAN, not IP. End-to-end security uses PIN + HMAC-SHA256.
4. **Degrade gracefully** — If the GTCX backend is unreachable, the MNO gateway returns a cached menu or a retry instruction.

---

## 3. Protocol Overview

```
User → GSM Feature Phone → MNO USSD Gateway → GTCX USSD Handler → GTCX Core API
                ↑___________________________________________↓
                           (session state + replay protection)
```

### 3.1 Session Lifecycle

| Phase                  | Duration | State Location                   |
| ---------------------- | -------- | -------------------------------- |
| Initiation             | < 2s     | MNO gateway                      |
| Menu Navigation        | 30–120s  | GTCX USSD Handler (Redis-backed) |
| Transaction Submission | < 5s     | GTCX Core API                    |
| Confirmation           | < 2s     | MNO gateway → SMS fallback       |

### 3.2 Message Format

USSD strings are limited to **182 characters** (GSM 7-bit encoding). GTCX uses a compact tokenized format:

```
*384*<menu-code>*<param-1>*<param-2>*<pin>#`
```

**Example flows:**

```
# Check commodity price
*384*1*ZW*maize# → "Maize (ZW): $285/tonne. Trend: +2.3%"

# Initiate trade
*384*2*ZW*maize*10*1234# → "Trade T-8291 initiated. 10t maize @ $285. Confirm? 1=Yes 0=No"

# Confirm trade
*384*2*8291*1*1234# → "Trade T-8291 confirmed. SMS receipt sent."
```

---

## 4. Security Model

### 4.1 Authentication

- **PIN:** 4–6 digit numeric PIN set during account registration (via agent or mobile app)
- **HMAC:** Each USSD request includes a truncated HMAC-SHA256 of the payload, keyed by a per-device secret shared during registration
- **Nonce:** 6-digit rolling counter prevents replay attacks (feature phones lack reliable clocks)

### 4.2 Replay Protection

The GTCX replay guard (`03-platform/tools/replay-protection`) is adapted for USSD:

- **Window:** 60 seconds (USSD sessions are short-lived)
- **Nonce source:** MNO gateway timestamp + rolling counter
- **Store:** Redis nonce store shared with HTTP API

### 4.3 PIN Security

- PINs are **never stored in plaintext**. Only Argon2id hashes are retained.
- After 3 failed PIN attempts, the USSD channel is locked for 15 minutes.
- PIN reset requires out-of-band verification (agent visit or registered mobile app).

---

## 5. Menu Architecture

### 5.1 Top-Level Menu

```
Welcome to GTCX
1. Prices
2. Trade
3. Wallet
4. History
5. Help
0. Exit
```

### 5.2 Sub-Menus

**Prices (1):**

```
Select country:
1. Zimbabwe
2. Zambia
3. Kenya
4. Nigeria
0. Back
```

**Trade (2):**

```
Select action:
1. Sell commodity
2. Buy commodity
3. Check trade status
0. Back
```

### 5.3 Menu Localization

Menus are served in the user's preferred language based on:

1. MNO country code (default)
2. User profile override (set during registration)
3. Agent configuration (for shared/community phones)

Supported languages at launch: **English, Shona, Ndebele, Swahili, Zulu, French**.

---

## 6. Backend Architecture

### 6.1 USSD Handler Service

```yaml
# 04-ship/kubernetes/base/services/ussd-handler.yaml (planned)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gtcx-ussd-handler
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: handler
          image: gtcx/ussd-handler:VERSION
          env:
            - name: REDIS_URL
              valueFrom: { secretKeyRef: { name: gtcx-redis, key: url } }
            - name: USSD_SESSION_TTL_SECONDS
              value: '120'
```

### 6.2 MNO Gateway Integration

| MNO               | Gateway Protocol       | Status  |
| ----------------- | ---------------------- | ------- |
| Econet (Zimbabwe) | HTTP POST (XML)        | Planned |
| MTN (Zambia)      | SMPP + HTTP            | Planned |
| Safaricom (Kenya) | M-Pesa API + USSD Push | Planned |
| Airtel (Nigeria)  | HTTP REST              | Planned |

### 6.3 Session State

Redis hash per session:

```
HSET ussd:session:<session-id> \
  phone "+263771234567" \
  menu-stack "[1,2]" \
  pin-attempts 0 \
  last-active <timestamp>
```

TTL: 120 seconds (auto-expire after inactivity).

---

## 7. Error Handling

| Error Scenario      | User Message                                                      | Backend Action                       |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------ |
| Invalid PIN         | "Incorrect PIN. 2 attempts remaining."                            | Increment counter in Redis           |
| Session expired     | "Session timed out. Dial \*384# to restart."                      | Delete Redis session key             |
| Backend unreachable | "Service temporarily unavailable. Please try again in 5 minutes." | Return cached static menu; alert SRE |
| Invalid menu code   | "Invalid selection. Please try again."                            | Replay current menu                  |
| Replay detected     | "Security alert. Dial \*384# to continue."                        | Log to Security Hub; lock channel    |

---

## 8. Acceptance Criteria

- [ ] USSD handler deploys to staging and passes load test (100 concurrent sessions)
- [ ] Econet Zimbabwe integration tested in sandbox
- [ ] PIN lockout after 3 failed attempts verified
- [ ] Replay protection passes chaos test (injected duplicate requests rejected)
- [ ] Menu renders in all 6 launch languages
- [ ] SMS fallback delivers confirmation within 10 seconds
- [ ] Session state auto-expires after 120s of inactivity

---

## 9. References

- [GSMA USSD Specification](https://www.gsma.com/)
- [M-Pesa API Documentation](https://developer.safaricom.co.ke/)
- [GTCX Resilience Framework](../specs/resilience-framework.md)
- [GTCX Replay Guard Model Card](../governance/model-cards/replay-guard-model-card.md)
- [GTCX Low-Bandwidth Mode](../engineering/low-bandwidth-mode.md)
