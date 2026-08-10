# BoxKart Box Engine — Antigravity Implementation Plan

This document is the execution plan.

## Global Rules

1. Use JavaScript, not TypeScript.
2. Use ES6+.
3. Do not introduce microservices.
4. Do not invent undocumented APIs.
5. Do not put business logic in controllers.
6. Do not trust frontend prices/totals.
7. Use Prisma for database access.
8. Use migrations.
9. Add tests with business logic.
10. Keep Box Engine pure and deterministic.
11. Do not add future modules unless required.
12. Update documentation when architecture changes.

---

# PHASE 0 — Repository Bootstrap

## TASK-001 — Create backend project

Create:

```text
box-engine/
```

Initialize Node.js project.

Acceptance:

- package.json exists
- JavaScript runtime configured
- start/dev scripts exist

## TASK-002 — Install core dependencies

Expected categories:

- HTTP framework
- Prisma
- validation
- password hashing
- authentication/session
- logging
- testing

Do not add unnecessary dependencies.

## TASK-003 — Create folder structure

Follow `12_PROJECT_STRUCTURE.md`.

## TASK-004 — Environment configuration

Create:

```text
.env
.env.example
```

Validate required environment variables at startup.

## TASK-005 — Basic server

Implement:

```http
GET /health
```

---

# PHASE 1 — Database

## TASK-006 — Configure PostgreSQL

Configure `DATABASE_URL`.

## TASK-007 — Implement Prisma schema

Implement all models from `05_PRISMA_SCHEMA.md`.

## TASK-008 — Run initial migration

```bash
npx prisma migrate dev --name init
```

## TASK-009 — Prisma client

Create centralized Prisma client.

Do not instantiate PrismaClient in every module.

## TASK-010 — Seed database

Create:

- categories
- sample products
- box specifications
- price tiers
- inventory
- development admin/customer

## TASK-011 — Database tests

Verify:

- relationships
- unique constraints
- price tiers
- cart uniqueness
- order snapshots

---

# PHASE 2 — Authentication

## TASK-012 — User registration

Implement:

```http
POST /api/v1/auth/signup
```

## TASK-013 — Password hashing

Implement secure hashing.

## TASK-014 — Login

Implement secure cookie/session behavior.

## TASK-015 — Auth middleware

Implement:

```text
requireAuth
```

## TASK-016 — Current user

Implement:

```http
GET /api/v1/auth/me
```

## TASK-017 — Logout

Implement:

```http
POST /api/v1/auth/logout
```

## TASK-018 — Role middleware

Implement:

```text
requireRole('ADMIN')
```

---

# PHASE 3 — Catalog

## TASK-019 — Category API

Implement list/details.

## TASK-020 — Product list

Implement:

- pagination
- filtering
- search
- sorting

## TASK-021 — Product details

Return:

- product
- box specification
- images
- price tiers
- availability

## TASK-022 — Catalog tests

---

# PHASE 4 — Box Engine

## TASK-023 — Dimension utilities

Implement:

```text
normalizeDimension
normalizeDimensions
normalizeWeight
```

## TASK-024 — Orientation generator

Generate all six orientations.

## TASK-025 — Fit engine

Implement pure deterministic fit calculation.

## TASK-026 — Candidate search

Query eligible products from PostgreSQL.

## TASK-027 — Recommendation scoring

Implement configurable scoring weights.

## TASK-028 — Priority profiles

Implement:

- BALANCED
- LOWEST_PRICE
- BEST_FIT
- BEST_PROTECTION

## TASK-029 — Box Finder service

Orchestrate:

```text
validation
candidate search
fit
scoring
pricing
ranking
```

## TASK-030 — Box Finder API

Implement:

```http
POST /api/v1/box-finder/recommend
```

## TASK-031 — Box Engine tests

At least:

- exact fit
- rotated fit
- no fit
- weight limit
- unit conversion
- ranking
- pricing integration

---

# PHASE 5 — Pricing Engine

## TASK-032 — Price tier repository

## TASK-033 — Price tier selection

## TASK-034 — Pricing calculator

## TASK-035 — Pricing API

```http
POST /api/v1/pricing/calculate
```

## TASK-036 — Pricing tests

Cover all tier boundaries.

