# BoxKart Box Engine — State Machines

## RFQ

```text
DRAFT
  |
  v
SUBMITTED
  |
  v
UNDER_REVIEW
  |
  +----> REJECTED
  |
  v
QUOTED
  |
  v
ACCEPTED
  |
  v
CONVERTED_TO_ORDER
```

Valid alternative:

```text
SUBMITTED -> CANCELLED
UNDER_REVIEW -> CANCELLED
QUOTED -> EXPIRED
```

## Quote

```text
DRAFT
 |
 v
SENT
 |
 v
VIEWED
 |
 +----> REJECTED
 |
 +----> EXPIRED
 |
 v
ACCEPTED
```

## Order

```text
PENDING
 |
 v
CONFIRMED
 |
 v
PROCESSING
 |
 v
READY_TO_SHIP
 |
 v
SHIPPED
 |
 v
DELIVERED
```

Failure/cancellation paths:

```text
PENDING -> FAILED
PENDING -> CANCELLED
CONFIRMED -> CANCELLED
```

## Payment

```text
PENDING
 |
 +--> FAILED
 |
 v
AUTHORIZED
 |
 v
CAPTURED
 |
 v
REFUNDED
```

## Rules

State transitions must be implemented in domain/application services.

Do not allow controllers to directly assign arbitrary states.

Example:

```js
orderService.transition(orderId, 'SHIPPED')
```

The service verifies whether the transition is legal.

## Historical Protection

After an order is created:

- product snapshots cannot be rewritten
- totals should not be recalculated from current catalog data
- payment history must remain intact
