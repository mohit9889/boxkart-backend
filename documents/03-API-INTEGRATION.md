# BoxKart Box Engine — API Integration Guide

## Base URLs

Production:

```text
https://box-engine.onrender.com
```

Business API prefix:

```text
/api/v1
```

Swagger UI:

```text
/api/reference
```

## API contract

### Success

```json
{
  "success": true,
  "data": {}
}
```

### Collection

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Frontend code should use `error.code` for conditional behavior.

## Infrastructure endpoints

### GET `/health`

Basic liveness check.

### GET `/health/ready`

Readiness check including database connectivity.

These infrastructure endpoints intentionally use a simple health response rather than the business API envelope.

## Authentication

Authentication uses JWTs stored in HTTP-only cookies.

Typical flow:

```text
POST /api/v1/auth/login
        ↓
Set-Cookie
        ↓
Browser stores cookie
        ↓
Subsequent API requests include cookie
```

For browser requests, configure the HTTP client to send credentials where required by the frontend/API deployment topology.

Do not expose the JWT to application JavaScript.

## Endpoint groups

### Authentication

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

### Catalog

```text
GET /api/v1/categories
GET /api/v1/categories/:slug
GET /api/v1/products
GET /api/v1/products/:slug
```

### Box Finder

```text
POST /api/v1/box-finder/recommend
```

The request contains item dimensions/weight according to the OpenAPI schema. The backend normalizes units and returns suitable catalog boxes.

### Cart

```text
GET    /api/v1/cart
POST   /api/v1/cart/items
DELETE /api/v1/cart/items/:itemId
```

### Pricing

```text
POST /api/v1/pricing/calculate
```

Pricing is authoritative on the server. Never use a client-supplied price as the source of truth for an order.

### Checkout

```text
POST /api/v1/checkout/preview
POST /api/v1/checkout/intent
```

### Orders

```text
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/:id
```

Order creation requires an `Idempotency-Key` according to the current API contract.

Operational order status changes are restricted to authorized admin/operations paths.

### RFQ

```text
POST /api/v1/rfq
POST /api/v1/rfq/:id/attachments
GET  /api/v1/rfq
GET  /api/v1/rfq/:id
PUT  /api/v1/rfq/:id/status
```

### Quotes

```text
GET  /api/v1/quotes
GET  /api/v1/quotes/:id
POST /api/v1/quotes/:id/accept
POST /api/v1/quotes/:id/reject
```

### Custom packaging

```text
POST /api/v1/custom-packaging
```

### Admin

Admin routes require the ADMIN role. Consult Swagger/OpenAPI for the complete current route list and schemas.

## Idempotency

For order creation:

```http
Idempotency-Key: <unique-value>
```

The client should generate a stable key for one logical order attempt and reuse that key when retrying the same request after a network failure.

Do not reuse an idempotency key for a different order.

## Error codes

Common codes include:

```text
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
RATE_LIMIT_EXCEEDED
PRODUCT_NOT_FOUND
NO_FIT_FOUND
INVALID_QUANTITY
BELOW_MOQ
INSUFFICIENT_INVENTORY
ORDER_NOT_FOUND
INVALID_ORDER_STATE
IDEMPOTENCY_CONFLICT
RFQ_NOT_FOUND
QUOTE_NOT_FOUND
INTERNAL_SERVER_ERROR
```

The exact set of codes is defined by the implementation and OpenAPI specification.

## Frontend integration rules

1. Centralize API calls in a frontend API/service layer.
2. Do not call the Box Engine URL directly from individual UI components.
3. Do not calculate authoritative prices in React.
4. Treat `data` as the successful payload.
5. Use `error.code` for application behavior.
6. Preserve `Idempotency-Key` on order retries.
7. Send credentials correctly for cookie authentication.
8. Handle 401 by refreshing application auth state rather than exposing JWT details.
9. Handle 429 with a user-friendly retry message.
10. Treat 5xx responses as server failures and avoid exposing raw server errors to customers.

## OpenAPI

The source of truth is:

```text
src/api-spec/openapi.yaml
```

Swagger UI is available at `/api/reference` in the deployed application.

When an API contract changes, update the OpenAPI document and frontend integration together.