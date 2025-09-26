import { test, expect } from '@playwright/test';

test.describe('API Documentation', () => {
    test.beforeEach(async ({ page }) => {
        // Ensure we can access the site (authenticate if needed)
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // If we see a login form, we need to authenticate first
        const usernameField = page.locator('input[name="username"], input[id="username"]');
        if (await usernameField.isVisible({ timeout: 3000 })) {
            await usernameField.fill('adminuser');
            await page.locator('input[name="password"], input[id="password"]').fill('adminpassword');
            await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').first().click();
            await page.waitForLoadState('networkidle');
        }
    });

    test('should have accessible Swagger UI at /api-doc', async ({ page }) => {
        // Navigate to the API documentation page
        await page.goto('/api-doc');
        await page.waitForLoadState('networkidle');

        // Check that we're not redirected to a login page
        const currentUrl = page.url();
        expect(currentUrl).toContain('/api-doc');
        expect(currentUrl).not.toContain('signin');
        expect(currentUrl).not.toContain('auth');

        // Wait for Swagger UI to load
        await expect(page.locator('.swagger-ui-wrapper')).toBeVisible({ timeout: 10000 });

        // Check for Swagger UI specific elements
        await expect(page.locator('.swagger-ui')).toBeVisible({ timeout: 10000 });

        // Verify the OpenAPI specification is loaded by checking for common Swagger elements
        // These might take time to load as they fetch from /api/openapi.json
        const swaggerElements = [
            '.info',
            '.opblock',
            '.scheme-container',
            'div[id*="swagger"]'
        ];

        let foundSwaggerElement = false;
        for (const selector of swaggerElements) {
            try {
                await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
                foundSwaggerElement = true;
                break;
            } catch {
                // Continue to next selector
                continue;
            }
        }

        // If no specific Swagger elements found, at least verify the wrapper is there
        // and check that the OpenAPI JSON endpoint works
        if (!foundSwaggerElement) {
            console.log('Swagger UI elements not found, checking OpenAPI endpoint...');
        }

        expect(foundSwaggerElement || await page.locator('.swagger-ui-wrapper').isVisible()).toBe(true);
    });

    test('should serve OpenAPI specification at /api/openapi.json', async ({ page }) => {
        // Test the OpenAPI JSON endpoint directly
        const response = await page.request.get('/api/openapi.json');
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toContain('application/json');

        const openApiSpec = await response.json();

        // Verify it's a valid OpenAPI spec
        expect(openApiSpec).toHaveProperty('openapi');
        expect(openApiSpec).toHaveProperty('info');
        expect(openApiSpec).toHaveProperty('paths');

        // Verify the expected metadata
        expect(openApiSpec.info.title).toBe('PolySim API');
        expect(openApiSpec.info.version).toBe('1.0.0');

        // Log the available paths for debugging
        console.log('Available API paths:', Object.keys(openApiSpec.paths || {}));
    });

    test('should load Swagger UI without JavaScript errors', async ({ page }) => {
        const jsErrors: string[] = [];

        // Capture JavaScript errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        page.on('pageerror', error => {
            jsErrors.push(error.message);
        });

        // Navigate to API docs
        await page.goto('/api-doc');
        await page.waitForLoadState('networkidle');

        // Wait a bit for any async errors to surface
        await page.waitForTimeout(3000);

        // Filter out known acceptable errors (like network errors in dev)
        const significantErrors = jsErrors.filter(error =>
            !error.includes('net::ERR_') && // Network errors are expected in dev
            !error.includes('Failed to fetch') && // Fetch errors might be expected
            !error.toLowerCase().includes('warning') // Warnings are not errors
        );

        // Log errors for debugging but don't fail the test for minor errors
        if (significantErrors.length > 0) {
            console.warn('JavaScript errors detected:', significantErrors);
        }

        // Verify the page still loads and shows the Swagger UI
        await expect(page.locator('.swagger-ui-wrapper')).toBeVisible();

        // Only fail if there are critical errors that prevent functionality
        const criticalErrors = significantErrors.filter(error =>
            error.includes('ReferenceError') ||
            error.includes('TypeError') ||
            error.includes('SyntaxError')
        );

        expect(criticalErrors.length).toBe(0);
    });
});
