# BoxKart Box Engine — Frontend Integration

## 1. Principle

The existing BoxKart frontend should become a client of the Box Engine.

Do not duplicate business logic in the frontend.

## 2. Frontend Responsibilities

Frontend owns:

- UI
- navigation
- form interaction
- presentation
- local UI state
- loading states
- error display
- accessibility

Backend owns:

- pricing
- fit
- recommendation
- inventory
- order totals
- authorization
- state transitions

## 3. API Client

Create one API client abstraction.

Example:

```text
src/lib/api/
  client.js
  auth.js
  products.js
  boxFinder.js
  pricing.js
  cart.js
  orders.js
  rfqs.js
```

Do not call fetch directly from every component.

## 4. Box Finder Integration

Existing:

```text
Find My Box
```

should call:

```http
POST /api/v1/box-finder/recommend
```

The frontend renders returned recommendations.

## 5. Product Page

Use:

```http
GET /api/v1/products/:slug
```

## 6. Cart

Use:

```http
GET /api/v1/cart
POST /api/v1/cart/items
PATCH /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
```

## 7. Checkout

Always:

```text
cart
 -> validate
 -> checkout preview
 -> create order
```

Do not trust displayed totals.

## 8. Error Handling

Map backend codes to UI behavior.

Examples:

```text
PRODUCT_NOT_FOUND
INVALID_QUANTITY
OUT_OF_STOCK
PRICE_CHANGED
CART_CHANGED
UNAUTHORIZED
FORBIDDEN
QUOTE_EXPIRED
```

## 9. Environment

Frontend:

```text
NEXT_PUBLIC_API_BASE_URL
```

Do not hard-code deployment URLs.

## 10. API Contract Stability

Frontend should depend on `/api/v1`.

Breaking changes require a new API version.
