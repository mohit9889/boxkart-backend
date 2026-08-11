# Box Engine Implementation Tasks

**Repository:** `mohit9889/boxkart-backend`
**Execution model:** Antigravity implementation plan
**Goal:** Harden the existing Box Engine MVP without rewriting working modules, then deploy to Render and integrate BoxKart frontend.

## Rules for Antigravity

1. **Audit before changing.** Read the target files and related tests first.
2. **Preserve working code.** Do not rewrite modules wholesale.
3. **JavaScript only.** Do not introduce TypeScript.
4. **Keep the modular monolith.** Do not introduce microservices.
5. **Do not add Redis/Kafka/Kubernetes/GraphQL unless a later requirement explicitly calls for them.**
6. **Do not change API behavior silently.** Update OpenAPI whenever a contract changes.
7. **Do not weaken security to make tests pass.**
8. **Every P0/P1 code change must include or update automated tests.**
9. **Run the relevant test suite after each task group.**
10. **Do not deploy until all P0 tasks and required P1 tasks are complete.**

---

# Phase 0 — Baseline and protection

## TASK-000 — Capture current baseline

**Priority:** P0

### Inspect

- `package.json`
- `src/app.js`
- `src/server.js`
- `src/routes/index.js`
- `prisma/schema.prisma`
- `src/api-spec/openapi.yaml`
- all `src/modules/**`
- existing tests

### Actions

- Run existing tests.
- Run Prisma validation/generation.
- Run formatting/checks available in the repository.
- Record the current baseline before changes.

### Done when

- Current test result is recorded.
- No unrelated refactoring is mixed into the first implementation batch.

---

# Phase 1 — Box Engine correctness

## TASK-001 — Fix box dimension unit handling

**Priority:** P0
**Files:**

- `src/modules/box-engine/box-engine.service.js`
- Box Engine tests

### Change

Replace hardcoded:

```js
unit: 'MM'
```

with:

```js
unit: spec.dimensionUnit
```

### Acceptance tests

- INCH box is normalized correctly.
- CM box is normalized correctly.
- MM box is normalized correctly.
- Mixed product/box units produce correct fit results.

---

## TASK-002 — Fix box maximum-weight field and unit handling

**Priority:** P0
**Files:**

- `src/modules/box-engine/box-engine.service.js`
- `src/modules/box-engine/fit.domain.js`
- Box Engine tests

### Change

Replace the nonexistent `spec.maxWeightCapacity` reference with `spec.maxRecommendedWeight`.

Normalize both product weight and box maximum recommended weight to KG before comparing.

### Acceptance tests

- Missing max weight does not reject a candidate.
- Exact maximum weight fits.
- Weight above maximum is rejected.
- GRAM/KG/LB conversions work.

---

## TASK-003 — Remove hardcoded USD from Box Engine

**Priority:** P0
**Files:**

- `src/modules/box-engine/box-engine.service.js`
- Box Engine tests

### Change

Return the selected price tier currency, with MVP expectation of `INR`.

Do not hardcode `USD`.

### Acceptance tests

- Recommendation currency is INR for current catalog data.
- Currency comes from the authoritative price tier.

---

## TASK-004 — Create canonical price-tier selection

**Priority:** P0
**Files:**

- `src/modules/pricing/pricing.domain.js`
- `src/modules/pricing/pricing.service.js`
- `src/modules/box-engine/box-engine.service.js`
- related tests

### Change

Create one reusable function for selecting the applicable tier:

```text
quantity >= minimumQuantity
AND
(maximumQuantity is null OR quantity <= maximumQuantity)
```

Use the same rule from Pricing and Box Engine.

Avoid duplicating business rules in Prisma query filters where that can create inconsistent behavior.

### Acceptance tests

- Every tier boundary is consistent across `/pricing/calculate` and `/box-finder/recommend`.

---

## TASK-005 — Validate Box Engine score assumptions

**Priority:** P1
**Files:**

- `src/modules/box-engine/fit.domain.js`
- Box Engine tests

### Change

Document the scoring model and verify whether the current constants are intentional:

- `maxClearance = 500`
- `maxPrice = 5000`
- protection score `80`
- availability score `100`

If these are temporary MVP assumptions, make them explicit constants/configuration and do not represent mock values as real business signals.

### Done when

- Score behavior is deterministic.
- The API clearly distinguishes actual data from placeholder scoring inputs.

---

# Phase 2 — Pricing integrity

## TASK-006 — Remove hardcoded USD from pricing service

**Priority:** P0
**File:** `src/modules/pricing/pricing.service.js`

### Change

Return the selected tier's currency rather than `USD`.

### Acceptance

Pricing response is INR for current BoxKart catalog data.

---

## TASK-007 — Strengthen pricing validation

**Priority:** P1
**Files:**

- `src/modules/pricing/pricing.domain.js`
- `src/modules/pricing/pricing.service.js`
- pricing tests

### Test

