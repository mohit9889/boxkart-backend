# BoxKart Box Engine — Authentication and Security

## 1. Authentication

MVP recommendation:

```text
session/token
+
secure HTTP-only cookie
```

Do not store authentication tokens in localStorage.

## 2. Cookie Settings

Production:

```text
HttpOnly
Secure
SameSite=Lax or appropriate cross-site configuration
```

Exact SameSite behavior must match the frontend/backend deployment architecture.

## 3. Passwords

Hash passwords with a strong password hashing algorithm such as Argon2id or bcrypt.

Never store plaintext passwords.

## 4. Authorization

Roles:

```text
CUSTOMER
ADMIN
```

Middleware:

```text
requireAuth
requireRole('ADMIN')
```

## 5. Public APIs

Public:

- product listing
- product details
- categories
- Box Finder
- pricing preview

Authenticated:

- cart
- checkout
- orders
- RFQs
- quotes
- addresses

Admin:

- product management
- price management
- inventory
- order operations
- RFQ/quote management

## 6. Validation

Validate every external input.

Use a schema validation library.

Reject:

- negative quantity
- zero quantity
- invalid dimensions
- invalid enum values
- oversized uploads
- malformed identifiers

## 7. Rate Limiting

At minimum rate-limit:

- login
- signup
- password operations
- RFQ submission
- file upload
- public Box Finder endpoint

## 8. File Upload Security

Validate:

- extension
- MIME type
- size
- file signature where appropriate

Never execute uploaded files.

Use object storage.

## 9. SQL Injection

Use Prisma parameterized queries.

Do not construct raw SQL from user input.

## 10. Logging

Never log:

- passwords
- authentication tokens
- sensitive payment data

Log:

- request ID
- route
- status
- duration
- user ID when safe
- business error code

## 11. CORS

Allow only configured frontend origins.

Never use unrestricted `*` with credentialed requests.

## 12. Secrets

Use environment variables/secrets management.

Never commit:

```text
DATABASE_URL
JWT/session secrets
payment secrets
storage credentials
email credentials
```

## 13. Production Headers

Use standard security headers.

## 14. Error Handling

Do not expose:

- stack traces
- SQL errors
- secrets
- internal filesystem paths

Return stable public error codes.
