---
title: 'Accounting Policies'
status: 'current'
date: '2026-05-27'
owner: 'cfo'
role: 'cfo'
tier: 'critical'
tags: ['financial', 'accounting', 'gaap', 'ifrs', 'investment-grade']
review_cycle: 'annual'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Accounting Policies

**Document ID:** GTCX-ACC-001  
**Version:** 1.0  
**Effective Date:** 2026-05-25  
**Reporting Framework:** IFRS (primary), SA GAAP (supplementary for local statutory)  
**Functional Currency:** USD (reporting), ZAR (operational)  
**Financial Year End:** 31 December

---

## 1. Basis of Preparation

Financial statements are prepared on a going-concern basis under IFRS, using the accrual basis of accounting. All amounts are presented in USD unless otherwise stated.

## 2. Revenue Recognition

| Revenue Stream            | Recognition Criteria                                    | Timing                |
| ------------------------- | ------------------------------------------------------- | --------------------- |
| **Transaction fees**      | Performance obligation satisfied (settlement confirmed) | Point-in-time         |
| **SaaS subscription**     | Service rendered over subscription period               | Over time (monthly)   |
| **API usage**             | API call completed and metered                          | Point-in-time         |
| **Professional services** | Milestone achieved per SOW                              | Over time / milestone |
| **Interest income**       | Time-based accrual                                      | Over time             |

## 3. Expense Recognition

| Expense Category         | Recognition Policy                                                    |
| ------------------------ | --------------------------------------------------------------------- |
| **Personnel costs**      | Accrued monthly; bonus provisions at year-end based on performance    |
| **Cloud infrastructure** | Recognized as incurred (AWS consumption basis)                        |
| **Pen-test / audit**     | Amortized over 12 months if multi-year engagement; otherwise expensed |
| **Marketing**            | Expensed as incurred                                                  |
| **Travel**               | Expensed when incurred; per diem limits per expense policy            |

## 4. Asset Policies

### 4.1 Fixed Assets

| Category                | Capitalization Threshold | Depreciation Method | Useful Life |
| ----------------------- | ------------------------ | ------------------- | ----------- |
| Computer equipment      | $1,000                   | Straight-line       | 3 years     |
| Software (internal use) | $5,000                   | Straight-line       | 3–5 years   |
| Leasehold improvements  | $2,500                   | Straight-line       | Lease term  |

### 4.2 Intangible Assets

| Category                      | Recognition                                                      | Amortization                                                 |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Capitalized development costs | Technical feasibility + intent to complete + ability to use/sell | Straight-line over useful life (3–5 years)                   |
| Software licenses             | Purchase price + directly attributable costs                     | Straight-line over license term                              |
| Domain names / trademarks     | Registration costs                                               | Not amortized (indefinite life) subject to annual impairment |

### 4.3 Financial Instruments

| Instrument                 | Classification | Measurement                      |
| -------------------------- | -------------- | -------------------------------- |
| Cash and cash equivalents  | Amortized cost | Face value                       |
| Trade receivables          | Amortized cost | Expected credit loss (ECL) model |
| Trade payables             | Amortized cost | Face value                       |
| Equity investments (< 20%) | FVOCI or FVTPL | Fair value                       |

## 5. Related-Party Transactions

All transactions with related parties (directors, significant shareholders, key management personnel, and their close family members) are:

1. Recorded at arm's length terms.
2. Disclosed in the financial statements (nature, amount, terms).
3. Approved by the Board (excluding the interested director).
4. Documented in the related-party transaction register.

## 6. Foreign Currency

| Item                     | Policy                                                                    |
| ------------------------ | ------------------------------------------------------------------------- |
| **Functional currency**  | ZAR for SA operations; USD for group reporting                            |
| **Translation method**   | Closing rate for assets/liabilities; average rate for income/expense      |
| **Exchange differences** | Recognized in profit or loss (monetary items) or OCI (non-monetary items) |

## 7. Taxation

| Tax                  | Jurisdiction | Rate    | Basis                          |
| -------------------- | ------------ | ------- | ------------------------------ |
| Corporate income tax | South Africa | 27%     | Taxable income                 |
| Corporate income tax | Zimbabwe     | 24.72%  | Taxable income                 |
| VAT                  | South Africa | 15%     | Standard rated supplies        |
| Withholding tax      | Cross-border | Per DTA | Dividends, interest, royalties |

Deferred tax is recognized on temporary differences using the liability method.

## 8. Related Documents

- `01-docs/financial/expense-policy.md`
- `01-docs/financial/trust-account.md`
- `01-docs/10-compliance/data-retention-policy.md`

---

_Last updated: 2026-05-25_