- quantity = 1
- quantity = MOQ
- quantity = MOQ - 1
- quantity = tier minimum
- quantity = tier maximum
- quantity = tier maximum + 1
- open-ended tier
- no matching tier
- no tiers
- non-integer quantity
- zero/negative quantity
- tampered frontend price ignored

---

# Phase 3 — Orders, checkout, and inventory

## TASK-008 — Implement address selection and immutable order snapshots

**Priority:** P0
**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/modules/checkout/*`
- `src/api-spec/openapi.yaml`
- related tests

### Change

Define the checkout/order request contract for:

- shipping address ID
- billing address ID or same-as-shipping

Resolve addresses through the authenticated user.

Store the full immutable address snapshots on `Order`.

### Security

A user must not be able to submit another user's address ID.

---

## TASK-009 — Implement atomic inventory reservation

**Priority:** P0
**Files:**

- `src/modules/order/order.service.js`
- `src/modules/catalog/*` if inventory helper belongs there
- `prisma/schema.prisma` only if required
- inventory/order tests

### Change

Inside the order transaction:

1. Validate product is active.
2. Validate applicable price tier.
3. Atomically verify available stock.
4. Reserve/decrement stock.
5. Create order and order items.
6. Create payment intent/record as appropriate for MVP.
7. Clear/convert cart.

If any step fails, the entire transaction rolls back.

### Concurrency requirement

Two concurrent orders cannot consume the same inventory.

---

## TASK-010 — Add order creation idempotency

**Priority:** P0
**Files:**

- `prisma/schema.prisma`
- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/api-spec/openapi.yaml`
- tests

### API

Accept:

```http
Idempotency-Key: <unique-key>
```

### Database

Add a unique persisted idempotency value scoped appropriately to the user/order creation operation.

### Behavior

Same user + same key must return the same logical order result instead of creating a second order.

---

## TASK-011 — Define checkout/order pricing responsibility

**Priority:** P1
**Files:**

- `src/modules/checkout/*`
- `src/modules/order/order.service.js`
- `src/modules/pricing/*`

### Change

Ensure the final order amount is calculated from authoritative database data at order creation time.

Never trust frontend subtotal, total, unit price, discount, tax, or shipping values.

Document what is included in MVP total and what remains future scope.

---

## TASK-012 — Add customer cancellation path

**Priority:** P1
**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/modules/order/order.domain.js`
- OpenAPI
- tests

### Change

Customer should have an explicit cancellation operation subject to allowed state transitions.

Do not expose arbitrary status mutation to customers.

---

# Phase 4 — Authorization and RBAC

## TASK-013 — Restrict operational order status mutation to ADMIN

**Priority:** P0
**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/modules/admin/admin.routes.js`
- existing auth/RBAC middleware
- OpenAPI
- tests

### Change

Move operational status mutation to admin/operations scope, e.g.:

```text
PATCH /api/v1/admin/orders/:orderId/status
```

Customer order endpoints must not allow arbitrary status changes.

---

## TASK-014 — Audit RFQ ownership

**Priority:** P1
**Files:**

- `src/modules/rfq/*`
- RFQ tests

### Verify

Every customer RFQ read/update/upload operation checks authenticated user ownership.

ADMIN operations may operate across users.

---

## TASK-015 — Audit quote ownership and authorization

**Priority:** P1
**Files:**

- `src/modules/quotes/*`
- quote tests

### Verify

Customers can only view/accept/reject quotes associated with their RFQs.

Admin quote management requires ADMIN role.

---

## TASK-016 — Add authorization negative test suite

**Priority:** P1

### Test

- unauthenticated → protected route
- CUSTOMER → admin route
- CUSTOMER → order status mutation
- User A → User B order
- User A → User B RFQ
- User A → User B quote
- invalid JWT
- expired JWT
- malformed cookie

---

# Phase 5 — API contract

## TASK-017 — Bring OpenAPI in sync with registered routes

**Priority:** P1
**File:** `src/api-spec/openapi.yaml`

Document all modules registered by `src/routes/index.js`:

```text
/auth
/categories
/products
/box-finder
/cart
/pricing
/checkout
/orders
/rfq
/quotes
/custom-packaging
/admin
```

Do not leave implemented routes undocumented.

---

## TASK-018 — Add reusable OpenAPI schemas

**Priority:** P1
**File:** `src/api-spec/openapi.yaml`

Create `components.schemas` for all core entities and API responses.

At minimum:

```text
ErrorResponse
User
Category
Product
ProductPriceTier
BoxRecommendation
BoxRecommendationResponse
PricingResponse
Cart
CartItem
CheckoutPreview
Order
OrderItem
Payment
RFQ
RFQItem
RFQAttachment
Quote
QuoteItem
CustomPackagingRequest
Pagination
```

---

## TASK-019 — Standardize API response envelope

**Priority:** P1
**Files:**

- `src/app.js`
- controllers/routes/services as appropriate
- OpenAPI
- tests

### Target

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found",
    "details": {}
  }
}
```

Do not expose internal error details in production.

---

## TASK-020 — Introduce stable business error codes

**Priority:** P1

Use codes instead of frontend-dependent error-message matching.

Minimum set:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
PRODUCT_NOT_FOUND
PRODUCT_INACTIVE
INVALID_QUANTITY
BELOW_MOQ
NO_FIT_FOUND
INSUFFICIENT_INVENTORY
ORDER_NOT_FOUND
INVALID_ORDER_STATE
RFQ_NOT_FOUND
QUOTE_NOT_FOUND
IDEMPOTENCY_CONFLICT
INTERNAL_SERVER_ERROR
```

---

# Phase 6 — Testing

## TASK-021 — Box Engine unit test suite

**Priority:** P1

Create deterministic tests for:

- exact fit
- no fit
- all six orientations
- best orientation
- clearances
- utilization
- INCH
- CM
- MM
- decimal dimensions
- invalid dimensions
- weight conversion
- weight limit
- no weight limit
- deterministic ranking

Target: at least 30 meaningful cases.

---

## TASK-022 — Pricing unit test suite

**Priority:** P1

Target: at least 20 meaningful cases covering tier boundaries and invalid input.

---

## TASK-023 — Order integration test suite

**Priority:** P1

Cover:

- empty cart
- valid order
- inactive product
- invalid tier
- insufficient stock
- address ownership
- order snapshot
- cart clearing
- inventory update
- transaction rollback
- duplicate idempotency key
- concurrent order attempts

---

## TASK-024 — Auth/RBAC integration tests

**Priority:** P1

Cover positive and negative authorization paths.

---

## TASK-025 — RFQ/quote integration tests

**Priority:** P1

Cover ownership, attachments, status transitions, quote acceptance/rejection, and unauthorized cross-user access.

---

# Phase 7 — Production readiness

## TASK-026 — Add readiness endpoint

**Priority:** P1
**File:** `src/routes/index.js`

Add:

```text
GET /health
GET /health/ready
```

`/health` verifies process liveness.

`/health/ready` verifies required runtime dependencies such as PostgreSQL.

---

## TASK-027 — Make Prisma migration deployment explicit

**Priority:** P1
**File:** `package.json`

Avoid coupling migrations to every application startup.

Prepare explicit deployment commands for Render:

```text
npm ci
npx prisma generate
npx prisma migrate deploy
npm start
```

Exact Render configuration should be documented after local validation.

---

## TASK-028 — Add production environment validation

**Priority:** P1
**Files:**

- `src/config/env.js`
- deployment documentation

Validate required production environment variables at startup without logging secret values.

At minimum review:

```text
DATABASE_URL
JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
FRONTEND_URL
NODE_ENV
PORT
```

---

## TASK-029 — Verify cookie/CORS production configuration

**Priority:** P1
**Files:**

- `src/app.js`
- auth cookie implementation
- config

Validate:

- frontend production origin
- credentials enabled
- `HttpOnly`
- `Secure` in production
- appropriate `SameSite`
- HTTPS deployment

Test browser authentication against the actual Vercel → Render domain setup.

---

# Phase 8 — Observability and CI

- `[x]` TASK-030: Add request IDs
- `[x]` TASK-031: Improve structured logging
- `[x]` TASK-032: Add GitHub Actions CI

---

# Phase 9 — Render deployment

- `[x]` TASK-033: Create Render deployment configuration
- `[ ]` TASK-034: Production smoke tests (Requires manual deployment)

After deployment verify:

```text
GET /health
GET /health/ready
GET /api/reference
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET /api/v1/auth/me
GET /api/v1/categories
GET /api/v1/products
POST /api/v1/box-finder/recommend
POST /api/v1/pricing/calculate
```

Then verify authenticated cart/order/RFQ flows using a controlled test account.

---

# Phase 10 — Frontend integration

## TASK-035 — Connect BoxKart frontend only after backend gate passes

**Priority:** P1 after deployment

Replace frontend mock/static data with Box Engine API calls.

Integration order:

```text
Auth
 ↓
Catalog
 ↓
Box Finder
 ↓
Pricing
 ↓
Cart
 ↓
Checkout
 ↓
Orders
 ↓
RFQ
 ↓
Quotes
```

Do not integrate all flows at once.

---

# Final release gate

Before calling Box Engine MVP production-ready:

- [ ] TASK-001 through TASK-004 complete
- [ ] TASK-006 through TASK-010 complete
- [ ] TASK-013 complete
- [ ] No P0 findings remain
- [ ] All required P1 tests pass
- [ ] OpenAPI matches actual routes
- [ ] API response/error contract is stable
- [ ] Inventory concurrency is tested
- [ ] Order idempotency is tested
- [ ] Resource ownership is tested
- [ ] Health/readiness endpoints work
- [ ] Render deployment works
- [ ] Production cookie/CORS flow works
- [ ] Frontend smoke test passes

## Implementation rule

**Do not start the next phase if a P0 task in the current phase is failing.**

The target is not "more features". The target is a backend whose existing features are correct, secure, deterministic, documented, tested, and deployable.
