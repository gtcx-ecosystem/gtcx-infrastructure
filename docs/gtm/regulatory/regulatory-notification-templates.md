---
title: 'Regulatory Notification Templates'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['security', 'crypto', 'compliance', 'infrastructure', 'api']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Regulatory Notification Templates

**Classification:** Confidential
**Owner:** General Counsel + CISO
**Version:** 1.0
**Last Updated:** **\_\_\_\_**

---

## 1. Purpose

This document contains pre-drafted notification templates for regulatory and legal communications following a security incident or data breach. These templates are designed to be completed rapidly during an active incident to meet regulatory notification deadlines.

All notifications must be reviewed by General Counsel before transmission.

## 2. Template Index

| Template                                     | Regulation                      | Recipient                          | Deadline            |
| -------------------------------------------- | ------------------------------- | ---------------------------------- | ------------------- |
| A. Data Breach -- Regulator (GDPR Art. 33)   | GDPR                            | Supervisory Authority              | 72 hours            |
| B. Data Breach -- Individuals (GDPR Art. 34) | GDPR                            | Affected Data Subjects             | Without undue delay |
| C. Central Bank Notification                 | Various (African jurisdictions) | Central Bank / Financial Regulator | 24 hours (typical)  |
| D. PCI-DSS Incident Notification             | PCI-DSS                         | Acquiring Bank + Card Brands       | Immediately         |

---

## Template A: Data Breach Notification to Supervisory Authority (GDPR Article 33)

```
PERSONAL DATA BREACH NOTIFICATION
PURSUANT TO ARTICLE 33, GENERAL DATA PROTECTION REGULATION (EU) 2016/679

========================================================================
SECTION 1: CONTROLLER INFORMATION
========================================================================

Controller name:           Global Trade & Compliance Exchange (GTCX)
Registration number:       [Company registration number]
Address:                   [Registered address]

Data Protection Officer:
  Name:                    [DPO name]
  Email:                   [DPO email]
  Phone:                   [DPO phone]

Contact for this notification:
  Name:                    [Contact name]
  Email:                   [Contact email]
  Phone:                   [Contact phone]

========================================================================
SECTION 2: BREACH DETAILS
========================================================================

Date and time of breach:
  Occurred:                [YYYY-MM-DD HH:MM UTC, or "Unknown"]
  Discovered:              [YYYY-MM-DD HH:MM UTC]
  Reported to DPO:         [YYYY-MM-DD HH:MM UTC]

Nature of the breach (select all that apply):
  [ ] Confidentiality breach (unauthorized disclosure or access)
  [ ] Integrity breach (unauthorized alteration of personal data)
  [ ] Availability breach (unauthorized loss of access to personal data)

Description of the breach:
  [Factual description of what happened, how it was discovered, and
   the systems involved. Do not speculate on attribution.]

  ____________________________________________________________________
  ____________________________________________________________________
  ____________________________________________________________________
  ____________________________________________________________________

========================================================================
SECTION 3: DATA AND DATA SUBJECTS AFFECTED
========================================================================

Categories of data subjects:
  [ ] Customers / platform users
  [ ] Employees
  [ ] Business partners / counterparties
  [ ] Other: ________________

Approximate number of data subjects affected:
  [Number or estimated range]

Categories of personal data affected:
  [ ] Name
  [ ] Email address
  [ ] Phone number
  [ ] Physical address
  [ ] National ID / passport number
  [ ] Financial account information
  [ ] Transaction history
  [ ] Authentication credentials (hashed/encrypted)
  [ ] Location data
  [ ] IP addresses
  [ ] Other: ________________

Approximate number of records affected:
  [Number or estimated range]

========================================================================
SECTION 4: LIKELY CONSEQUENCES
========================================================================

Assessment of likely consequences for data subjects:
  [Describe the potential impact on data subjects, including risk of
   identity theft, financial loss, discrimination, reputational damage,
   or other significant effects.]

  ____________________________________________________________________
  ____________________________________________________________________
  ____________________________________________________________________

Risk level:
  [ ] Low -- unlikely to result in risk to individuals
  [ ] Medium -- may result in risk to individuals
  [ ] High -- likely to result in high risk to individuals

========================================================================
SECTION 5: MEASURES TAKEN
========================================================================

Measures taken to contain the breach:
  ____________________________________________________________________
  ____________________________________________________________________

Measures taken or proposed to mitigate adverse effects:
  ____________________________________________________________________
  ____________________________________________________________________

Measures taken or proposed to prevent recurrence:
  ____________________________________________________________________
  ____________________________________________________________________

Have affected individuals been notified?
  [ ] Yes -- on [date], via [method]
  [ ] No -- notification planned for [date]
  [ ] No -- notification not required because [reason]

========================================================================
SECTION 6: ADDITIONAL INFORMATION
========================================================================

Is this a complete or partial notification?
  [ ] Complete
  [ ] Partial -- supplementary information will follow by [date]

If partial, reason for delay:
  ____________________________________________________________________

Other supervisory authorities notified:
  [List any other DPAs notified, with dates]

Cross-border transfer involved:
  [ ] Yes -- data transferred to [countries]
  [ ] No

========================================================================
SECTION 7: DECLARATION
========================================================================

This notification is made in accordance with Article 33 of the
General Data Protection Regulation (EU) 2016/679.

Submitted by:
  Name:         ________________
  Title:        ________________
  Date:         ________________
  Signature:    ________________
```

