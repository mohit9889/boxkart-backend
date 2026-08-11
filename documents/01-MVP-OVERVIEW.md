# BoxKart Box Engine — Simple MVP Overview

## 1. Purpose

Box Engine is the backend platform that powers the first BoxKart B2B packaging marketplace MVP. It provides a single REST API for customer identity, catalog discovery, box recommendations, pricing, cart and checkout workflows, orders, RFQs, quotes, custom packaging, and administration.

The MVP is designed to validate the BoxKart business with a small number of real users while keeping the architecture simple enough to operate and evolve quickly.

## 2. MVP user types

### Customer

A customer can:

- Create an account and log in.
- Browse packaging categories and products.
- Search/filter products.
- Use the Box Engine to find a suitable box for an item.
- Add products to a cart.
- Calculate server-authoritative pricing.
- Preview checkout and create orders.
- View order history and order details.
- Manage/select delivery information as supported by the checkout flow.
- Submit custom packaging RFQs.
- Upload RFQ design/specification attachments.
- View, accept, or reject quotes belonging to the customer.

### Admin

An administrator can:

- View operational dashboard information.
- Manage users and roles.
- Manage products/catalog inventory.
- Perform authorized operational order status changes.
- Manage RFQ/quote workflows according to the implemented admin APIs.

## 3. Core customer journeys

### Standard purchase

```text
Landing page
   ↓
Catalog
   ↓
Product details
   ↓
Add to cart
   ↓
Cart
   ↓
Pricing / checkout preview
   ↓
Checkout
   ↓
Order creation
   ↓
Order confirmation
   ↓
Order history
```

### Box Finder journey

```text
Customer item dimensions + weight
              ↓
        Box Engine API
              ↓
    Normalize units / validate
              ↓
       Test box candidates
              ↓
       Test orientations
              ↓
      Apply weight limits
              ↓
       Select price tier
              ↓
       Rank recommendations
              ↓
        Return results
```

### B2B RFQ journey

```text
Customer
   ↓
Create RFQ
   ↓
Specify packaging requirements
   ↓
Upload artwork/specification files
   ↓
RFQ submitted
   ↓
Admin reviews
   ↓
Quote created
   ↓
Customer views quote
   ↓
Accept / reject
```

## 4. MVP business rules

### Pricing

- Pricing is calculated by the backend.
- Frontend-supplied prices are never trusted for order totals.
- Price tiers are selected using quantity boundaries.
- Money is represented using integer minor units.
- MVP currency is INR.

### Box fitting

- Product/box dimensions have explicit units.
- Dimensions are normalized before comparison.
- The engine evaluates valid 3D orientations.
- Weight limits are normalized to a common unit before comparison.
- Results are deterministic and ranked consistently.

### Inventory

- Order creation must protect against overselling.
- Inventory changes and order creation occur transactionally.

### Orders

- Order creation is idempotent.
- Orders contain immutable snapshots of important purchase/address information.
- Customers cannot arbitrarily mutate operational order statuses.

### Security

- Authentication uses JWTs in HTTP-only cookies.
- Protected operations require authentication.
- Admin operations require the ADMIN role.
- Resource ownership is enforced for customer RFQs/quotes/orders.
- API traffic is protected with security headers, CORS controls, and rate limiting.

## 5. MVP non-goals

The first release intentionally does not require:

- Microservices.
- Kubernetes.
- Kafka or event streaming.
- Redis as a mandatory dependency.
- Multi-currency pricing.
- A generated frontend SDK.
- Complex warehouse management.
- Advanced payment orchestration.
- Large-scale analytics infrastructure.
- Fully automated manufacturing/fulfillment orchestration.

These can be introduced when actual product usage justifies them.

## 6. Success criteria

The MVP is successful when a real customer can complete the standard purchase journey without manual database intervention and a B2B customer can submit an RFQ and receive a quote through the intended workflow.

The backend must remain the source of truth for authentication, catalog state, pricing, inventory, orders, and RFQ/quote ownership.