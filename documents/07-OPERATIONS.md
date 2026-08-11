# BoxKart Box Engine — Operations & Production Checklist

## 1. Release readiness

Before merging a release:

- [ ] All tests pass.
- [ ] API contract changes are reflected in OpenAPI.
- [ ] Prisma schema changes have a migration.
- [ ] No secrets are committed.
- [ ] Security-sensitive changes have negative tests.
- [ ] Box Engine unit tests pass.
- [ ] Pricing boundary tests pass.
- [ ] Order/inventory transaction tests pass.
- [ ] Idempotency tests pass.
- [ ] Authorization tests pass.

## 2. Deployment verification

After Render deployment:

```text
GET /health
GET /health/ready
GET /api/reference
```

Then perform a controlled API smoke test:

```text
Signup
 ↓
Login
 ↓
Me
 ↓
Catalog
 ↓
Box Finder
 ↓
Pricing
 ↓
Cart
 ↓
Checkout preview
```

For order-enabled environments, also test order creation and order retrieval with a test account.

## 3. Business smoke test

### Customer

- [ ] Signup.
- [ ] Login.
- [ ] Browse categories.
- [ ] Browse products.
- [ ] Find a box.
- [ ] Add item to cart.
- [ ] Update quantity.
- [ ] Preview checkout.
- [ ] Create an order.
- [ ] View order.
- [ ] Verify inventory changed correctly.

### B2B

- [ ] Create RFQ.
- [ ] Add RFQ details.
- [ ] Upload an attachment.
- [ ] Retrieve RFQ.
- [ ] Create/view quote through authorized workflow.
- [ ] Accept/reject quote as the owning customer.

### Admin

- [ ] Admin login.
- [ ] Dashboard.
- [ ] User management.
- [ ] Product management.
- [ ] Authorized order status management.

## 4. Monitoring

For the MVP, keep monitoring lightweight and actionable:

- **Uptime Monitoring:** Configure UptimeRobot, BetterUptime, or a similar external tool to ping `https://box-engine.onrender.com/health` every 5 minutes.
- **Infrastructure Readiness:** Render is configured to ping `/health/ready` to ensure database connectivity before routing traffic.
- **Log Monitoring:** Filter Render's log streams for HTTP 5xx or `error` level messages.
- **Alerting:** Route downtime and 5xx alerts to a dedicated engineering email or Slack channel.

Use request IDs in logs to correlate frontend reports with server failures.

## 5. Database continuity

Current Supabase Configuration (Verified):
- **Provider:** Supabase
- **Region:** ap-south-1 (Mumbai)
- **Plan:** Free Tier
- **Backups:** Daily logical backups
- **Retention:** 24 hours
- **PITR (Point-in-Time Recovery):** Not available on Free Tier (Requires Pro)
- **Restore mechanism:** Manual download of daily SQL dump and execution against a new project.

### Quarterly Restore Drill
A quarterly restore drill is required to ensure business continuity. Execute the following sequence:

1. Download the latest daily backup from the Supabase Dashboard.
2. Spin up a new Staging Project in Supabase.
3. Restore the SQL dump into the staging database.
4. Run `npx prisma migrate deploy` to ensure migration compatibility.
5. Point the local application (`.env`) to the staging database and ensure the application starts.
6. Verify critical data integrity:
   - Authentication works (login as test user).
   - Catalog and Box Engine calculations work.
   - Orders can be read.
   - RFQs can be read.
   - No unexpected data corruption exists.

## 6. Incident response

When a serious production issue occurs:

1. Identify the affected capability.
2. Check Render/application logs using the request ID where available.
3. Check database readiness.
4. Stop or roll back the affected deployment if necessary.
5. Protect customer/order data first.
6. Verify inventory/order integrity.
7. Apply a tested fix.
8. Re-run smoke tests.
9. Document the root cause and preventive action.

## 7. Data integrity priorities

During an incident, prioritize:

```text
Orders
  ↓
Payments
  ↓
Inventory
  ↓
Customer/RFQ data
  ↓
Catalog
  ↓
Non-critical analytics
```

Do not manually edit production order or inventory records without a documented recovery reason.

## 8. Scaling triggers

Consider infrastructure changes when actual measurements show:

- High request latency.
- Database CPU/connection pressure.
- Increasing order volume.
- Large RFQ upload volume.
- Slow synchronous operations.
- Increased 5xx rates.
- Need for background processing.

Do not introduce distributed infrastructure merely because the application has multiple modules.

## 9. MVP operating principle

Keep the system simple until customer usage demonstrates the need for additional infrastructure.

The preferred progression is:

```text
Optimize existing code
        ↓
Improve database/indexes
        ↓
Increase service resources
        ↓
Add targeted caching/jobs
        ↓
Separate components only when justified
```