# BoxKart Box Engine — Pricing Engine

## 1. Purpose

Calculate authoritative prices for catalog products and cart/order contexts.

## 2. Inputs

```text
productId
quantity
customer context
optional promotion context
optional shipping context
```

## 3. MVP Pricing

Only quantity tiers.

Example:

```text
100-499    ₹14.00
500-999    ₹12.50
1000-4999  ₹11.80
5000+      ₹10.90
```

## 4. Algorithm

```text
validate quantity
 |
load active product
 |
load price tiers
 |
find matching tier
 |
calculate unit price
 |
calculate subtotal
 |
return money
```

## 5. Price Tier Selection

Find the tier where:

```text
minimumQuantity <= quantity
AND
maximumQuantity IS NULL
OR
quantity <= maximumQuantity
```

## 6. MOQ

If:

```text
quantity < product.moq
```

return:

```text
INVALID_QUANTITY
```

## 7. Money

Use integer minor units.

```text
₹12.50 -> 1250
```

Calculation:

```text
subtotalMinor = unitPriceMinor * quantity
```

## 8. No Floating Point Money

Never:

```js
12.5 * quantity
```

for authoritative financial calculations.

Use integer minor units.

## 9. Pricing API

```http
POST /api/v1/pricing/calculate
```

## 10. Future Pricing Layers

Architecture may later support:

```text
base tier price
+
customer pricing
+
volume discount
+
promotion
+
shipping
+
tax
```

But these are not MVP requirements.

## 11. Critical Rule

The frontend may display a price, but the backend must recalculate it before:

- checkout
- order creation
- quote acceptance
