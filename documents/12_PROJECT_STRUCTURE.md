# BoxKart Box Engine — Project Structure

Recommended:

```text
box-engine/
├── src/
│   ├── app.js
│   ├── server.js
│   │
│   ├── config/
│   │   ├── env.js
│   │   └── constants.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── requestId.js
│   │   ├── rateLimit.js
│   │   └── validation.js
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── box-engine/
│   │   ├── pricing/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── rfq/
│   │   ├── quotes/
│   │   ├── custom-packaging/
│   │   └── admin/
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   ├── storage/
│   │   ├── payments/
│   │   └── email/
│   │
│   ├── routes/
│   │   └── index.js
│   │
│   └── utils/
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Module Convention

Example:

```text
box-engine/
├── boxFinder.controller.js
├── boxFinder.routes.js
├── boxFinder.service.js
├── candidateSearch.service.js
├── fitEngine.js
├── recommendationEngine.js
├── boxFinder.validation.js
└── index.js
```

## Pure Domain Functions

Keep pure algorithms separate:

```text
fitEngine.js
dimensionUtils.js
scoringUtils.js
pricingCalculator.js
```

## Naming

Use JavaScript/ES6.

Prefer:

```text
camelCase.js
```

Avoid TypeScript for this project.

## Environment

`.env` is local-only.

`.env.example` contains names but no secrets.
