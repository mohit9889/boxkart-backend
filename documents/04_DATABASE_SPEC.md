# BoxKart Box Engine — Database Specification

## Database

PostgreSQL.

## ORM

Prisma.

## Primary Keys

Use UUIDs internally.

## Public Identifiers

Use readable identifiers:

```text
SKU: BX-CB-001
Order: BK-ORD-2026-000123
RFQ: BK-RFQ-2026-000041
Quote: BK-QT-2026-000018
```

## Money

Store integer minor units.

```text
₹12.50 -> 1250
```

Do not use floating point for money.

## Dimensions

Store:

```text
length
width
height
unit
```

Supported:

```text
MM
CM
INCH
```

Engine normalizes to millimetres.

## Weight

Store:

```text
weight
weightUnit
```

Engine normalizes to grams.

## Core Tables

```text
users
addresses

categories
products
box_specifications
product_images
product_price_tiers
inventory

carts
cart_items

orders
order_items
payments

rfqs
rfq_items
rfq_attachments

quotes
quote_items

custom_packaging_requests
```

## Important Constraints

Unique:

- users.email
- categories.slug
- products.sku
- products.slug
- orders.orderNumber
- rfqs.rfqNumber
- quotes.quoteNumber

Cart:

```text
unique(cartId, productId)
```

## JSONB

Allowed for snapshots:

- order address snapshot
- order product snapshot
- quote product snapshot

Do not put core searchable catalog data into JSONB.

## Delete Strategy

Prefer status-based deactivation for catalog/business entities.

Protect historical:

- orders
- payments
- accepted quotes
- converted RFQs

## Transactions

Required for:

- order creation
- quote acceptance to order conversion
- inventory-affecting operations

## Inventory

MVP:

```text
availableQuantity
reservedQuantity
```

Do not implement warehouse-level inventory yet.
