# E2E Test Implementation Notes

## Issue Clarification

The original issue mentioned checking for Swagger UI at `/api/doc`, but the actual implementation uses `/api-doc` (without the slash). The e2e tests have been implemented to test the correct path `/api-doc`.

## Authentication Flow

The application uses NextAuth with Keycloak for authentication. The e2e tests are designed to handle:

1. **Direct Login**: If login form is immediately visible
2. **Keycloak Redirect**: If the app redirects to Keycloak authentication
3. **Already Authenticated**: If the user is already logged in (session exists)

## Test Strategy

The tests are designed to be resilient and handle different authentication states:
- Tests will pass if already authenticated
- Tests will attempt login if authentication is required
- Tests validate both positive cases (successful access) and error handling

## Development Credentials

As specified in the issue:
- Username: `adminuser`
- Password: `adminpassword`

These credentials are hardcoded in the test files for the development environment only.