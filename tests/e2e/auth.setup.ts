import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
    const pathFromEnv = process.env.DEV_ONLY_PLAYWRIGHT_AUTH_STORAGE_PATH;
    if (pathFromEnv) {
        console.log('Using auth storage path from env:', pathFromEnv);
    } else {
        console.warn('DEV_ONLY_PLAYWRIGHT_AUTH_STORAGE_PATH is not set <' + pathFromEnv + '>. Tests will fail.');
    }
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="username"], input[id="username"]', 'adminuser');
    await page.fill('input[name="password"], input[id="password"]', 'adminpassword');
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: pathFromEnv });
});
