# BoxKart Box Engine — Deployment Specification

## MVP Goal

Keep infrastructure low-cost/free where practical while validating the business.

## Components

```text
Frontend
   |
Backend / Box Engine
   |
PostgreSQL
   |
Object Storage
```

## Environments

At minimum:

```text
development
production
```

Add staging when the team/workflow requires it.

## Required Environment Variables

```text
NODE_ENV
PORT

DATABASE_URL

SESSION_SECRET

FRONTEND_URL

CORS_ORIGINS

STORAGE_PROVIDER
STORAGE_BUCKET
STORAGE_ACCESS_KEY
STORAGE_SECRET_KEY

EMAIL_PROVIDER
EMAIL_FROM

PAYMENT_PROVIDER
PAYMENT_SECRET
```

Only define variables actually needed by the current implementation.

## Health Endpoint

```http
GET /health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

## Readiness

Optional:

```http
GET /ready
```

Checks critical dependencies.

## Logging

Use structured logs.

Include:

```text
timestamp
requestId
method
route
status
duration
errorCode
```

## Database

Use managed PostgreSQL.

Run:

```bash
npx prisma migrate deploy
```

during production deployment.

## Backups

Enable provider backups as soon as production data becomes important.

## Deployment Rule

Never deploy code that requires a database migration not yet applied.

Recommended sequence:

```text
compatible migration
 -> migration deployment
 -> application deployment
```

## Rollback

Application rollback must remain possible.

Database migrations should be designed carefully because database rollback is harder than application rollback.
