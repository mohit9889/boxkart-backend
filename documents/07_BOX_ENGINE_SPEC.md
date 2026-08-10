# BoxKart Box Engine — Box Finder / Fit / Recommendation Specification

## 1. Purpose

Return the most appropriate packaging products for a customer's product requirements.

## 2. Pipeline

```text
Input
 |
Validation
 |
Candidate Search
 |
Dimension Normalization
 |
Fit Engine
 |
Eligibility Rules
 |
Recommendation Scoring
 |
Pricing
 |
Ranking
 |
Response
```

## 3. Input

Required:

```text
length
width
height
unit
quantity
```

Optional:

```text
weight
weightUnit
fragile
printingRequired
customizationRequired
priority
```

## 4. Candidate Filtering

Filter by:

- ACTIVE product
- packaging product type
- available inventory where relevant
- MOQ <= requested quantity
- required capabilities
- max recommended weight
- compatible box specification

## 5. Dimension Normalization

Normalize all dimensions to millimetres.

Examples:

```text
1 inch = 25.4 mm
1 cm = 10 mm
```

Do not compare raw values with different units.

## 6. Fit Algorithm

Test all six axis permutations.

For product:

```text
L × W × H
```

test:

```text
L W H
L H W
W L H
W H L
H L W
H W L
```

A candidate fits when:

```text
productDimension <= boxDimension
```

for all three axes in an orientation.

## 7. Clearance

Return:

```text
boxDimension - productDimension
```

for every axis.

## 8. Space Efficiency

Use volume:

```text
productVolume / boxInternalVolume
```

Higher utilization generally means less wasted space.

Do not use volume alone to determine fit.

## 9. Weight Protection

If:

```text
productWeight > maxRecommendedWeight
```

candidate is ineligible.

If max weight is absent, do not invent a limit.

## 10. Recommendation Priorities

Supported:

```text
LOWEST_PRICE
BEST_FIT
BEST_PROTECTION
BALANCED
```

## 11. Default Score

```text
fit              40%
spaceEfficiency  25%
protection       20%
price             10%
availability       5%
```

Weights should live in configuration, not scattered constants.

## 12. Determinism

For identical input and identical catalog state:

```text
same input -> same ranking
```

The MVP recommendation engine must be deterministic.

Do not use AI/ML for the first version.

## 13. Output

Each recommendation should contain:

```text
product
fit
orientation
clearance
utilization
score
scoreBreakdown
pricing
```

## 14. Pure Domain Logic

Fit and scoring functions should be pure JavaScript functions.

They must not depend on:

- Express
- Prisma
- HTTP
- database state

This makes them independently testable.

## 15. Example Internal Fit Function

```js
function calculateFit(product, box) {
  // normalize dimensions first
  // test all six orientations
  // return best valid orientation
}
```

## 16. Future Improvements

Possible later additions:

- fragile-item rules
- cushioning allowance
- dimensional weight
- shipping carrier constraints
- product category rules
- stacking rules
- box strength rules
- learned recommendation weights
- supplier lead time
