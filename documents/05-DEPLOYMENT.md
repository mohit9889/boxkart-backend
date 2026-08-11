# BoxKart Box Engine — Deployment & Environment

## 1. Current deployment

The MVP backend is deployed as a Render web service.

```text
https://box-engine.onrender.com
```

Operational endpoints:

```text
/health
/health/ready
/api/reference
```

## 2. Deployment workflow

The deployment process follows a strict Continuous Integration gate:

1. **GitHub Actions (CI):** Pull requests and merges to `main` trigger a CI pipeline.
   - Spins up ephemeral PostgreSQL container.
   - Runs `npm ci`, `prisma generate`, `prisma migrate deploy`.
   - Runs `npm test` and OpenAPI validation.
   - Runs `npm audit`.
2. **GitHub Branch Protection:** A PR cannot be merged into `main` unless the CI pipeline passes.
3. **Render Auto-Deploy:** Once merged into `main`, Render automatically triggers a deployment.

The Render service installs dependencies, generates the Prisma client, applies committed migrations, and starts the Node.js application.

Production-style start command:

```bash
npm run start:prod
```

Database migration command:

```bash
npx prisma migrate deploy
```

The exact Render configuration is maintained in `render.yaml` and the Render dashboard.

## 3. Required environment configuration

Typical production configuration includes:

```text
NODE_ENV
PORT
DATABASE_URL
JWT_SECRET
FRONTEND_URL
SUPABASE_URL
SUPABASE_SERVICE_KEY
```

Secrets must be configured through Render environment variables or another secret manager. Never commit them to Git.

## 4. Database

Production uses PostgreSQL.

Deployment must apply committed Prisma migrations before serving the updated application.

Recommended sequence:

```text
Build
 ↓
Install dependencies
 ↓
Prisma generate
 ↓
Prisma migrate deploy
 ↓
Start application
 ↓
Readiness check
```

## 5. Health checks

### Liveness

```text
GET /health
```

Confirms that the application process is responding.

### Readiness

```text
GET /health/ready
```

Confirms that required dependencies, including PostgreSQL connectivity, are available.

Render should use the readiness endpoint as its service health check.

## 6. Production deployment checklist

Before deployment:

- [ ] Tests pass locally.
- [ ] Prisma migration exists for schema changes.
- [ ] `DATABASE_URL` points to the intended production database.
- [ ] JWT secret is production-only and sufficiently random.
- [ ] Frontend URL is correct.
- [ ] Supabase URL/service key are configured when attachment functionality is enabled.
- [ ] No secrets are committed.
- [ ] OpenAPI matches the implemented routes.

After deployment:

- [ ] `/health` returns successfully.
- [ ] `/health/ready` returns successfully.
- [ ] Swagger UI loads.
- [ ] Database-backed catalog endpoint works.
- [ ] Signup/login works.
- [ ] Authentication cookie is set with production attributes.
- [ ] Box Finder works with real catalog data.
- [ ] Pricing works with real price tiers.
- [ ] Cart/order flow works in a controlled test.
- [ ] RFQ attachment upload works if enabled.
- [ ] Render logs show no startup/migration errors.

## 7. Rollback

Application rollback and database rollback are different concerns.

For application-only failures:

1. Stop further releases.
2. Identify the bad deployment.
3. Roll back the application to the last known-good version using Render deployment controls.
4. Verify `/health/ready`.
5. Run a smoke test.

For database migration failures, do not blindly reverse migrations in production. Inspect the migration, take a database backup if appropriate, and follow a deliberate recovery plan.

## 8. Free-tier MVP note

The current Render free plan is acceptable for early MVP validation. It should not be treated as a guarantee of production-grade availability, performance, or scaling.

Move to paid compute and appropriately sized database infrastructure when customer traffic or business dependency requires it.

## 9. Domain strategy

A future production setup can use:

```text
Frontend: https://boxkart.com
API:      https://api.boxkart.com
```

The application should receive the frontend origin through configuration rather than hardcoding environment-specific URLs.