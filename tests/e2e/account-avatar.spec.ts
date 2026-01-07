import { test, expect } from '@playwright/test';
import authPath from './auth.path';

test.use({ storageState: authPath });

test.describe('Account Avatar E2E', () => {
    test('uploads an avatar and shows the preview', async ({ page }) => {
        await page.goto('/account');
        await page.waitForLoadState('networkidle');

        await page.getByRole('button', { name: /upload avatar/i }).click();

        await expect(page.getByRole('dialog')).toBeVisible();

        const input = page.locator('input[type="file"]');

        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

        const filePayload = {
            name: 'e2e-avatar.png',
            mimeType: 'image/png',
            buffer: Buffer.from(base64, 'base64'),
        } as Parameters<typeof input.setInputFiles>[0];

        await input.setInputFiles(filePayload);

        const avatarImg = page.locator('[role="dialog"] img');
        await expect(avatarImg).toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: /upload photo/i }).click();

        const successAlert = page.getByText('Avatar uploaded successfully');
        await expect(successAlert).toBeVisible({ timeout: 5000 });
    });
});
