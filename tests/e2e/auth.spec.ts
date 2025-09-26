import { test, expect } from '@playwright/test';

const DEV_CREDENTIALS = {
    username: 'adminuser',
    password: 'adminpassword'
};

test.describe('Authentication', () => {
    test('should successfully login with dev credentials', async ({ page }) => {
        // Navigate to the main page
        await page.goto('/');

        // Check if we are redirected to login or if login form is present
        // Since the app uses NextAuth with Keycloak, we expect either:
        // 1. Redirect to Keycloak login page
        // 2. A login form/button on the page

        await page.waitForLoadState('networkidle');

        // Look for login elements - could be a sign-in button or direct form
        const signInButton = page.locator('text=/sign.in/i').first();

        if (await signInButton.isVisible({ timeout: 5000 })) {
            // Click sign-in button if present
            await signInButton.click();
            await page.waitForLoadState('networkidle');
        }

        // Wait for either username field or indication we're already logged in
        try {
            await page.waitForSelector('input[name="username"], input[id="username"], input[type="text"], [data-testid="database-tester"]', { timeout: 10000 });

            // Check if we see the database tester (indicating we're already logged in)
            const databaseTester = page.locator('[data-testid="database-tester"], text="Database Connection Tester"');
            if (await databaseTester.isVisible({ timeout: 2000 })) {
                // Already logged in, test passes
                expect(await databaseTester.isVisible()).toBe(true);
                return;
            }

            // Fill in credentials if login form is present
            const usernameInput = page.locator('input[name="username"], input[id="username"]').first();
            const passwordInput = page.locator('input[name="password"], input[id="password"], input[type="password"]').first();

            if (await usernameInput.isVisible({ timeout: 2000 })) {
                await usernameInput.fill(DEV_CREDENTIALS.username);
                await passwordInput.fill(DEV_CREDENTIALS.password);

                // Submit the form
                const submitButton = page.locator('button[type="submit"], input[type="submit"], button:has-text("Sign"), button:has-text("Login")').first();
                await submitButton.click();

                // Wait for successful login - should see the main page with database tester
                await page.waitForLoadState('networkidle');

                // Verify we're logged in by checking for the main page content
                await expect(page.locator('text="PolySim - Event Chain im Web"')).toBeVisible({ timeout: 10000 });
                await expect(page.locator('text="Database Connection Tester"')).toBeVisible({ timeout: 5000 });
            }
        } catch (error) {
            // If we can't find login elements, check if we're already on the main page
            const mainPageTitle = page.locator('text="PolySim - Event Chain im Web"');
            if (await mainPageTitle.isVisible({ timeout: 5000 })) {
                // Already logged in successfully
                expect(await mainPageTitle.isVisible()).toBe(true);
            } else {
                throw error;
            }
        }
    });

    test('should maintain session across page navigation', async ({ page }) => {
        // This test assumes the previous login test passed or session exists
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Verify we can access the main page without being redirected to login
        await expect(page.locator('text="PolySim - Event Chain im Web"')).toBeVisible({ timeout: 10000 });

        // Navigate to API docs to test session persistence
        await page.goto('/api-doc');
        await page.waitForLoadState('networkidle');

        // Should be able to access API docs without login redirect
        // Look for Swagger UI elements
        await expect(page.locator('.swagger-ui-wrapper, .swagger-ui')).toBeVisible({ timeout: 10000 });
    });
});
