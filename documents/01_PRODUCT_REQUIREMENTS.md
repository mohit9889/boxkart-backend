# BoxKart Box Engine — Product Requirements

## 1. Vision

BoxKart is a B2B packaging marketplace focused initially on North India.

The Box Engine is the backend system that powers the entire customer experience.

The frontend should not own business-critical packaging intelligence.

## 2. MVP Users

### Customer

Can:

- browse products
- search products
- inspect box specifications
- use Find My Box
- receive box recommendations
- see quantity-based pricing
- add products to cart
- checkout
- view orders
- submit RFQs
- request custom packaging
- review/accept quotes

### Admin

Can:

- manage categories
- manage products
- manage box specifications
- manage price tiers
- manage inventory
- view/update orders
- review RFQs
- create quotes
- manage quote lifecycle

## 3. Product Types

Initial supported types:

- CORRUGATED_BOX
- MAILER_BOX
- PAPER_MAILER
- BUBBLE_MAILER
- TAPE
- STRETCH_FILM
- VOID_FILL
- INSERT
- OTHER

## 4. Core User Journey

```text
Homepage
  |
What are you shipping?
  |
Find My Box
  |
Enter product dimensions/weight
  |
Box Engine
  |
Recommended boxes
  |
Select quantity
  |
Pricing Engine
  |
Cart
  |
Checkout
  |
Order
```

## 5. B2B Journey

```text
Bulk requirement
  |
RFQ
  |
Admin review
  |
Quote
  |
Customer acceptance
  |
Order
```

## 6. MVP Principles

- transparent pricing
- minimum order quantity
- deterministic box recommendations
- reliable order totals
- secure authentication
- auditable state transitions
- simple deployment
- low infrastructure cost

## 7. Out of Scope for MVP

Do not build initially:

- supplier marketplace
- warehouse management
- advanced shipping orchestration
- loyalty program
- reviews
- coupons
- complex promotions
- AI chatbot
- recommendation ML
- multi-currency
- multi-country tax engine
- organization hierarchy
- multi-warehouse inventory

Design extension points, but do not implement them prematurely.
