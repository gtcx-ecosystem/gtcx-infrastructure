# Accessibility Audit — {product-name}

## Audit Info

| Field           | Value                                                         |
| --------------- | ------------------------------------------------------------- |
| Date            | {audit-date}                                                  |
| Auditor         | {auditor-name}                                                |
| Product Version | {version}                                                     |
| Pages / Screens | {list-of-pages-or-screens-tested}                             |
| Tools Used      | {axe-core, Lighthouse, WAVE, NVDA, VoiceOver, TalkBack, etc.} |
| Assistive Tech  | {screen-readers-and-versions}                                 |
| Target Standard | WCAG 2.1 Level AA                                             |

## Executive Summary

**Compliance Level**: {A / AA / AAA / Non-compliant}

| Metric            | Count |
| ----------------- | ----- |
| Total issues      | {n}   |
| Critical blockers | {n}   |
| Level A failures  | {n}   |
| Level AA failures | {n}   |

{1-2 paragraph narrative summary of compliance status and key blockers.}

## WCAG 2.1 Compliance

### Principle 1 — Perceivable

| Criterion | Description                              | Level | Status          | Notes          |
| --------- | ---------------------------------------- | ----- | --------------- | -------------- |
| 1.1.1     | Non-text Content (text alternatives)     | A     | {Pass/Fail}     | {notes-or-N/A} |
| 1.2.1     | Audio-only and Video-only                | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.2.2     | Captions (Prerecorded)                   | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.2.3     | Audio Description or Media Alternative   | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.2.4     | Captions (Live)                          | AA    | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.2.5     | Audio Description (Prerecorded)          | AA    | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.3.1     | Info and Relationships                   | A     | {Pass/Fail}     | {notes-or-N/A} |
| 1.3.2     | Meaningful Sequence                      | A     | {Pass/Fail}     | {notes-or-N/A} |
| 1.3.3     | Sensory Characteristics                  | A     | {Pass/Fail}     | {notes-or-N/A} |
| 1.3.4     | Orientation                              | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.3.5     | Identify Input Purpose                   | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.1     | Use of Color                             | A     | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.2     | Audio Control                            | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 1.4.3     | Contrast (Minimum) — 4.5:1               | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.4     | Resize Text — up to 200%                 | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.5     | Images of Text                           | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.10    | Reflow — 320px without horizontal scroll | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.11    | Non-text Contrast — 3:1                  | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.12    | Text Spacing                             | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 1.4.13    | Content on Hover or Focus                | AA    | {Pass/Fail}     | {notes-or-N/A} |

### Principle 2 — Operable

| Criterion | Description                      | Level | Status          | Notes          |
| --------- | -------------------------------- | ----- | --------------- | -------------- |
| 2.1.1     | Keyboard                         | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.1.2     | No Keyboard Trap                 | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.1.4     | Character Key Shortcuts          | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 2.2.1     | Timing Adjustable                | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 2.2.2     | Pause, Stop, Hide                | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 2.3.1     | Three Flashes or Below Threshold | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.1     | Bypass Blocks (skip navigation)  | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.2     | Page Titled                      | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.3     | Focus Order                      | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.4     | Link Purpose (In Context)        | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.5     | Multiple Ways                    | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.6     | Headings and Labels              | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 2.4.7     | Focus Visible                    | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 2.5.1     | Pointer Gestures                 | A     | {Pass/Fail/N/A} | {notes-or-N/A} |
| 2.5.2     | Pointer Cancellation             | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.5.3     | Label in Name                    | A     | {Pass/Fail}     | {notes-or-N/A} |
| 2.5.4     | Motion Actuation                 | A     | {Pass/Fail/N/A} | {notes-or-N/A} |

### Principle 3 — Understandable