---

## Template B: Data Breach Notification to Affected Individuals (GDPR Article 34)

```
[GTCX LETTERHEAD]

Date: [Date]

IMPORTANT: SECURITY NOTICE REGARDING YOUR PERSONAL DATA

Dear [Name / "Valued User"],

We are writing to inform you of a personal data breach that may affect
your information. We take the protection of your data seriously, and
we want to be transparent about what happened and what we are doing.

------------------------------------------------------------------------
WHAT HAPPENED
------------------------------------------------------------------------

On [date], we became aware of [brief, plain-language description of the
incident]. The incident occurred on [date/time period] and affected
[description of affected systems/services].

We discovered the breach through [detection method] and immediately
activated our security incident response procedures.

------------------------------------------------------------------------
WHAT PERSONAL DATA WAS INVOLVED
------------------------------------------------------------------------

Based on our investigation to date, the following types of your
personal data may have been affected:

- [List each category in plain language, e.g.:]
- Your name and email address
- Your account login credentials (passwords were stored in encrypted
  form and [were / were not] exposed in readable format)
- [Other categories as applicable]

------------------------------------------------------------------------
WHAT WE HAVE DONE
------------------------------------------------------------------------

Upon discovering the breach, we immediately took the following actions:

1. [Containment action -- e.g., "Shut down unauthorized access within
   [X] minutes of detection."]
2. [Investigation -- e.g., "Engaged independent cybersecurity experts
   to investigate the full scope of the incident."]
3. [Notification -- e.g., "Notified [relevant data protection
   authority] on [date]."]
4. [Remediation -- e.g., "Implemented additional security measures
   including [brief description]."]

------------------------------------------------------------------------
WHAT WE RECOMMEND YOU DO
------------------------------------------------------------------------

To protect yourself, we recommend the following steps:

1. [If credentials involved:]
   Change your password immediately at [URL]. Choose a strong, unique
   password that you do not use for any other service.

2. [If financial data involved:]
   Monitor your bank and payment accounts for unauthorized transactions.
   Contact your bank if you notice any suspicious activity.

3. [If identity data involved:]
   Be alert to unsolicited communications asking for personal
   information. GTCX will never ask for your password by email or phone.

4. [If applicable:]
   Enable two-factor authentication on your account at [URL].

------------------------------------------------------------------------
YOUR DATA PROTECTION OFFICER
------------------------------------------------------------------------

If you have questions or concerns about this incident, you may contact
our Data Protection Officer:

  Name:   [DPO name]
  Email:  [DPO email]
  Phone:  [DPO phone]

You also have the right to lodge a complaint with a supervisory
authority. The relevant authority for your jurisdiction is:

  [Authority name]
  [Authority website]
  [Authority contact details]

------------------------------------------------------------------------

We sincerely apologize for this incident and any concern it may cause.
We are committed to protecting your data and are taking all necessary
steps to prevent a recurrence.

Sincerely,

[Name]
[Title]
Global Trade & Compliance Exchange (GTCX)
```

---

## Template C: Central Bank Notification (African Jurisdictions)

