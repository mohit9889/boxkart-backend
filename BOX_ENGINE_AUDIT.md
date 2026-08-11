# Box Engine Implementation Audit

**Repository:** `mohit9889/boxkart-backend`
**Branch audited:** `main`
**Audit type:** implementation audit for MVP hardening before Render deployment and BoxKart frontend integration
**Audit basis:** current repository source, Prisma schema, API specification, and package configuration

> This audit is intentionally implementation-first. Do not rewrite working modules merely to satisfy this document. Preserve the current modular-monolith architecture and change code only where a finding below requires it.

---

## 1. Executive summary

The repository has a strong MVP foundation:

- Node.js + Express 5
- Prisma + PostgreSQL
- JWT authentication through HTTP-only cookies
- Zod validation
- Supabase Storage integration
- Modular route/domain/service structure
- Pure Box Engine fit logic
- Pure pricing domain logic
- Cart → checkout → order flow
- RFQ / quote / custom packaging modules
- Admin module and role model
- Helmet, CORS, rate limiting, structured logging
- OpenAPI 3.1 + Swagger UI

The backend should **not be deployed to production or connected to the production BoxKart frontend yet**. The most important issues are correctness and business-integrity issues around the Box Engine, pricing, inventory/order creation, authorization, and API contract.

### Priority summary

| Priority | Area | Status |
|---|---|---|
| P0 | Box dimension unit handling | Must fix |
| P0 | Box weight field mismatch | Must fix |
| P0 | INR/USD consistency | Must fix |
| P0 | Price-tier selection consistency | Must fix |
| P0 | Order status authorization | Must fix |
| P0 | Inventory reservation during order creation | Must fix before real orders |
| P0 | Order idempotency | Must fix before real orders |
| P0 | Order address snapshots | Must fix before real orders |
| P1 | OpenAPI completeness | Must fix before frontend integration |
| P1 | Response/error contract | Must fix before frontend integration |
| P1 | Box Engine test matrix | Must fix |
| P1 | Pricing test matrix | Must fix |
| P1 | Auth/RBAC/resource ownership tests | Must fix |
| P1 | RFQ/quote authorization tests | Must fix |
| P1 | Readiness/production health | Must fix before deployment |
| P2 | Observability improvements | Recommended |
| P2 | CI/CD hardening | Recommended |
| P2 | Performance/cache/background jobs | Later |

---

# 2. Architecture assessment

## Current architecture

```text
BoxKart Frontend
      |
      | REST / HTTPS
      v
Node.js + Express
      |
      +-- auth
      +-- catalog
      +-- box-engine
      +-- pricing
      +-- cart
      +-- checkout
      +-- order
      +-- rfq
      +-- quotes
      +-- custom-packaging
      +-- admin
      |
      v
Prisma
      |
      v
PostgreSQL / Supabase

RFQ attachments
      |
      v
Supabase Storage
```

This is the correct complexity level for the MVP. **Do not introduce microservices, GraphQL, Kubernetes, Redis, Kafka, or separate Box/Pricing services yet.** Keep the modular monolith.

The pure domain separation in `src/modules/box-engine/fit.domain.js` and `src/modules/pricing/pricing.domain.js` is especially valuable and should be preserved.

---

# 3. P0 findings

## BE-P0-001 — Box Engine ignores `BoxSpecification.dimensionUnit`

**Severity:** Critical
**Area:** Box Engine correctness

### Evidence

The Prisma model stores:

```prisma
dimensionUnit DimensionUnit @default(INCH)
```

in:

`prisma/schema.prisma`

But `src/modules/box-engine/box-engine.service.js` constructs box dimensions using:

```js
unit: 'MM'
```

regardless of the database value.

### Impact

A box stored as `10 x 8 x 6 INCH` can be interpreted by the fit engine as `10 x 8 x 6 MM`. This can invalidate the entire recommendation result.

### Required change

**File:** `src/modules/box-engine/box-engine.service.js`