| Criterion | Description                         | Level | Status          | Notes          |
| --------- | ----------------------------------- | ----- | --------------- | -------------- |
| 3.1.1     | Language of Page                    | A     | {Pass/Fail}     | {notes-or-N/A} |
| 3.1.2     | Language of Parts                   | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 3.2.1     | On Focus                            | A     | {Pass/Fail}     | {notes-or-N/A} |
| 3.2.2     | On Input                            | A     | {Pass/Fail}     | {notes-or-N/A} |
| 3.2.3     | Consistent Navigation               | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 3.2.4     | Consistent Identification           | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 3.3.1     | Error Identification                | A     | {Pass/Fail}     | {notes-or-N/A} |
| 3.3.2     | Labels or Instructions              | A     | {Pass/Fail}     | {notes-or-N/A} |
| 3.3.3     | Error Suggestion                    | AA    | {Pass/Fail}     | {notes-or-N/A} |
| 3.3.4     | Error Prevention (Legal, Financial) | AA    | {Pass/Fail/N/A} | {notes-or-N/A} |

### Principle 4 — Robust

| Criterion | Description       | Level | Status      | Notes          |
| --------- | ----------------- | ----- | ----------- | -------------- |
| 4.1.1     | Parsing           | A     | {Pass/Fail} | {notes-or-N/A} |
| 4.1.2     | Name, Role, Value | A     | {Pass/Fail} | {notes-or-N/A} |
| 4.1.3     | Status Messages   | AA    | {Pass/Fail} | {notes-or-N/A} |

## Screen Reader Testing

| Screen / Page | Reader    | OS / Version  | Result      | Issues           |
| ------------- | --------- | ------------- | ----------- | ---------------- |
| {page-name}   | NVDA      | Windows {ver} | {Pass/Fail} | {issues-or-none} |
| {page-name}   | VoiceOver | macOS {ver}   | {Pass/Fail} | {issues-or-none} |
| {page-name}   | VoiceOver | iOS {ver}     | {Pass/Fail} | {issues-or-none} |
| {page-name}   | TalkBack  | Android {ver} | {Pass/Fail} | {issues-or-none} |

## Keyboard Navigation

- [ ] All interactive elements are reachable via Tab / Shift+Tab
- [ ] Focus indicator is visible on all focusable elements
- [ ] Tab order follows a logical reading sequence
- [ ] No keyboard traps (user can always navigate away)
- [ ] Modal dialogs trap focus correctly and return focus on close
- [ ] Custom components (dropdowns, date pickers, carousels) support expected key bindings
- [ ] Skip-to-content link is present and functional

## Color & Contrast

| Element          | Foreground | Background | Ratio | Required | Pass     |
| ---------------- | ---------- | ---------- | ----- | -------- | -------- |
| Body text        | {hex}      | {hex}      | {n:1} | 4.5:1    | {Yes/No} |
| Large text       | {hex}      | {hex}      | {n:1} | 3:1      | {Yes/No} |
| UI components    | {hex}      | {hex}      | {n:1} | 3:1      | {Yes/No} |
| Link text        | {hex}      | {hex}      | {n:1} | 4.5:1    | {Yes/No} |
| Placeholder text | {hex}      | {hex}      | {n:1} | 4.5:1    | {Yes/No} |
| Error text       | {hex}      | {hex}      | {n:1} | 4.5:1    | {Yes/No} |

## Global South Considerations

- [ ] Low-bandwidth alternative content provided (compressed images, lazy loading)
- [ ] Core functionality works without JavaScript where feasible
- [ ] SMS / USSD text-only flows tested for key user journeys
- [ ] Right-to-left (RTL) language support verified (Arabic, Urdu, Hebrew)
- [ ] Content readable at 2G connection speeds
- [ ] Offline-capable features degrade gracefully
- [ ] Font stacks include system fonts for regions with limited font availability
- [ ] Date, number, and currency formats respect locale settings

## Issues

| #   | WCAG Criterion | Level  | Description         | Location            | Severity                | Proposed Fix      |
| --- | -------------- | ------ | ------------------- | ------------------- | ----------------------- | ----------------- |
| 1   | {criterion}    | {A/AA} | {issue-description} | {page-or-component} | {Critical/High/Med/Low} | {fix-description} |
| 2   | {criterion}    | {A/AA} | {issue-description} | {page-or-component} | {Critical/High/Med/Low} | {fix-description} |

## Remediation Priority

### Critical — Blocks Access

{List issues that completely prevent users from accessing content or functionality.}

### High — Degrades Experience

{List issues that significantly impair the user experience for assistive technology users.}

### Medium — Inconvenient

{List issues that create friction but do not block access.}

### Low — Enhancement

{List minor improvements that would enhance the experience beyond minimum compliance.}