```
[GTCX LETTERHEAD]
CONFIDENTIAL

Date: [Date]
Reference: GTCX-INC-[YYYY]-[NNN]

To:   [Central Bank Name]
      [Department -- e.g., Banking Supervision / Payment Systems]
      [Address]

Attention: [Contact name if known]

RE: CYBERSECURITY INCIDENT NOTIFICATION

Dear [Sir/Madam / Contact Name],

In accordance with [applicable regulation/circular -- e.g., "CBK
Guidance Note on Cybersecurity (CBK/PG/82)" or "BOU ICT Risk
Management Guidelines"], we hereby notify you of a cybersecurity
incident affecting [GTCX entity name / licensed entity name].

========================================================================
1. INCIDENT SUMMARY
========================================================================

Date of occurrence:        [Date and time UTC, or "Under investigation"]
Date of discovery:         [Date and time UTC]
Date of containment:       [Date and time UTC, or "Ongoing"]

Nature of incident:
  [ ] Unauthorized access to systems
  [ ] Unauthorized access to customer data
  [ ] Service disruption / system outage
  [ ] Fraud / financial loss
  [ ] Malware / ransomware
  [ ] Denial of service attack
  [ ] Other: ________________

Brief description:
  [Factual, concise description of the incident. 2-3 sentences.]
  ____________________________________________________________________
  ____________________________________________________________________

========================================================================
2. IMPACT ASSESSMENT
========================================================================

Systems affected:
  [List affected systems -- e.g., payment processing, customer portal,
   mobile banking, internal systems]

Customer impact:
  Number of customers potentially affected: [Number or range]
  Services disrupted:                       [List]
  Financial impact (if any):                [Amount or "Under assessment"]
  Customer data exposed:                    [Yes/No, categories if Yes]

Operational impact:
  Service availability:    [Fully operational / Partially degraded / Down]
  Duration of disruption:  [Hours/minutes, or "Ongoing"]

========================================================================
3. ACTIONS TAKEN
========================================================================

Immediate containment:
  [Description of containment measures taken]
  ____________________________________________________________________

Investigation status:
  [ ] Investigation in progress
  [ ] Investigation complete -- root cause identified
  [ ] External forensic investigators engaged

Remediation measures:
  [Description of remediation steps taken or planned]
  ____________________________________________________________________

Customer notification:
  [ ] Customers notified on [date] via [method]
  [ ] Customer notification planned for [date]
  [ ] Customer notification not required because [reason]

========================================================================
4. REGULATORY COMPLIANCE
========================================================================

Other regulators notified:
  [List any other regulators notified, with dates]

Law enforcement engaged:
  [ ] Yes -- [Agency], on [date]
  [ ] No
  [ ] Under consideration

Data protection authority notified:
  [ ] Yes -- [Authority], on [date]
  [ ] Not applicable
  [ ] Planned for [date]

========================================================================
5. ONGOING MEASURES
========================================================================

[Description of measures being implemented to prevent recurrence]
____________________________________________________________________
____________________________________________________________________

We will provide a supplementary report with full root cause analysis
and remediation plan within [X] business days.

========================================================================
6. POINT OF CONTACT
========================================================================

For further information regarding this incident:

  Name:    [CISO or designated contact]
  Title:   [Title]
  Email:   [Email]
  Phone:   [Phone]
  Available: [Hours -- e.g., "24/7 for the duration of this incident"]

Sincerely,

[Name]
[Title]
[GTCX Entity Name]
[License/Registration Number]
```

### Jurisdiction-Specific References

| Jurisdiction | Regulator                         | Applicable Regulation / Circular                | Notification Deadline |
| ------------ | --------------------------------- | ----------------------------------------------- | --------------------- |
| Kenya        | Central Bank of Kenya (CBK)       | CBK/PG/82 -- Guidance Note on Cybersecurity     | 24 hours              |
| Uganda       | Bank of Uganda (BOU)              | ICT Risk Management Guidelines                  | 24 hours              |
| Tanzania     | Bank of Tanzania (BOT)            | Electronic Payment Systems Regulations          | 24 hours              |
| Rwanda       | National Bank of Rwanda (BNR)     | Regulation on Cybersecurity                     | 24 hours              |
| Nigeria      | Central Bank of Nigeria (CBN)     | Risk-Based Cybersecurity Framework              | 24 hours              |
| South Africa | South African Reserve Bank (SARB) | Directive 1/2021 -- Significant Cyber Incidents | 24 hours              |

---

## Template D: PCI-DSS Incident Notification to Card Brands