---

# PHASE 6 — Cart

## TASK-037 — Get cart

## TASK-038 — Add cart item

## TASK-039 — Update cart item

## TASK-040 — Remove cart item

## TASK-041 — Clear cart

## TASK-042 — Cart validation

Validate:

- active product
- MOQ
- price
- inventory

---

# PHASE 7 — Checkout and Orders

## TASK-043 — Checkout preview

Calculate authoritative totals.

## TASK-044 — Order creation

Use transaction.

## TASK-045 — Order snapshots

Persist:

- SKU
- name
- relevant specifications
- price

## TASK-046 — Order retrieval

## TASK-047 — Order state machine

Implement legal transitions.

## TASK-048 — Payment abstraction

Do not hard-code payment provider logic into Order.

---

# PHASE 8 — RFQ / Bulk Procurement

## TASK-049 — RFQ creation

## TASK-050 — RFQ item handling

Support both:

```text
existing product
```

and:

```text
custom dimensions
```

## TASK-051 — RFQ submission

Implement state validation.

## TASK-052 — RFQ attachments

Implement object storage integration.

## TASK-053 — Quote creation

Admin only.

## TASK-054 — Quote retrieval

## TASK-055 — Quote accept/reject

## TASK-056 — Quote-to-order conversion

Use transaction.

## TASK-057 — Bulk order hub

Expose frontend-compatible RFQ workflow.

## TASK-058 — CSV validation

Validate uploaded rows.

## TASK-059 — XLSX validation

Parse and validate spreadsheet requirements.

## TASK-060 — Bulk upload to RFQ

Convert valid rows into RFQ items.

---

# PHASE 9 — Custom Packaging

## TASK-061 — Custom packaging request

## TASK-062 — Validation

Validate dimensions/material/quantity.

## TASK-063 — Link custom packaging to RFQ

---

# PHASE 10 — Admin

## TASK-064 — Admin product CRUD

## TASK-065 — Admin category CRUD

## TASK-066 — Admin price tiers

## TASK-067 — Admin inventory

## TASK-068 — Admin orders

## TASK-069 — Admin RFQs

## TASK-070 — Admin quotes

---

# PHASE 11 — Frontend Integration

## TASK-071 — Frontend API client

Centralize backend requests.

## TASK-072 — Product integration

Replace mock/static product data.

## TASK-073 — Box Finder integration

Connect Find My Box.

## TASK-074 — Pricing integration

Connect quantity pricing.

## TASK-075 — Cart integration

## TASK-076 — Checkout integration

## TASK-077 — Orders integration

## TASK-078 — RFQ integration

## TASK-079 — Authentication integration

---

# PHASE 12 — Production Hardening

## TASK-080 — Rate limiting

## TASK-081 — Security headers

## TASK-082 — CORS

## TASK-083 — Structured logging

## TASK-084 — Error handling

## TASK-085 — Input validation audit

## TASK-086 — Dependency audit

## TASK-087 — Database backup verification

---

# PHASE 13 — Testing

## TASK-088 — Unit tests

## TASK-089 — Integration tests

## TASK-090 — E2E tests

## TASK-091 — Authentication security tests

## TASK-092 — Cart/order concurrency tests

## TASK-093 — Box Engine regression tests

---

# PHASE 14 — Deployment

## TASK-094 — Production PostgreSQL

## TASK-095 — Backend deployment

## TASK-096 — Production environment variables

## TASK-097 — Migration deployment

## TASK-098 — Frontend API configuration

## TASK-099 — Production smoke tests

## TASK-100 — Monitoring and rollback documentation

---

# Implementation Gate

Do not move to the next phase if:

- current phase tests fail
- API contract changed without documentation
- schema changed without migration
- business logic is placed in controllers
- security requirements are incomplete

---

# Final MVP Gate

The MVP is ready only when:

```text
Customer signup
    ↓
Browse products
    ↓
Find My Box
    ↓
Get deterministic recommendations
    ↓
View quantity pricing
    ↓
Cart
    ↓
Checkout
    ↓
Order
```

and:

```text
Customer
    ↓
RFQ
    ↓
Admin
    ↓
Quote
    ↓
Customer accepts
    ↓
Order
```

both work end-to-end.
