# BoxKart Box Engine — Domain Model

## Identity

### User

Represents customer/admin identity.

### Address

Represents reusable customer address.

Order addresses are snapshots.

## Catalog

### Category

Groups products.

### Product

Sellable catalog item.

### BoxSpecification

Physical packaging characteristics.

### ProductImage

Product media.

### ProductPriceTier

Quantity-based pricing configuration.

### Inventory

Current simple stock state.

## Commerce

### Cart

Customer's active shopping basket.

### CartItem

Product and quantity in cart.

### Order

Commercial purchase.

### OrderItem

Historical product/price snapshot inside an order.

### Payment

Payment attempt/state.

## Procurement

### RFQ

Request for quotation.

### RFQItem

Individual procurement requirement.

### RFQAttachment

Uploaded specification/artwork/file metadata.

### Quote

Commercial response to RFQ.

### QuoteItem

Quoted line item.

### CustomPackagingRequest

Requirements for custom packaging.

## Critical Separation

```text
Product != BoxSpecification
RFQ != Quote
Quote != Order
ProductPriceTier != Final Price
Product != Recommendation
```

## Product vs Box

```text
Product
 |
 +-- sku
 +-- name
 +-- productType
 |
 +-- BoxSpecification
       +-- dimensions
       +-- material
       +-- ply
       +-- flute
```

## Historical Data

Orders and accepted quotes must preserve snapshots.

Catalog changes must not alter historical transactions.

## Future Extension Points

Conceptually reserve:

```text
Organization
Supplier
Warehouse
Shipment
Promotion
```

Do not implement these in MVP unless required.