```
[GTCX LETTERHEAD]
CONFIDENTIAL -- CARDHOLDER DATA COMPROMISE

Date: [Date]
Reference: GTCX-INC-[YYYY]-[NNN]

To:   [Acquiring Bank Name]
      [Fraud/Security Department]
      [Address]

CC:   [PCI QSA firm name and contact]

RE: NOTIFICATION OF SUSPECTED CARDHOLDER DATA COMPROMISE

Dear [Contact Name],

We are writing to notify you of a suspected compromise of cardholder
data in accordance with PCI-DSS Requirement 12.10 and the operating
regulations of [Visa / Mastercard / applicable card brand].

========================================================================
1. ENTITY INFORMATION
========================================================================

Entity name:               [GTCX entity name]
Merchant ID:               [MID]
PCI-DSS compliance status: [Compliant / SAQ type / AOC date]
QSA:                       [QSA firm name]
Last assessment date:      [Date]

========================================================================
2. INCIDENT DETAILS
========================================================================

Date of suspected compromise:  [Date range or specific date]
Date of discovery:             [Date]
Method of discovery:
  [ ] Internal monitoring / detection
  [ ] Card brand notification (CAMS/TC40)
  [ ] Law enforcement notification
  [ ] Third-party notification
  [ ] Customer report
  [ ] Other: ________________

Nature of compromise:
  [ ] Point-of-sale / terminal compromise
  [ ] E-commerce / card-not-present compromise
  [ ] Network intrusion
  [ ] Malware
  [ ] Insider threat
  [ ] Third-party service provider compromise
  [ ] Other: ________________

Description:
  [Factual description of the suspected compromise]
  ____________________________________________________________________
  ____________________________________________________________________

========================================================================
3. CARDHOLDER DATA AT RISK
========================================================================

Data elements potentially compromised:
  [ ] Primary Account Number (PAN)
  [ ] Cardholder name
  [ ] Expiration date
  [ ] Service code
  [ ] Track data (Track 1 / Track 2)
  [ ] PIN / PIN block
  [ ] CVV2 / CVC2 / CID
  [ ] Other: ________________

Estimated number of accounts at risk:  [Number or range]
Card brands affected:                  [Visa / Mastercard / other]
Date range of at-risk transactions:    [From -- To]
Geographic scope:                      [Countries / regions]

========================================================================
4. CONTAINMENT AND INVESTIGATION
========================================================================

Containment actions taken:
  [List specific actions -- e.g., isolated affected systems, disabled
   compromised accounts, rotated credentials]
  ____________________________________________________________________

PCI Forensic Investigator (PFI) engaged:
  [ ] Yes -- [PFI firm name], engagement date: [date]
  [ ] No -- engagement planned for [date]
  [ ] Not yet determined

Investigation status:
  [ ] Preliminary assessment
  [ ] Full investigation in progress
  [ ] Investigation complete

========================================================================
5. LAW ENFORCEMENT
========================================================================

Law enforcement notified:
  [ ] Yes -- [Agency], on [date], case number: [number]
  [ ] No
  [ ] Planned

========================================================================
6. REMEDIATION
========================================================================

Immediate remediation steps:
  ____________________________________________________________________
  ____________________________________________________________________

Long-term remediation plan:
  ____________________________________________________________________
  ____________________________________________________________________

Timeline for full remediation: [Date]

========================================================================
7. CARDHOLDER NOTIFICATION
========================================================================

Plan to notify affected cardholders:
  [ ] Yes -- planned for [date], via [method]
  [ ] Under assessment pending investigation results
  [ ] Not applicable (explain): ________________

========================================================================
8. POINT OF CONTACT
========================================================================

Primary contact:
  Name:    [CISO name]
  Title:   [Title]
  Email:   [Email]
  Phone:   [Phone]

QSA contact:
  Name:    [QSA contact name]
  Firm:    [QSA firm]
  Email:   [Email]
  Phone:   [Phone]

We understand the urgency of this matter and are committed to full
cooperation with your investigation. We will provide updates as our
investigation progresses.

Sincerely,

[Name]
[Title]
[GTCX Entity Name]
```

---

## 3. Usage Instructions

### 3.1 During an Incident

1. The Incident Commander identifies which templates are required based on the incident scope and regulatory obligations (see IRP Section 8, `docs/compliance/incident-response-plan-v1.md`).
2. General Counsel reviews the applicable templates and fills in incident-specific details.
3. All completed notifications are reviewed by both CISO and General Counsel before transmission.
4. Copies of all transmitted notifications are stored in the incident record and the forensic evidence bucket.

### 3.2 Template Maintenance

- Templates must be reviewed quarterly alongside the IRP review.
- Any regulatory change that affects notification requirements must trigger a template update within 30 days.
- General Counsel owns template accuracy; CISO owns technical content accuracy.

### 3.3 Translation

For notifications to African regulatory authorities, prepare the notification in English and in the official language(s) of the jurisdiction if required by the regulator. Translation must be reviewed by local counsel.

## Revision History

| Version | Date         | Author                 | Changes                                   |
| ------- | ------------ | ---------------------- | ----------------------------------------- |
| 1.0     | **\_\_\_\_** | General Counsel + CISO | Initial regulatory notification templates |
