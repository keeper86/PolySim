import { test, expect } from '@playwright/test';

test.use({ storageState: './playwright/.auth/auth.json' });

test.describe('API Documentation', () => {
    test('should have accessible Swagger UI at /api-doc', async ({ page }) => {
        const jsErrors: string[] = [];

        // Capture JavaScript errors
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                jsErrors.push(msg.text());
            }
        });

        page.on('pageerror', (error) => {
            jsErrors.push(error.message);
        });

        await page.goto('/api-doc');
        await page.waitForLoadState('networkidle');

        const currentUrl = page.url();
        expect(currentUrl).toContain('/api-doc');
        expect(currentUrl).not.toContain('signin');
        expect(currentUrl).not.toContain('auth');

        await expect(page.locator('.swagger-ui-wrapper')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.swagger-ui')).toBeVisible({ timeout: 10000 });

        const significantErrors = jsErrors.filter(
            (error) =>
                !error.includes('net::ERR_') &&
                !error.includes('Failed to fetch') &&
                !error.toLowerCase().includes('warning'),
        );

        if (significantErrors.length > 0) {
            console.warn('JavaScript errors detected:', significantErrors);
        }

        const criticalErrors = significantErrors.filter(
            (error) => error.includes('ReferenceError') || error.includes('TypeError') || error.includes('SyntaxError'),
        );

        expect(criticalErrors.length).toBe(0);
    });

    test('should serve OpenAPI specification at /api/openapi.json', async ({ page }) => {
        const response = await page.request.get('/api/openapi.json');
        expect(response.ok()).toBe(true);
        expect(response.headers()['content-type']).toContain('application/json');

        const openApiSpec = await response.json();

        expect(openApiSpec).toHaveProperty('openapi');
        expect(openApiSpec).toHaveProperty('info');
        expect(openApiSpec).toHaveProperty('paths');

        expect(openApiSpec.info.title).toBe('PolySim API');
        expect(openApiSpec.info.version).toBe('1.0.0');
    });
});
