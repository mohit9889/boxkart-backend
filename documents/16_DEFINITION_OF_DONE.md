# BoxKart Box Engine — Definition of Done

A feature is complete only when:

## Code

- follows project architecture
- uses JavaScript/ES6
- has clear module boundaries
- contains no unnecessary duplication
- does not place business rules in controllers

## API

- documented
- validated
- authenticated where required
- authorized where required
- stable error codes
- correct status codes

## Database

- migration exists
- constraints exist
- indexes exist where appropriate
- no destructive accidental behavior
- seed data updated if needed

## Business Logic

- deterministic where expected
- tested
- handles invalid input
- handles edge cases

## Testing

- unit tests for core logic
- integration tests for persistence/API
- E2E test where user journey is critical

## Security

- no secrets in source
- no plaintext passwords
- no token leakage
- validated uploads
- authorization enforced server-side

## Frontend

- loading state
- error state
- empty state
- success state
- backend error codes mapped appropriately

## Documentation

Update relevant docs when behavior changes.

## Deployment

Feature works in production-like environment.

## Final Acceptance

No unresolved critical/high severity defects.
