# Legal Sign-Off

> Legal review requirements and sign-off gates for [Organization Name] releases.

---

## 1. When Legal Review is Required

| Trigger                       | Review Type                              | Lead Time                       |
| ----------------------------- | ---------------------------------------- | ------------------------------- |
| New data product launch       | Full legal review                        | [N] weeks before GA             |
| New market / jurisdiction     | Regulatory compliance review             | [N] weeks before launch         |
| New third-party integration   | Vendor contract + data review            | [N] weeks before go-live        |
| New user-facing terms         | Terms review + drafting                  | [N] weeks before publish        |
| Material API change           | Terms update review                      | [N] weeks before release        |
| Processing new PII categories | DPIA (Data Protection Impact Assessment) | [N] weeks before implementation |
| GA release                    | GA legal sign-off gate                   | Part of GA checklist            |

---

## 2. GA Release Legal Sign-Off Gate

The following must be confirmed before any GA release:

### Terms and Policies

- [ ] Terms of Service current and reviewed by counsel
- [ ] Privacy Policy reflects actual data processing practices
- [ ] Cookie Policy / consent mechanism compliant with applicable law
- [ ] Data Processing Agreements in place with all data processors
- [ ] Acceptable Use Policy published and enforced

### Intellectual Property

- [ ] All third-party licenses reviewed and compliant
- [ ] Open-source license inventory up to date
- [ ] Proprietary content and methodology IP ownership confirmed
- [ ] Trademark / brand usage reviewed

### Regulatory Compliance

- [ ] GDPR compliance confirmed (if processing EU personal data)
- [ ] [Local data protection law] compliance confirmed
- [ ] Financial data handling rules reviewed (if applicable)
- [ ] [Sector-specific regulation] requirements met

### Contracts

- [ ] Customer agreement template reviewed and approved
- [ ] Partner / reseller agreement template reviewed
- [ ] Employee IP assignment agreements in place
- [ ] Contractor agreements executed for all active contractors

---

## 3. Sign-Off Process

```
Engineering marks release candidate ready
        ↓
Legal review request submitted (see template below)
        ↓
Legal team review ([N]-day SLA)
        ↓
Issues raised → Engineering / Product resolves
        ↓
Legal sign-off recorded
        ↓
Release authorized to proceed
```

### Sign-Off Request Template

```
Subject: Legal Sign-Off Request — [Release Name] v[X.Y]

Release date target: [YYYY-MM-DD]
Scope: [Brief description of what is changing]

New or changed:
- [ ] Terms of Service changes
- [ ] Privacy Policy changes
- [ ] New data types collected or processed
- [ ] New jurisdictions / markets
- [ ] New third-party data processors
- [ ] New features with legal implications

Documents attached:
- [ ] Changelog / release notes
- [ ] Updated Terms (if changed)
- [ ] Updated Privacy Policy (if changed)
- [ ] Vendor contract(s) (if applicable)
- [ ] DPIA (if required)

Requested reviewer: [Legal counsel name]
```

---

## 4. Sign-Off Record

| Release | Date         | Legal Reviewer | Issues Raised | Status               |
| ------- | ------------ | -------------- | ------------- | -------------------- |
| v[X.Y]  | [YYYY-MM-DD] | [Name]         | [N]           | [Approved / Pending] |

---

## 5. Ongoing Legal Maintenance

| Item                           | Frequency                   | Owner              |
| ------------------------------ | --------------------------- | ------------------ |
| Terms of Service review        | Annual                      | Legal              |
| Privacy Policy review          | Annual + on material change | Legal              |
| License inventory review       | Quarterly                   | Engineering        |
| DPA review with key processors | Annual                      | Legal              |
| Regulatory landscape scan      | Quarterly                   | Legal + Compliance |

---

_No release ships without legal sign-off where required. Build review time into the release schedule._
