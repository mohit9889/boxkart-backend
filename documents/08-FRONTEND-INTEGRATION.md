# BoxKart Box Engine — Frontend Integration

## 1. Purpose

The BoxKart frontend consumes Box Engine through the REST API. The frontend should treat the backend as the source of truth for authentication state, catalog state, pricing, inventory, and orders.

## 2. Recommended frontend structure

Keep API access behind a small service layer:

```text
src/
└── services/
    └── api/
        ├── client.js
        ├── auth.api.js
        ├── catalog.api.js
        ├── box-engine.api.js
        ├── cart.api.js
        ├── pricing.api.js
        ├── checkout.api.js
        ├── orders.api.js
        ├── rfq.api.js
        └── quotes.api.js
```

UI components should not contain repeated endpoint URLs or response parsing logic.

## 3. Base API configuration

Use an environment variable for the API base URL.

Production example:

```text
https://box-engine.onrender.com/api/v1
```

A future custom domain may be:

```text
https://api.boxkart.com/api/v1
```

Do not hardcode environment-specific URLs into components.

## 4. Cookie authentication

Because authentication uses an HTTP-only cookie, frontend JavaScript should not attempt to read the JWT.

The HTTP client must be configured to include credentials when required by the browser's cross-origin request rules.

Example with `fetch`:

```js
fetch(`${API_BASE_URL}/auth/me`, {
  credentials: 'include'
});
```

The exact CORS/cookie behavior depends on the final frontend and API domains.

## 5. Response handling

Success:

```js
const response = await api.get('/products');
const products = response.data.data;
```

Error:

```js
try {
  await api.post('/cart/items', payload);
} catch (error) {
  const code = error?.response?.data?.error?.code;

  if (code === 'BELOW_MOQ') {
    // show MOQ message
  }
}
```

Never branch on:

```js
error.message === 'Product not found'
```

Use stable error codes instead.

## 6. Authentication flow

```text
Application starts
       ↓
GET /auth/me
       ↓
200 → authenticated user
401 → logged-out state
```

After login, the browser stores the HTTP-only cookie and the frontend can retrieve the current user through `/auth/me`.

After logout, clear frontend auth state after the logout API succeeds.

## 7. Catalog flow

```text
GET /categories
GET /categories/:slug
GET /products
GET /products/:slug
```

Use backend pagination/filter/search results rather than assuming the complete catalog is always loaded into the browser.

## 8. Box Finder integration

Send the user's item dimensions and weight to:

```text
POST /box-finder/recommend
```

The frontend should send the unit selected by the user and display the backend's normalized/recommended results.

The frontend should not duplicate the Box Engine fitting algorithm.

## 9. Pricing integration

Call:

```text
POST /pricing/calculate
```

The response is authoritative for displayed pricing.

Do not send a client-calculated price to order creation and expect the backend to trust it.

## 10. Cart integration

Typical flow:

```text
GET /cart
     ↓
POST /cart/items
     ↓
GET /cart
     ↓
POST /pricing/calculate
```

If the backend reports `BELOW_MOQ`, `INVALID_QUANTITY`, or inventory-related errors, show a specific actionable message.

## 11. Checkout and orders

Before creating an order:

1. Load the latest cart.
2. Collect/validate the customer's address.
3. Preview checkout.
4. Generate one idempotency key for the logical order attempt.
5. Create the order.
6. If the network response is lost, retry with the same idempotency key.

Never generate a new key for an immediate retry of the same logical order.

## 12. RFQ integration

RFQ UI should treat the RFQ ID as the backend resource identifier.

Attachments should be uploaded only through the authenticated backend endpoint unless the backend explicitly exposes a different signed-upload flow.

Never expose the Supabase service key in frontend code.

## 13. HTTP status handling

Recommended frontend behavior:

| Status | Meaning | UI behavior |
|---:|---|---|
| 400 | Validation/business input error | Show actionable field/message error |
| 401 | Not authenticated | Refresh auth state / redirect to login where appropriate |
| 403 | Not authorized | Show permission error |
| 404 | Resource not found | Show not-found state |
| 409 | Business conflict | Explain conflict and refresh relevant state |
| 429 | Rate limited | Ask user to retry later |
| 500 | Server failure | Generic retry/support message |

## 14. Environment separation

Use separate frontend environment configuration for development and production.

Do not commit production secrets.

Only the API base URL should be required on the browser side; server-only secrets such as `SUPABASE_SERVICE_KEY` must never be exposed.

## 15. Integration acceptance criteria

The frontend integration is complete when:

- [ ] Signup works.
- [ ] Login works.
- [ ] `/auth/me` correctly restores session state.
- [ ] Logout works.
- [ ] Catalog loads from Box Engine.
- [ ] Box Finder works with real product data.
- [ ] Pricing displays backend values.
- [ ] Cart operations work.
- [ ] Checkout preview works.
- [ ] Order creation uses an idempotency key.
- [ ] Order history works.
- [ ] RFQ creation works.
- [ ] RFQ attachments work without exposing storage secrets.
- [ ] Quote actions enforce ownership.
- [ ] Admin UI uses admin-only APIs.
- [ ] All API errors are handled using `error.code`.
