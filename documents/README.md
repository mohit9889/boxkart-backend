# BoxKart Box Engine

Central backend engine for BoxKart.

## Stack

- Node.js
- JavaScript / ES6+
- PostgreSQL
- Prisma
- REST API
- Modular monolith

## First Command

```bash
npm install
```

## Environment

Copy:

```bash
cp .env.example .env
```

Set `DATABASE_URL` and required secrets.

## Prisma

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

## Development

```bash
npm run dev
```

## Production

```bash
npm run start
```

## Architecture

Read the documentation in this order:

1. `00_MASTER_INDEX.md`
2. `01_PRODUCT_REQUIREMENTS.md`
3. `02_ARCHITECTURE.md`
4. `03_DOMAIN_MODEL.md`
5. `04_DATABASE_SPEC.md`
6. `05_PRISMA_SCHEMA.md`
7. `06_API_SPEC.md`
8. `07_BOX_ENGINE_SPEC.md`
9. `08_PRICING_ENGINE_SPEC.md`
10. `09_AUTH_SECURITY_SPEC.md`
11. `10_STATE_MACHINES.md`
12. `11_FRONTEND_INTEGRATION.md`
13. `12_PROJECT_STRUCTURE.md`
14. `13_TESTING_SPEC.md`
15. `14_DEPLOYMENT_SPEC.md`
16. `15_ANTIGRAVITY_IMPLEMENTATION_PLAN.md`
17. `16_DEFINITION_OF_DONE.md`
18. `17_ARCHITECTURE_DECISIONS.md`

## Important

Do not implement future complexity before MVP requirements require it.

Do not change the API or database contract silently.
