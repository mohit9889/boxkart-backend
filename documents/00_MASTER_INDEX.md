# Box Engine Documentation Package

This package is the implementation baseline for the BoxKart Box Engine.

## Purpose

Build a modular-monolith backend that becomes the central engine for:

- catalog
- box discovery
- box fit calculations
- recommendations
- pricing
- cart
- checkout
- orders
- RFQ
- quotes
- custom packaging
- admin operations
- authentication

The existing BoxKart frontend should consume the engine through versioned APIs.

## Architecture Decision

Use a **modular monolith** for the MVP:

```text
Frontend
   |
REST API /api/v1
   |
Controllers
   |
Domain Services
   |
Repositories
   |
Prisma
   |
PostgreSQL
```

Do not introduce microservices for the MVP.

## Document Map

| Document | Purpose |
|---|---|
| 01_PRODUCT_REQUIREMENTS.md | Product and business requirements |
| 02_ARCHITECTURE.md | System and module architecture |
| 03_DOMAIN_MODEL.md | Domain entities and relationships |
| 04_DATABASE_SPEC.md | PostgreSQL database design |
| 05_PRISMA_SCHEMA.md | Prisma implementation contract |
| 06_API_SPEC.md | REST API contract |
| 07_BOX_ENGINE_SPEC.md | Fit, search and recommendation engine |
| 08_PRICING_ENGINE_SPEC.md | Pricing calculation rules |
| 09_AUTH_SECURITY_SPEC.md | Authentication and security |
| 10_STATE_MACHINES.md | Order/RFQ/Quote lifecycle |
| 11_FRONTEND_INTEGRATION.md | FE-to-engine integration |
| 12_PROJECT_STRUCTURE.md | Repository/folder conventions |
| 13_TESTING_SPEC.md | Testing strategy |
| 14_DEPLOYMENT_SPEC.md | MVP deployment and environments |
| 15_ANTIGRAVITY_IMPLEMENTATION_PLAN.md | Exact implementation phases/tasks |
| 16_DEFINITION_OF_DONE.md | Completion criteria |
| 17_ARCHITECTURE_DECISIONS.md | Important decisions and rationale |

## Implementation Order

1. Read all documents.
2. Do not code until architecture is understood.
3. Create repository structure.
4. Configure environment.
5. Configure PostgreSQL and Prisma.
6. Implement authentication.
7. Implement catalog.
8. Implement Box Engine.
9. Implement Pricing Engine.
10. Implement cart.
11. Implement checkout/orders.
12. Implement RFQ/quotes.
13. Implement admin.
14. Integrate frontend.
15. Run complete test suite.
16. Deploy.

## Source of Truth

When documents conflict, use this priority:

1. Security requirements
2. Database constraints
3. API contract
4. Domain rules
5. Implementation details

Never silently change architecture because implementation is inconvenient. Record meaningful changes in `ARCHITECTURE_DECISIONS.md`.
