# BoxKart Box Engine

The **Box Engine** is the backend platform for the BoxKart B2B packaging marketplace. It is a Node.js + Express modular monolith that provides authentication, catalog APIs, deterministic box recommendations, tiered pricing, carts, checkout/order workflows, RFQs, quotes, custom packaging, and admin operations.

> **MVP status:** Deployed on Render and ready for controlled MVP use. The backend is intentionally designed as a modular monolith; it is not split into microservices.

## Live deployment

- **API:** https://box-engine.onrender.com/
- **Health:** https://box-engine.onrender.com/health
- **Readiness:** https://box-engine.onrender.com/health/ready
- **Swagger UI:** https://box-engine.onrender.com/api/reference

## What the MVP provides

- Customer signup/login/logout with JWTs stored in HTTP-only cookies.
- Product and category catalog APIs.
- Deterministic 3D box-fit recommendations with dimension and weight-unit normalization.
- Server-authoritative tiered pricing using integer minor currency units.
- User carts and checkout/order workflows.
- Atomic inventory protection and order idempotency.
- Immutable order address/product snapshots.
- Customer RFQs, attachments, quotes, and custom packaging requests.
- Admin dashboard, user role management, product management, and operational order controls.
- Standardized API success/error responses and OpenAPI documentation.
- Helmet, CORS, rate limiting, request IDs, structured logging, and readiness checks.

## Technology stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| API | Express 5 |
| Validation | Zod |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Authentication | JWT + HTTP-only cookies |
| File storage | Supabase Storage |
| API documentation | OpenAPI 3.1 + Swagger UI |
| Security middleware | Helmet + CORS + rate limiting |
| Logging | Winston + Morgan |
| Tests | Jest + Supertest |
| Deployment | Render |

## Repository structure

```text
.
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── src/
│   ├── api-spec/
│   │   └── openapi.yaml
│   ├── config/
│   ├── infrastructure/
│   ├── middleware/
│   ├── modules/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── box-engine/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── checkout/
│   │   ├── custom-packaging/
│   │   ├── order/
│   │   ├── pricing/
│   │   ├── quotes/
│   │   └── rfq/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── documents/
├── render.yaml
├── package.json
└── README.md
```

## Architecture

```text
BoxKart Frontend
       |
       | HTTPS / REST
       v
+-------------------------+
| Node.js + Express       |
|                         |
| Auth / Catalog          |
| Box Engine / Pricing    |
| Cart / Checkout / Order |
| RFQ / Quotes            |
| Custom Packaging        |
| Admin                   |
+------------+------------+
             |
             v
          Prisma
             |
             v
        PostgreSQL
             |
             +------------------+
             |                  |
             v                  v
       Business data      Supabase Storage
                          (RFQ attachments)
```

Business rules live in services/domain modules. The Box Engine and pricing logic are deliberately kept deterministic and testable without coupling the core calculations to Express.

## API

All business APIs are under `/api/v1`.

### Main endpoint groups

| Group | Purpose |
|---|---|
| `/api/v1/auth` | Signup, login, current user, logout |
| `/api/v1/categories` | Product categories |
| `/api/v1/products` | Catalog, search, filtering, pagination |
| `/api/v1/box-finder` | Box-fit recommendations |
| `/api/v1/cart` | Active shopping cart |
| `/api/v1/pricing` | Server-side price calculation |
| `/api/v1/checkout` | Checkout preview and order intent |
| `/api/v1/orders` | Customer order creation/history/details |
| `/api/v1/rfq` | Custom packaging RFQs |
| `/api/v1/quotes` | RFQ quotes and customer quote actions |
| `/api/v1/custom-packaging` | Custom packaging requests |
| `/api/v1/admin` | Admin-only operational APIs |

The canonical API contract is documented in [`src/api-spec/openapi.yaml`](src/api-spec/openapi.yaml) and exposed through Swagger UI.

## API response contract

Successful responses use:

```json
{
  "success": true,
  "data": {}
}
```

Collection endpoints may include:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Errors use stable machine-readable codes:

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

Frontend code should branch on `error.code`, not on human-readable messages.

## Local development

### Prerequisites

- Node.js 20+ recommended.
- PostgreSQL database.
- Supabase project if RFQ attachment storage is required.

### Install

```bash
npm ci
npx prisma generate
```

### Environment

Create `.env` locally. Never commit secrets.

Typical variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
```

### Database

For an existing migration history:

```bash
npx prisma migrate deploy
```

For local development, use the normal Prisma development workflow appropriate to your environment.

### Seed

```bash
npm run seed
```

### Start

```bash
npm run dev
```

Production-style start:

```bash
npm run start:prod
```

## Tests

```bash
npm test
```

Tests should cover the deterministic Box Engine, pricing boundaries, authorization, inventory/order integrity, idempotency, and API contracts.

## Deployment

The current deployment is configured for Render. The deployment flow runs the application from the repository and applies committed Prisma migrations before starting the service.

See [`documents/05-DEPLOYMENT.md`](documents/05-DEPLOYMENT.md) for the production deployment checklist.

## Documentation

The `documents/` directory contains the project documentation:

- [MVP Overview](documents/01-MVP-OVERVIEW.md)
- [Backend Architecture](documents/02-BACKEND-ARCHITECTURE.md)
- [API & Integration Guide](documents/03-API-INTEGRATION.md)
- [Data Model](documents/04-DATA-MODEL.md)
- [Deployment & Environment](documents/05-DEPLOYMENT.md)
- [Security](documents/06-SECURITY.md)
- [Operations & Production Checklist](documents/07-OPERATIONS.md)
- [Frontend Integration](documents/08-FRONTEND-INTEGRATION.md)

## Important design decisions

1. **Modular monolith first.** BoxKart does not need microservices at MVP scale.
2. **Backend owns price truth.** Frontend prices are display data only; order totals are recalculated server-side.
3. **Integer money.** Monetary values are represented in minor units such as paise.
4. **Deterministic Box Engine.** Fit calculations normalize units, test valid orientations, filter invalid candidates, and return deterministic recommendations.
5. **Database integrity over convenience.** Inventory and order creation use transactional protections.
6. **Stable API errors.** Frontend integrations use machine-readable error codes.
7. **HTTP-only authentication cookies.** JWTs are not exposed to browser JavaScript.
8. **OpenAPI is the integration contract.** API changes should update the OpenAPI document and frontend integration together.

## Current MVP boundaries

The MVP intentionally does not attempt to solve every future platform concern. Advanced payments, sophisticated fulfillment orchestration, background job infrastructure, multi-currency, analytics pipelines, and microservice decomposition can be added later when actual usage requires them.
