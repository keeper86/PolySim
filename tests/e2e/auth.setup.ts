import { test as setup } from '@playwright/test';
import pathToAuthStorage from './auth.path';

setup('authenticate', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="username"], input[id="username"]', 'adminuser');
    await page.fill('input[name="password"], input[id="password"]', 'adminpassword');
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
    await page.waitForLoadState('networkidle');

    await page.context().storageState({ path: pathToAuthStorage });
});
