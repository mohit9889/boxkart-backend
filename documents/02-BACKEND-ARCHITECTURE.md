# BoxKart Box Engine — Backend Architecture

## 1. Architecture principles

The backend is intentionally a **modular monolith**.

The primary goals are:

- Keep deployment simple for the MVP.
- Keep business logic isolated from HTTP concerns.
- Keep Box Engine and pricing calculations deterministic and testable.
- Keep PostgreSQL as the transactional source of truth.
- Avoid distributed-system complexity until product usage requires it.

Do not introduce microservices merely to separate modules. The current boundaries are code-level module boundaries, not network boundaries.

## 2. High-level architecture

```text
                    BoxKart Frontend
                           |
                      HTTPS / REST
                           |
                           v
              +-------------------------+
              |       Express API       |
              |-------------------------|
              | Middleware              |
              | Routes                  |
              | Controllers             |
              +------------+------------+
                           |
                           v
              +-------------------------+
              |      Domain / Services  |
              |-------------------------|
              | Auth                    |
              | Catalog                 |
              | Box Engine              |
              | Pricing                 |
              | Cart                    |
              | Checkout                |
              | Orders                  |
              | RFQ                     |
              | Quotes                  |
              | Custom Packaging        |
              | Admin                   |
              +------------+------------+
                           |
                           v
                       Prisma ORM
                           |
                           v
                     PostgreSQL DB
                           |
                +----------+----------+
                |                     |
                v                     v
        transactional data      Supabase Storage
                                RFQ attachments
```

## 3. Request lifecycle

A typical request follows:

```text
HTTP request
   ↓
Request ID / logging
   ↓
Security middleware
   ↓
CORS / rate limiting
   ↓
Authentication (when required)
   ↓
Role/ownership authorization
   ↓
Route validation
   ↓
Controller
   ↓
Service
   ↓
Domain logic / Prisma
   ↓
Controller response
   ↓
Global error handler when needed
```

Controllers should remain thin. Services own use-case orchestration. Pure domain functions should contain deterministic business calculations where practical.

## 4. Module responsibilities

### Auth

Owns signup, login, current-user lookup, and logout. JWT authentication is stored in an HTTP-only cookie.

### Catalog

Provides categories and products, including active-product filtering, search, and pagination.

### Box Engine

The recommendation engine converts customer input into normalized dimensions/weight, evaluates candidate boxes, checks orientations and constraints, resolves applicable pricing, and returns deterministic recommendations.

### Pricing

Owns the canonical quantity-to-price-tier rules and calculates monetary totals using integer minor units.

### Cart

Owns the authenticated customer's active cart and quantity changes. It does not become the authority for final order pricing.

### Checkout

Combines cart, pricing, address, and order prerequisites into a checkout preview/intent flow.

### Order

Creates immutable order records, protects inventory during creation, handles idempotency, and exposes customer-safe order operations plus authorized operational status changes.

### RFQ

Owns customer requests for custom packaging and related attachments.

### Quotes

Owns quote creation/read/action workflows associated with RFQs and enforces customer ownership.

### Custom Packaging

Captures custom structural/packaging requirements associated with an RFQ.

### Admin

Contains privileged operational APIs. ADMIN authorization is mandatory for administrative actions.

## 5. Data layer

Prisma is the ORM and PostgreSQL is the transactional database.

Important model groups:

```text
Identity
  User
  Address

Catalog
  Category
  Product
  BoxSpecification
  ProductImage
  ProductPriceTier
  Inventory

Commerce
  Cart
  CartItem
  Order
  OrderItem
  Payment

B2B
  RFQ
  RFQItem
  RFQAttachment
  Quote
  QuoteItem
  CustomPackagingRequest
```

Historical commerce records contain snapshots where mutable catalog/customer data must not change historical meaning.

## 6. Money model

Prices use integer minor units:

```text
₹100.50 → 10050 paise
```

Do not use JavaScript floating-point arithmetic for authoritative monetary calculations.

The backend calculates:

- unit price
- discounts
- tax
- shipping
- subtotal
- final total

The frontend displays these values but is not trusted to determine the final order amount.

## 7. Box Engine architecture

The Box Engine should remain split between deterministic domain logic and infrastructure orchestration.

```text
box-engine.service.js
        |
        +--> load candidate products/specifications
        |
        +--> normalize input
        |
        +--> fit.domain.js
        |       |
        |       +--> dimension conversion
        |       +--> orientation evaluation
        |       +--> fit decision
        |       +--> scoring/ranking
        |
        +--> pricing tier selection
        |
        +--> response mapping
```

The domain layer should not depend on Express, Prisma, HTTP requests, or cookies.

## 8. Authentication and authorization

Authentication:

```text
Login
  ↓
Verify password
  ↓
Create JWT
  ↓
Set HTTP-only cookie
  ↓
Authenticated request
  ↓
Read/verify cookie
  ↓
Attach user context
```

Authorization has two layers:

1. **Role authorization** — e.g. ADMIN-only endpoints.
2. **Resource ownership** — a customer may only access their own orders/RFQs/quotes and other protected resources.

## 9. Transaction boundaries

Database transactions are required for operations where multiple records must succeed or fail together.

The order transaction is especially important:

```text
Begin transaction
  ↓
Validate cart and customer state
  ↓
Recalculate authoritative pricing
  ↓
Validate address ownership
  ↓
Reserve/decrement inventory atomically
  ↓
Create order + order items
  ↓
Convert/clear cart
  ↓
Commit
```

If any step fails, the transaction must roll back.

## 10. Idempotency

Order creation accepts an `Idempotency-Key` so that network retries cannot create duplicate orders.

The database uniqueness constraint is part of the protection; application-level lookup alone is not sufficient against concurrent requests.

## 11. Error architecture

Expected business errors use the application's `AppError` abstraction and stable codes.

Example:

```js
throw new AppError('Product not found', {
  code: 'PRODUCT_NOT_FOUND',
  statusCode: 404
});
```

Unexpected errors are handled centrally and exposed as:

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Internal server error"
  }
}
```

Internal stack traces and infrastructure details must not be returned to clients.

## 12. API contract

Business API success responses use:

```json
{
  "success": true,
  "data": {}
}
```

Paginated responses may include `meta`.

Errors use stable machine-readable `error.code` values. Human-readable `error.message` is not a machine contract.

## 13. Infrastructure

Current MVP infrastructure:

```text
GitHub
  ↓
Render Web Service
  ↓
Node.js / Express
  ↓
PostgreSQL

Supabase Storage
  ↑
RFQ attachment uploads
```

Render handles application hosting. PostgreSQL is the transactional database. Supabase Storage is used for file storage.

## 14. Scaling strategy

Scale in this order only when measurements justify it:

1. Query/index optimization.
2. Application resource sizing.
3. PostgreSQL sizing/indexing.
4. Safe response caching for read-heavy data.
5. Background jobs for slow non-transactional work.
6. Separate services only when a clear operational boundary exists.

Do not add distributed infrastructure before the MVP demonstrates the need.