# BoxKart Box Engine — Architecture Decision Records

## ADR-001 — Modular Monolith

### Decision

Use one backend with strongly separated modules.

### Reason

MVP scale does not justify microservices.

### Consequence

Simpler:

- deployment
- debugging
- transactions
- development
- local setup

Future modules can be extracted later.

---

## ADR-002 — PostgreSQL

### Decision

Use PostgreSQL as the primary database.

### Reason

BoxKart requires:

- relational integrity
- transactional commerce
- filtering
- structured catalog
- RFQ relationships

---

## ADR-003 — Prisma

### Decision

Use Prisma as ORM.

### Reason

Provides:

- typed schema metadata
- migrations
- convenient relational access
- developer-friendly workflow

Application code remains JavaScript.

---

## ADR-004 — Product Separate from BoxSpecification

### Decision

A sellable Product owns an optional BoxSpecification.

### Reason

BoxKart will sell packaging products beyond boxes.

---

## ADR-005 — Runtime Recommendations

### Decision

Do not persist recommendation scores.

### Reason

Recommendations depend on user input and context.

---

## ADR-006 — Runtime Pricing

### Decision

Store price tiers, calculate final prices in Pricing Engine.

### Reason

The database stores configuration; business rules determine results.

---

## ADR-007 — Integer Money

### Decision

Store monetary values as integer minor units.

### Reason

Avoid floating point financial errors.

---

## ADR-008 — HTTP-only Authentication Cookie

### Decision

Do not store authentication tokens in localStorage.

### Reason

Reduce token exposure to JavaScript/XSS.

---

## ADR-009 — Order Snapshots

### Decision

Orders preserve product/address snapshots.

### Reason

Catalog and customer data can change after purchase.

---

## ADR-010 — Deterministic Box Engine

### Decision

MVP Box Engine is rule-based, not AI/ML.

### Reason

Deterministic behavior is easier to:

- test
- explain
- debug
- trust

AI can be layered later.

---

## ADR-011 — API Versioning

### Decision

Use `/api/v1`.

### Reason

Allows future breaking API changes without immediately breaking the frontend.

---

## ADR-012 — No Premature Supplier/Warehouse Models

### Decision

Do not implement supplier/warehouse marketplace architecture in MVP.

### Reason

Current product validation should focus on customer demand and core packaging workflows.

---

## ADR-013 — Pure Fit Engine

### Decision

Fit calculations must be framework-independent pure JavaScript.

### Reason

This enables:

- unit testing
- reuse
- future service extraction
- possible browser-side simulation if ever useful
