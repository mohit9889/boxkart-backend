# BoxKart Box Engine — Prisma Schema Contract

The Prisma schema must contain these models:

```text
User
Address

Category
Product
ProductImage
BoxSpecification
ProductPriceTier
Inventory

Cart
CartItem

Order
OrderItem
Payment

RFQ
RFQItem
RFQAttachment

Quote
QuoteItem

CustomPackagingRequest
```

## Required Enums

```text
UserRole
UserStatus
CategoryStatus
ProductType
ProductStatus
DimensionUnit
WeightUnit
InventoryStatus
CartStatus
OrderStatus
PaymentStatus
PaymentMethod
RFQStatus
QuoteStatus
AttachmentType
```

## Required Relationships

```text
User -> Address[]
User -> Cart?
User -> Order[]
User -> RFQ[]

Category -> Product[]

Product -> BoxSpecification?
Product -> ProductImage[]
Product -> ProductPriceTier[]
Product -> Inventory?
Product -> CartItem[]
Product -> OrderItem[]
Product -> RFQItem[]
Product -> QuoteItem[]

Cart -> CartItem[]

Order -> OrderItem[]
Order -> Payment[]

RFQ -> RFQItem[]
RFQ -> RFQAttachment[]
RFQ -> Quote[]
RFQ -> CustomPackagingRequest?

Quote -> QuoteItem[]
```

## Prisma Rules

- UUID IDs
- PostgreSQL
- timestamps on major entities
- indexes for common filters
- unique public identifiers
- explicit relation fields
- deliberate `onDelete`
- Decimal for dimensions/weights where precision matters
- Int for money minor units

## Migration Commands

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

Production:

```bash
npx prisma migrate deploy
```

Never use `prisma db push` as the normal production migration strategy.
