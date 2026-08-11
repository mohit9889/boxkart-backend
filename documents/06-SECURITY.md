# BoxKart Box Engine — Security

## 1. Security objectives

The backend protects four critical assets:

1. Customer identity/session data.
2. Commercial pricing and order totals.
3. Inventory and order state.
4. Customer RFQ/design data.

## 2. Authentication

JWT authentication is stored in HTTP-only cookies so application JavaScript cannot directly read the token.

Production cookies should use secure transport and appropriate SameSite settings for the deployed frontend/API topology.

Passwords are stored as bcrypt hashes, never plaintext.

## 3. Authorization

Authorization is enforced at the API layer.

```text
Unauthenticated
    ↓
401 UNAUTHORIZED

Authenticated CUSTOMER attempting admin action
    ↓
403 FORBIDDEN

Authenticated CUSTOMER accessing another customer's resource
    ↓
ownership denial
```

Admin endpoints require the ADMIN role.

Customer RFQs, quotes, orders, and other private resources must be scoped to the authenticated user.

## 4. Pricing security

The frontend is not trusted for authoritative pricing.

The backend loads catalog/price-tier data from PostgreSQL and recalculates totals before order creation.

This protects against payload tampering such as:

```json
{
  "unitPrice": 0.01
}
```

being submitted by a malicious client.

## 5. Money security

Money is represented using integer minor units to avoid floating-point rounding errors.

## 6. Inventory security

Inventory updates associated with order creation must be transactional and concurrency-safe.

A successful order must not be able to commit if there is insufficient inventory.

## 7. Idempotency

Order creation uses an idempotency key so client retries cannot unintentionally create duplicate orders.

The database uniqueness constraint provides an additional concurrency guarantee.

## 8. Input validation

Zod schemas validate request input before business logic executes.

Validation should reject:

- Missing required fields.
- Invalid identifiers.
- Invalid quantities.
- Invalid dimensions.
- Invalid units.
- Invalid enum values.
- Out-of-range values.
- Malformed request structures.

## 9. HTTP security

Helmet provides standard HTTP security headers.

CORS restricts browser origins to configured frontend origins.

Rate limiting reduces brute-force and abuse risk.

A request ID is attached to requests to support safe log correlation.

## 10. Error handling

Expected application errors expose stable error codes.

Unexpected errors are converted to `INTERNAL_SERVER_ERROR` and should not reveal:

- Stack traces.
- SQL/database details.
- Secrets.
- JWTs.
- Internal file paths.
- Provider credentials.

## 11. File uploads

RFQ attachments are stored in Supabase Storage. The Supabase service key is server-side configuration and must never be sent to the frontend.

Validate upload type, size, ownership, and association with the authenticated RFQ before accepting an attachment.

## 12. Secrets

Never commit:

```text
.env
JWT secrets
Database passwords/URLs
Supabase service keys
API keys
Provider credentials
```

Use Render environment variables or a secret manager.

## 13. CORS and cookies

The production frontend origin must be explicitly configured.

When cookie authentication is cross-site, review SameSite and CSRF protections carefully. Do not loosen CORS to `*` for authenticated browser APIs.

## 14. Database security

Use a least-privilege database credential appropriate for the application.

Do not expose PostgreSQL directly to the browser.

All database access goes through the backend.

## 15. Security testing checklist

- [ ] Customer cannot access another customer's order.
- [ ] Customer cannot access another customer's RFQ.
- [ ] Customer cannot access another customer's quote.
- [ ] Customer cannot mutate operational order statuses.
- [ ] Non-admin cannot call admin APIs successfully.
- [ ] Invalid JWT is rejected.
- [ ] Expired JWT is rejected.
- [ ] Passwords are never returned in API responses.
- [ ] Price supplied by the client is ignored for final order totals.
- [ ] Concurrent checkout cannot oversell inventory.
- [ ] Repeated order request with same idempotency key does not create a duplicate.
- [ ] Rate limits return HTTP 429.
- [ ] Unexpected errors do not leak internal details.
- [ ] Supabase service credentials never reach the frontend.