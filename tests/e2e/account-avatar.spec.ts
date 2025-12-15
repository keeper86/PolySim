import { test, expect } from '@playwright/test';
import authPath from './auth.path';

test.use({ storageState: authPath });

test.describe('Account Avatar E2E', () => {
    // TODO(#184): Enable avatar upload test when running in CI environment
    test.skip('uploads an avatar and shows the preview', async ({ page }) => {
        await page.goto('/account/avatar');
        await page.waitForLoadState('networkidle');

        const input = page.locator('input[type="file"]');

        // 1x1 PNG (transparent)
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

        const filePayload = {
            name: 'e2e-avatar.png',
            mimeType: 'image/png',
            buffer: Buffer.from(base64, 'base64'),
        } as Parameters<typeof input.setInputFiles>[0];

        await input.setInputFiles(filePayload);

        const img = page.locator('img[alt="e2e-avatar.png"]');
        await expect(img).toBeVisible({ timeout: 5000 });

        const toast = page.locator('text=Avatar uploaded successfully');
        await expect(toast).toBeVisible({ timeout: 5000 });
    });
});
