# BoxKart Box Engine — API Specification

## Base

```text
/api/v1
```

## Response Envelope

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
    "code": "ERROR_CODE",
    "message": "Human-readable message.",
    "details": {}
  }
}
```

## Authentication

```http
POST /auth/signup
POST /auth/login
POST /auth/logout
GET  /auth/me
```

Use secure HTTP-only cookies for MVP authentication.

## Catalog

```http
GET /products
GET /products/:slug

GET /categories
GET /categories/:slug
```

## Box Engine

```http
POST /box-finder/recommend
```

Request:

```json
{
  "product": {
    "length": 8,
    "width": 6,
    "height": 3,
    "unit": "INCH",
    "weight": 1.2,
    "weightUnit": "KG"
  },
  "requirements": {
    "quantity": 500,
    "fragile": true,
    "printingRequired": false
  },
  "preferences": {
    "priority": "BALANCED"
  }
}
```

## Pricing

```http
POST /pricing/calculate
```

## Cart

```http
GET    /cart
POST   /cart/items
PATCH  /cart/items/:itemId
DELETE /cart/items/:itemId
DELETE /cart
POST   /cart/validate
```

## Checkout

```http
POST /checkout/preview
POST /orders
```

## Orders

```http
GET /orders
GET /orders/:orderNumber
```

## RFQ

```http
GET  /rfqs
POST /rfqs
GET  /rfqs/:rfqNumber
POST /rfqs/:rfqNumber/submit
POST /rfqs/:rfqNumber/attachments
```

## Quotes

```http
GET  /rfqs/:rfqNumber/quotes
GET  /quotes/:quoteNumber
POST /quotes/:quoteNumber/accept
POST /quotes/:quoteNumber/reject
```

## Custom Packaging

```http
POST /custom-packaging/requests
```

## Admin

```http
GET    /admin/products
POST   /admin/products
GET    /admin/products/:id
PATCH  /admin/products/:id

GET    /admin/categories
POST   /admin/categories
PATCH  /admin/categories/:id

POST   /admin/products/:id/price-tiers
PATCH  /admin/price-tiers/:id
DELETE /admin/price-tiers/:id

GET    /admin/inventory
PATCH  /admin/inventory/:productId

GET    /admin/orders
GET    /admin/orders/:orderNumber
PATCH  /admin/orders/:orderNumber/status

GET    /admin/rfqs
GET    /admin/rfqs/:rfqNumber
PATCH  /admin/rfqs/:rfqNumber/status

POST   /admin/rfqs/:rfqNumber/quotes
```

## Security Rule

Never trust client-provided:

- prices
- totals
- discounts
- taxes
- inventory
- roles
- product status

The engine recalculates authoritative values.