Change the box dimension payload to use the persisted unit:

```js
const boxDims = {
  length: spec.internalLength,
  width: spec.internalWidth,
  height: spec.internalHeight,
  unit: spec.dimensionUnit
};
```

### Acceptance criteria

- INCH boxes are normalized as inches.
- CM boxes are normalized as centimeters.
- MM boxes are normalized as millimeters.
- No service hardcodes a box dimension unit.
- Tests cover all three units.

---

## BE-P0-002 — Box Engine references a non-existent weight field

**Severity:** Critical
**Area:** Box Engine weight validation

### Evidence

`prisma/schema.prisma` defines:

```prisma
maxRecommendedWeight Decimal?
weightUnit WeightUnit @default(KG)
```

But `src/modules/box-engine/box-engine.service.js` reads:

```js
spec.maxWeightCapacity
```

### Impact

The box weight constraint is not enforced using the actual Prisma field.

### Required change

**File:** `src/modules/box-engine/box-engine.service.js`

Use the actual persisted field and normalize its unit before comparison. Do not compare a product weight in KG directly to a value stored in an arbitrary `WeightUnit`.

Recommended domain shape:

```js
const maxRecommendedWeightKG = normalizeWeightToKG(
  spec.maxRecommendedWeight,
  spec.weightUnit
);
```

Then compare against the normalized input weight.

### Acceptance criteria

- Product weight and box recommended weight are normalized to KG.
- Missing max weight means no weight restriction.
- Exceeding the maximum excludes the candidate.
- Tests cover GRAM/KG/LB for both input and box limits.

---

## BE-P0-003 — Currency is inconsistent and Box Engine returns USD

**Severity:** Critical
**Area:** Pricing/business correctness

### Evidence

`prisma/schema.prisma` defaults `ProductPriceTier.currency` and `Order.currency` to `INR`.

However:

- `src/modules/box-engine/box-engine.service.js` returns `currency: 'USD'`.
- `src/modules/pricing/pricing.service.js` returns `currency: 'USD'`.
- `src/modules/order/order.service.js` creates orders with `currency: 'INR'`.

### Impact

The frontend can display a currency different from the actual database/order currency.

### Required change

**Files:**

- `src/modules/box-engine/box-engine.service.js`
- `src/modules/pricing/pricing.service.js`

Do not hardcode currency in the service layer when the price tier already contains currency. Return the selected tier's currency.

For MVP, enforce `INR` consistently unless multi-currency support is explicitly introduced later.

### Acceptance criteria

- Box recommendations return INR.
- Pricing calculation returns INR.
- Checkout returns INR.
- Orders return INR.
- No production pricing path hardcodes USD.

---

## BE-P0-004 — Box Engine and Pricing Engine duplicate tier-selection rules

**Severity:** High
**Area:** Pricing correctness

### Evidence

`src/modules/box-engine/box-engine.service.js` queries the highest `minimumQuantity <= requested quantity`, but does not account for `maximumQuantity`.

`src/modules/pricing/pricing.domain.js` checks both minimum and maximum boundaries.

### Impact

The same product/quantity can potentially receive different tier behavior depending on which API path is used.

### Required change

**Files:**

- `src/modules/box-engine/box-engine.service.js`
- `src/modules/pricing/pricing.domain.js`
- `src/modules/pricing/pricing.service.js`

Create one canonical tier-selection function/service and reuse it from both pricing and Box Engine recommendation logic.

The canonical rule must be:

```text
quantity >= minimumQuantity
AND
(maximumQuantity is null OR quantity <= maximumQuantity)
```

### Acceptance criteria

- One authoritative tier-selection implementation.
- Box recommendations and `/pricing/calculate` select the same tier.
- Boundary tests cover every tier transition.

---

## BE-P0-005 — Customer can currently update their own order status

**Severity:** Critical
**Area:** Authorization

### Evidence

`src/modules/order/order.service.js` exposes:

```js
updateOrderStatus(userId, orderId, newStatus)
```

