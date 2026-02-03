# ROI Calculator Page Template - [PROJECT_NAME]

## Purpose
Help stakeholders estimate ROI and impact of adopting [PROJECT_NAME] based on jurisdiction inputs.

## Inputs
- Total units (e.g., parcels)
- Currently registered (%)
- Average value per unit ($)
- Annual tax rate (%) / savings metric
- Disputes per year, average cost ($)
- Implementation timeline (months)

## Outputs
- 5-year ROI (%) and payback period (months)
- Annual revenue increase
- Dispute reduction savings
- Economic activity unlocked (optional)

## Calculation Model (pseudocode)
```
unregistered = total * (1 - registeredPct)
newRegs5y = unregistered * adoptionRate
currentRevenue = total * registeredPct * value * tax
newRevenue = newRegs5y * value * tax
revenueIncrease = newRevenue
savings = disputes * reductionRate * disputeCost
benefit5y = (revenueIncrease * 5) + (savings * 5)
roi = (benefit5y - implementationCost) / implementationCost
payback = implementationCost / (revenueIncrease / 12)
```

## Presentation
- Metrics cards (ROI, payback, revenue, savings)
- 5-year projection chart
- Comparison table (optional)
- CTA buttons (download report, schedule demo, start pilot)

## Implementation Notes
- Client-side calculator; no PII
- Accessible controls and responsive layout
- Persist last inputs locally

## Checklist
- Inputs validated and accessible
- Model reviewed by finance/legal
- Copy localized
- Export report available
