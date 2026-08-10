# BoxKart Box Engine — Testing Specification

## Testing Pyramid

```text
        E2E
       /   \
 Integration
    /       \
 Unit Tests
```

## Unit Tests

Must heavily cover pure business logic.

### Fit Engine

Test:

- exact fit
- oversized product
- all six orientations
- rotated fit
- zero/negative dimensions
- different units
- clearance
- utilization

### Pricing Engine

Test:

- MOQ
- exact tier boundary
- middle tier
- unlimited final tier
- invalid quantity
- missing tier
- integer money calculations

### Recommendation Engine

Test:

- deterministic ranking
- priority profiles
- score breakdown
- excluded candidates
- tie handling

## Integration Tests

Test:

- API + Prisma
- authentication
- catalog
- cart
- order creation
- RFQ
- quote
- inventory

## E2E Tests

Critical journey:

```text
signup
 -> login
 -> browse product
 -> find box
 -> add to cart
 -> checkout
 -> order
```

B2B journey:

```text
login
 -> create RFQ
 -> submit
 -> admin creates quote
 -> customer accepts
 -> order created
```

## Security Tests

Test:

- unauthenticated access
- customer accessing admin APIs
- invalid session
- malformed input
- rate limits
- file upload restrictions

## Regression

Every bug fixed should get a regression test.

## Definition

No release if critical business logic has failing tests.
