# BoxKart Box Engine — Architecture

## 1. Architecture Style

Use a **modular monolith**.

One deployable backend, one PostgreSQL database, strongly separated modules.

## 2. Layers

```text
HTTP
 |
Controllers
 |
Application Services
 |
Domain Services
 |
Repositories
 |
Prisma
 |
PostgreSQL
```

### Controllers

Responsibilities:

- parse HTTP request
- validate input
- authenticate/authorize
- call service
- format response

Controllers must not contain business rules.

### Application Services

Coordinate use cases.

Example:

```text
CreateOrderService
  -> validate cart
  -> calculate pricing
  -> validate inventory
  -> create order
```

### Domain Services

Contain reusable business logic.

Examples:

- FitEngine
- RecommendationEngine
- PricingEngine
- OrderStateService
- RFQStateService

Domain services should not depend on Express or HTTP.

### Repositories

Own persistence queries.

Do not scatter Prisma calls throughout controllers.

## 3. Modules

```text
auth
catalog
box-engine
pricing
cart
checkout
orders
rfq
quotes
custom-packaging
admin
```

## 4. Infrastructure

```text
database
storage
email
payments
logging
```

## 5. Dependency Direction

```text
HTTP
  -> Application
      -> Domain
          -> Repository interfaces
              -> Infrastructure implementation
```

Avoid circular dependencies.

## 6. Box Engine Architecture

```text
Box Finder Controller
        |
Box Finder Service
        |
Candidate Search
        |
Fit Engine
        |
Recommendation Engine
        |
Pricing Engine
```

## 7. Important Rule

The Box Engine must remain usable without the frontend.

A future:

- mobile app
- supplier portal
- AI agent
- admin tool

should be able to call the same APIs.

## 8. No Microservices Yet

Microservices are intentionally deferred until there is a real scaling or organizational reason.

Possible future extraction:

```text
Box Engine -> independent service
Pricing Engine -> independent service
```

The current module boundaries should make this possible later.
