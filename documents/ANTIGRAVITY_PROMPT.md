# Antigravity Prompt — BoxKart Box Engine

You are implementing the BoxKart Box Engine.

Read every `.md` document in this directory before changing code.

## Non-negotiable constraints

- JavaScript only. Do not use TypeScript.
- ES6+.
- Modular monolith.
- PostgreSQL + Prisma.
- REST API under `/api/v1`.
- Business logic belongs in services/domain modules, not controllers.
- Box fit calculations must be pure deterministic JavaScript.
- Pricing must be calculated server-side.
- Never trust frontend totals/prices.
- Use database migrations.
- Use secure HTTP-only authentication cookies.
- Add tests for core business logic.
- Do not introduce microservices.
- Do not implement supplier/warehouse/AI complexity unless explicitly requested.
- Do not silently change the architecture.

## Execution

Implement tasks from `15_ANTIGRAVITY_IMPLEMENTATION_PLAN.md` in order.

Before each phase:

1. inspect current repository
2. identify completed tasks
3. implement only the next logical tasks
4. run tests/lint/build
5. update documentation if behavior changed
6. report files changed and validation results

## Quality Bar

The final system must support:

Customer:
signup -> login -> browse -> Find My Box -> recommendation -> pricing -> cart -> checkout -> order

B2B:
RFQ -> admin review -> quote -> acceptance -> order

Do not mark a task complete unless its acceptance criteria are actually satisfied.
