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

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug
```

The Playwright configuration (`playwright.config.ts`).
