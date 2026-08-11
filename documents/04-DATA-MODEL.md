# BoxKart Box Engine — Data Model

## 1. Database overview

The application uses PostgreSQL through Prisma.

The schema is defined in:

```text
prisma/schema.prisma
```

## 2. Entity groups

```text
USER
 ├── ADDRESS
 ├── CART ── CART_ITEM ── PRODUCT
 ├── ORDER ── ORDER_ITEM ── PRODUCT
 └── RFQ
      ├── RFQ_ITEM ── PRODUCT (optional)
      ├── RFQ_ATTACHMENT
      ├── QUOTE ── QUOTE_ITEM ── PRODUCT (optional)
      └── CUSTOM_PACKAGING_REQUEST

PRODUCT
 ├── CATEGORY
 ├── BOX_SPECIFICATION (optional, one-to-one)
 ├── PRODUCT_IMAGE
 ├── PRODUCT_PRICE_TIER
 └── INVENTORY (one-to-one)
```

## 3. Core entities

### User

Represents a BoxKart account.

Important attributes:

- `id`
- `email`
- `passwordHash`
- `role`
- `status`
- profile fields
- timestamps

Roles currently include:

```text
CUSTOMER
ADMIN
```

### Address

Belongs to a user and contains delivery information. Address ownership must be checked before an address is used during checkout.

### Category

Catalog grouping with a unique slug and active/inactive status.

### Product

Represents a sellable packaging product.

Important fields include:

- SKU
- name/slug
- category
- product type
- status
- MOQ
- product weight
- unit

### BoxSpecification

Optional specification associated with a product when the product is usable by the Box Engine.

Dimensions:

```text
internalLength
internalWidth
internalHeight
externalLength
externalWidth
externalHeight
DimensionUnit
```

Weight constraint:

```text
maxRecommendedWeight
WeightUnit
```

### ProductPriceTier

Defines quantity-based pricing:

```text
minimumQuantity
maximumQuantity (nullable)
unitPriceMinor
currency
```

Canonical applicability:

```text
quantity >= minimumQuantity
AND
(maximumQuantity is null OR quantity <= maximumQuantity)
```

### Inventory

One inventory record per product.

```text
availableQuantity
reservedQuantity
status
```

Inventory changes that affect order creation must occur transactionally.

### Cart / CartItem

Each customer has an active cart containing product quantities. Cart data is not authoritative for final order price or inventory availability.

### Order / OrderItem

Orders preserve important snapshots so later catalog changes do not rewrite historical purchases.

Order monetary values are integer minor units:

```text
subtotalMinor
discountMinor
shippingMinor
taxMinor
totalMinor
```

Orders also contain:

- order number
- user
- status
- payment status
- currency
- shipping address snapshot
- billing address snapshot
- idempotency key

### Payment

Represents payment state associated with an order. The MVP supports multiple payment method/status values in the data model; payment-provider integration can evolve independently.

### RFQ

Represents a customer's request for custom packaging.

It can contain items, attachments, quotes, and a custom packaging request.

### RFQAttachment

Stores metadata and the storage URL for customer-uploaded files. File contents are stored in Supabase Storage rather than PostgreSQL.

### Quote / QuoteItem

A quote is associated with an RFQ and contains itemized commercial terms.

### CustomPackagingRequest

Stores structural/custom packaging requirements associated with one RFQ.

## 4. Important constraints

The schema uses database constraints to reinforce application rules:

- User email is unique.
- Category slug is unique.
- Product SKU and slug are unique.
- Box specification is one-to-one with a product.
- Inventory is one-to-one with a product.
- Cart is one-to-one with a user.
- Cart item product is unique within a cart.
- Order number is unique.
- Idempotency key is unique.
- RFQ number is unique.
- Quote number is unique.
- Custom packaging request is one-to-one with an RFQ.

## 5. Historical snapshots

The order model deliberately stores JSON snapshots for shipping/billing addresses and order-item product data.

This protects historical records from later changes such as:

```text
Customer changes address
Product name changes
Product SKU changes
Product dimensions change
Catalog price changes
```

The historical order must continue to represent what was purchased at the time.

## 6. Money representation

Never store authoritative monetary values as JavaScript floating-point numbers.

The database and API use integer minor units for commerce calculations.

Example:

```text
₹250.75

25075 paise
```

## 7. Unit representation

Dimensions use:

```text
MM
CM
INCH
```

Weights use:

```text
GRAM
KG
LB
```

The Box Engine normalizes values before performing comparisons.

## 8. Migration policy

Committed Prisma migrations are the production database change history.

Production deployment should use:

```bash
npx prisma migrate deploy
```

Do not use `prisma db push` as the production migration mechanism.

## 9. Source of truth

The authoritative schema is always:

```text
prisma/schema.prisma
```

This document explains the model; it is not a replacement for the schema.