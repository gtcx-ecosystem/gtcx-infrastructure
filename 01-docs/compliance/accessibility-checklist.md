---
title: 'Accessibility Checklist'
status: 'current'
date: '2026-05-27'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'critical'
tags: ['compliance', 'infrastructure', 'testing', 'frontend', 'devops']
review_cycle: 'quarterly'
agent_id: 'agent://gtcx-infrastructure/2026-05-27/session-backfill'
trust_score: 60
autonomy_level: 'permissioned'
---

# Accessibility Checklist

**Standard**: WCAG 2.1 Level AA
**Review Cycle**: Per release + quarterly audit
**Owner**: [Engineering Lead / Design Lead]

---

## Perceivable

### Text Alternatives

- [ ] All non-text content has a text alternative (`alt`, `aria-label`, or `aria-labelledby`)
- [ ] Decorative images use empty `alt=""` or `role="presentation"`
- [ ] Complex images (charts, diagrams) have extended descriptions
- [ ] Icons used alone have accessible labels

### Time-Based Media

- [ ] Audio-only content has a text transcript
- [ ] Video content has captions (auto-captions reviewed for accuracy)
- [ ] Pre-recorded video has audio description if visual-only content is meaningful

### Adaptable

- [ ] Content structure conveyed through semantic HTML (headings, lists, landmarks)
- [ ] No information conveyed through color alone
- [ ] Reading order in DOM matches visual order
- [ ] Layout is responsive and does not require horizontal scrolling at 320px viewport width
- [ ] Content reflows without loss of information when zoomed to 400%

### Distinguishable

- [ ] Text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text ≥18pt or ≥14pt bold)
- [ ] UI component contrast ratio ≥ 3:1 against adjacent colors
- [ ] No content flashes more than 3 times per second
- [ ] Background audio can be paused, stopped, or reduced to ≤ 20dB below foreground
- [ ] Text can be resized up to 200% without loss of content or functionality

---

## Operable

### Keyboard Accessible

- [ ] All functionality is operable via keyboard
- [ ] No keyboard traps — user can always navigate away from a component
- [ ] Keyboard shortcuts do not conflict with system or browser shortcuts
- [ ] All interactive elements are reachable by Tab and activated by Enter/Space

### Enough Time

- [ ] Session timeouts warn users at least 20 seconds before expiry with option to extend
- [ ] Moving/scrolling content can be paused, stopped, or hidden
- [ ] Auto-updating content can be paused or controlled

### Seizures and Physical Reactions

- [ ] No content flashes more than 3 times per second at any size

### Navigable

- [ ] Skip navigation link provided to bypass repetitive content
- [ ] Each page has a unique, descriptive `<title>`
- [ ] Focus order is logical and intuitive
- [ ] Focus is visible — focus indicator has contrast ratio ≥ 3:1
- [ ] Link purpose is clear from link text alone or from context
- [ ] Multiple navigation methods available (search, site map, or consistent nav)
- [ ] Section headings used to organize content

### Input Modalities

- [ ] All pointer operations with specific path gestures have a single-pointer alternative
- [ ] Click/tap actions trigger on up-event (mouseup/touchend), not down
- [ ] Motion-activated features have a UI alternative and can be disabled
- [ ] Labels or instructions provided for all user inputs

---

## Understandable

### Readable

- [ ] Page language specified in `<html lang="...">`
- [ ] Language of passages in different languages specified with `lang` attribute
- [ ] Jargon and abbreviations explained or avoided
- [ ] Reading level appropriate for intended audience

### Predictable

- [ ] No context change on focus
- [ ] No context change on input unless user is advised in advance
- [ ] Navigation is consistent across pages
- [ ] Components with same function have consistent labeling

### Input Assistance

- [ ] Error messages identify the field and describe the error in text
- [ ] Required fields labeled before submission
- [ ] Input format requirements described before the field (not just in placeholder text)
- [ ] Error suggestions provided where possible
- [ ] Confirmation step or undo available for legal, financial, or data-modifying actions

---

## Robust

### Compatible

- [ ] HTML validates with no major errors affecting assistive technologies
- [ ] All UI components have correct `role`, `name`, `value` attributes
- [ ] Status messages announced via `aria-live` without requiring focus
- [ ] Tested with at least 2 screen readers (e.g. VoiceOver + NVDA or JAWS)
- [ ] Tested with keyboard-only navigation
- [ ] Tested at 200% browser zoom

---

## Testing Procedures

### Automated (run in CI)

| Tool                           | What It Catches             | Gate                             |
| ------------------------------ | --------------------------- | -------------------------------- |
| axe-core / axe DevTools        | ~30% of WCAG issues         | Blocks merge if violations found |
| Lighthouse accessibility score | Regression tracking         | Score ≥ 90 required              |
| eslint-plugin-jsx-a11y         | React prop/attribute issues | Blocks merge                     |

### Manual (run before each release)

| Check               | Method                                         |
| ------------------- | ---------------------------------------------- |
| Keyboard navigation | Tab through all flows without mouse            |
| Screen reader       | VoiceOver (macOS/iOS) + NVDA or JAWS (Windows) |
| Color contrast      | Browser DevTools or Colour Contrast Analyser   |
| Zoom to 200%        | Browser zoom, check reflow                     |
| Responsive at 320px | DevTools responsive mode                       |

### User Testing

- Include users with disabilities in research sessions at least once per major release
- Recruit through [disability-focused research recruitment service or community]

---

## Remediation SLAs

| Severity | Definition                           | Fix By           |
| -------- | ------------------------------------ | ---------------- |
| Critical | Blocks core flow for any user        | Before release   |
| High     | Significantly degrades experience    | Within 2 sprints |
| Medium   | WCAG AA violation, workaround exists | Within 1 quarter |
| Low      | Enhancement beyond AA                | Backlog          |

---

## Sign-Off

| Release   | Reviewer | Date | Status       |
| --------- | -------- | ---- | ------------ |
| {version} |          |      | [ ] Approved |

---

_WCAG 2.1 reference: https://www.w3.org/TR/WCAG21/_
_Review this checklist when adding new UI surfaces or input types._