and verifies ownership with `getOrderById(userId, orderId)` before changing the status.

The route is under `/api/v1/orders/:orderId/status` and is authenticated, but the operation is not restricted to `ADMIN`.

### Impact

An ordinary customer can potentially advance their order through operational states.

### Required change

**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/modules/admin/admin.routes.js` (if status mutation is exposed there)
- existing auth/RBAC middleware used by admin routes
- `src/api-spec/openapi.yaml`

Customer APIs should expose viewing and customer-allowed cancellation only.

Operational status mutation should be an admin/operations action, e.g.:

```text
PATCH /api/v1/admin/orders/:orderId/status
```

### Acceptance criteria

- CUSTOMER cannot change order status.
- ADMIN can change status.
- State-transition validation remains enforced.
- OpenAPI reflects the authorization boundary.

---

## BE-P0-006 — Order creation does not reserve/decrement inventory

**Severity:** Critical
**Area:** Commerce integrity

### Evidence

`prisma/schema.prisma` has:

```prisma
availableQuantity
reservedQuantity
```

but `src/modules/order/order.service.js` creates an order and deletes cart items without atomically reserving inventory.

### Impact

Two concurrent customers can potentially create orders for stock that is no longer available.

### Required change

**File:** `src/modules/order/order.service.js`

Inside the same database transaction:

1. Read/lock inventory for every order item.
2. Verify `availableQuantity >= requested quantity`.
3. Decrease `availableQuantity` or increase `reservedQuantity` according to the chosen inventory model.
4. Update inventory status.
5. Create the order.
6. Clear/convert the cart.

Use a transaction-safe conditional update or appropriate PostgreSQL row locking strategy. Do not rely on a read followed by an unconditional write.

### Acceptance criteria

- Overselling is impossible under concurrent order attempts.
- Failed order creation rolls back inventory changes.
- Inventory changes and order creation are atomic.
- Concurrency tests exist.

---

## BE-P0-007 — Order creation has no idempotency protection

**Severity:** High
**Area:** Commerce integrity

### Evidence

`src/modules/order/order.service.js` generates a new order number on every `createOrder()` call and has no idempotency key.

### Impact

A frontend retry, double click, or network retry can create duplicate orders.

### Required change

**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `prisma/schema.prisma`
- `src/api-spec/openapi.yaml`

Add an idempotency key for order creation and persist it with a unique constraint scoped to the appropriate user/request context.

Recommended API header:

```http
Idempotency-Key: <unique-client-generated-value>
```

### Acceptance criteria

- Same user + same idempotency key returns the original order/result.
- Same key cannot create a second order.
- Different keys can create separate legitimate orders.
- Database uniqueness protects against races.

---

## BE-P0-008 — Order address snapshots are currently empty

**Severity:** High
**Area:** Checkout correctness

### Evidence

`prisma.schema.prisma` has a proper `Address` model and `Order` contains `shippingAddressSnapshot` and `billingAddressSnapshot`.

However `src/modules/order/order.service.js` currently creates:

```js
shippingAddressSnapshot: {},
billingAddressSnapshot: {},
```

### Impact

Orders do not contain the actual delivery/billing information required for fulfillment.

### Required change

**Files:**

- `src/modules/order/order.routes.js`
- `src/modules/order/order.service.js`
- `src/modules/checkout/*`
- `prisma/schema.prisma` only if the chosen checkout contract requires additional fields
- `src/api-spec/openapi.yaml`

Resolve the selected address(es), validate ownership, then store immutable snapshots in the order transaction.

### Acceptance criteria

- Customer can select a valid address owned by them.
- Address is validated before order creation.
- Order stores an immutable snapshot.
- Changing the address later does not change historical orders.

---

# 4. P1 findings

## BE-P1-001 — OpenAPI does not document the full implemented API

**File:** `src/api-spec/openapi.yaml`

The routes registered in `src/routes/index.js` include RFQ, quotes, custom packaging, and admin modules, but the OpenAPI file does not fully document these implemented modules.

### Required change

Update `src/api-spec/openapi.yaml` to document every registered `/api/v1` endpoint.

The OpenAPI document becomes the frontend integration contract.

---

## BE-P1-002 — OpenAPI response schemas are incomplete

**File:** `src/api-spec/openapi.yaml`

Many responses contain only descriptions and no actual JSON schemas.

### Required change

Add reusable `components.schemas` for:

- ErrorResponse
- User
- Category
- Product
- ProductPriceTier
- BoxRecommendation
- BoxRecommendationResponse
- PriceCalculationResponse
- Cart
- CartItem
- CheckoutPreview
- Order
- OrderItem
- Payment
- RFQ
- RFQItem
- RFQAttachment
- Quote
- QuoteItem
- CustomPackagingRequest
- Pagination

Every endpoint must reference those schemas.

---

## BE-P1-003 — Standardize API response and error contract

**Files:**

- `src/app.js`
- all controllers/services that manually construct response payloads
- `src/api-spec/openapi.yaml`

Current global errors use a simple `{ success, error: { message } }` shape, while successful endpoints have no documented universal envelope.

### Target contract

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

Do not expose stack traces or internal database errors in production.

---

## BE-P1-004 — Add stable business error codes

**Files:**

- `src/app.js`
- domain/service error handling files under `src/modules/**`
- `src/api-spec/openapi.yaml`

Define stable codes such as:

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

Frontend logic should use codes, not error-message string matching.

---

## BE-P1-005 — Box Engine domain needs a comprehensive deterministic test matrix

**Files:**

- `src/modules/box-engine/fit.domain.js`
- `src/modules/box-engine/box-engine.service.js`
- existing Box Engine test files; create them if absent

Required cases:

- exact fit
- no fit
- all six orientations
- one-dimension failure
- decimal dimensions
- INCH/CM/MM normalization
- invalid/zero/negative dimensions
- missing weight
- weight unit conversion
- max recommended weight boundary
- multiple candidate boxes
- price tie
- score tie
- quantity-specific price tier
- no applicable price tier
- deterministic output ordering

The pure domain function should remain framework-independent.

---

## BE-P1-006 — Pricing domain needs boundary and security tests

**Files:**

- `src/modules/pricing/pricing.domain.js`
- `src/modules/pricing/pricing.service.js`
- pricing route/controller test files

Test:

- MOQ exactly
- below MOQ
- tier minimum exactly
- tier maximum exactly
- just below/above tier boundaries
- open-ended maximum tier
- invalid quantity
- no tiers
- integer-only arithmetic
- frontend-supplied price is ignored
- database price is authoritative
- currency consistency

---

## BE-P1-007 — Auth/RBAC/resource ownership needs negative tests

**Files:**

- `src/modules/auth/*`
- `src/modules/admin/*`
- `src/modules/order/order.service.js`
- `src/modules/rfq/*`
- `src/modules/quotes/*`
- existing auth middleware under `src/middleware/*` if present

Test that:

- unauthenticated users cannot access protected routes
- CUSTOMER cannot access admin routes
- CUSTOMER cannot mutate order status
- user A cannot access user B's order
- user A cannot access user B's RFQ
- user A cannot access user B's quote
- invalid/expired JWT is rejected
- logout invalidates the intended session behavior

---

## BE-P1-008 — RFQ and Quote authorization must be audited

**Files:**

- `src/modules/rfq/rfq.routes.js`
- `src/modules/rfq/*service*.js`
- `src/modules/quotes/quotes.routes.js`
- `src/modules/quotes/*service*.js`
- `src/modules/custom-packaging/*`

Every customer-facing RFQ/quote operation must verify ownership through the authenticated user, not only authentication.

Admin status/quote operations must require ADMIN role.

---

## BE-P1-009 — Health/readiness endpoints need production semantics

**Files:**

- `src/routes/index.js`
- `src/server.js`

Current `/health` only confirms that Express is responding.

Add:

```text
GET /health
GET /health/ready
```

`/health/ready` should verify required dependencies, especially PostgreSQL, without leaking credentials or internal details.

Use `/health/ready` as the Render readiness/health-check endpoint if supported by the selected service configuration.

---

## BE-P1-010 — Prisma migrations should be deployment-owned

**File:** `package.json`

Current production script is:

```text
npx prisma migrate deploy && node src/server.js
```

Prefer making migration execution an explicit deployment step rather than having every application startup execute migrations.

Target deployment flow:

```text
Build
→ migrate deploy
→ start application
```

Keep local development and production commands explicit.

---

# 5. P2 findings

## BE-P2-001 — Add request/correlation IDs

**Files:**

- `src/app.js`
- `src/infrastructure/logging/*`

Every request should have a stable request ID returned in a response header and included in structured logs.

Example:

```text
X-Request-Id: req_abc123
```

---

## BE-P2-002 — Improve structured logging

**Files:**

- `src/infrastructure/logging/logger.js`
- `src/app.js`

Capture structured fields rather than only formatted HTTP log strings:

```text
requestId
userId
method
route
statusCode
durationMs
errorCode
```

Never log passwords, JWT values, cookies, payment secrets, or Supabase service credentials.

---

## BE-P2-003 — Add CI quality gates

**Files:**

- `.github/workflows/*` (create if absent)
- `package.json`

Minimum CI:

```text
npm ci
npm test
format check
Prisma validation/generation
OpenAPI validation
```

Deployment should occur only after CI passes.

---

## BE-P2-004 — Add database/index review after real query patterns are known

**File:** `prisma/schema.prisma`

Current indexes are a good MVP baseline. Revisit them after API integration and realistic query profiling. Do not add speculative indexes everywhere.

---

## BE-P2-005 — Defer caching/background jobs until required

Potential future infrastructure:

- Redis/cache for high-read catalog/recommendation workloads
- background jobs for email/notifications/file processing
- search engine if catalog search outgrows PostgreSQL

These are intentionally **not MVP blockers**.

---

# 6. Recommended implementation order

Do not execute tasks in arbitrary order.

```text
1. P0 Box Engine correctness
2. P0 Pricing consistency
3. P0 Order/inventory correctness
4. P0 Authorization
5. P1 API contract
6. P1 Automated tests
7. P1 Health/readiness
8. P1 deployment preparation
9. P2 observability/CI
10. Render deployment
11. Frontend integration
```

---

# 7. Definition of Done for MVP backend

The Box Engine is ready to connect to BoxKart when all of the following are true:

- [ ] No P0 findings remain.
- [ ] Box dimensions respect DB units.
- [ ] Box weight constraints work with all supported units.
- [ ] Pricing and Box Engine select the same tier.
- [ ] Currency is consistently INR.
- [ ] Inventory is protected against concurrent order creation.
- [ ] Order creation is idempotent.
- [ ] Orders contain immutable address snapshots.
- [ ] Customers cannot mutate operational order status.
- [ ] RFQ/quote resource ownership is enforced.
- [ ] OpenAPI documents every implemented route.
- [ ] OpenAPI contains request and response schemas.
- [ ] Stable error codes exist.
- [ ] Box Engine tests cover all six orientations and units.
- [ ] Pricing boundary tests pass.
- [ ] Auth/RBAC/ownership negative tests pass.
- [ ] `/health` and `/health/ready` work.
- [ ] Prisma migrations are safe for deployment.
- [ ] CI passes.
- [ ] Production environment variables are configured.
- [ ] Render deployment succeeds.
- [ ] Frontend can authenticate using the production cookie configuration.

---

# 8. Architecture decision

**Keep the current modular monolith.**

Do not split the Box Engine into separate deployed services at MVP stage. Keep domain logic pure and independently testable while allowing one Node.js service to expose the complete BoxKart API.

The future extraction boundary should be the domain module, not the deployment boundary.
