# End-to-End Tests

This directory contains Playwright-based end-to-end tests for the PolySim application.

## Prerequisites

1. **Development Environment Running**: The tests assume the development version of PolySim is running and accessible via `https://polysim`

2. **Local Setup**: Follow the development setup instructions in the main README.md:
   - Create certificates for local domains
   - Start the development environment with Docker Compose

3. **Playwright Installation**: Install Playwright browsers
   ```bash
   npx playwright install
   ```

## Test Credentials

The tests use the development credentials defined in the issue:
- Username: `adminuser`  
- Password: `adminpassword`

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug
```

## Test Structure

### Authentication Tests (`auth.spec.ts`)
- Tests login functionality with dev credentials
- Validates session persistence across navigation
- Handles both Keycloak redirect scenarios and direct login forms

### API Documentation Tests (`api-docs.spec.ts`)
- Validates Swagger UI accessibility at `/api-doc`
- Tests OpenAPI JSON endpoint at `/api/openapi.json`
- Checks for JavaScript errors that could break functionality

## Configuration

The Playwright configuration (`playwright.config.ts`) is set up to:
- Use `https://polysim` as the base URL
- Ignore HTTPS errors (for local dev with self-signed certificates)
- Run tests in multiple browsers (Chromium, Firefox, WebKit)
- Generate HTML reports
- Capture traces on first retry for debugging

## Notes

- Tests are designed to be resilient to the Keycloak authentication flow
- The application uses NextAuth with Keycloak, so login may involve redirects
- Self-signed certificates are expected in the development environment
- Tests will fail if the development server is not running at `https://polysim`