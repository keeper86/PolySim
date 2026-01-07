import { test, expect } from '@playwright/test';
import authPath from './auth.path';

test.use({ storageState: authPath });

test.describe('Account Avatar E2E', () => {
    test('uploads an avatar and shows the preview', async ({ page }) => {
        await page.goto('/account');
        await page.waitForLoadState('networkidle');

        // Open the avatar upload dialog
        await page.getByRole('button', { name: /upload avatar/i }).click();

        // Wait for dialog to be visible
        await expect(page.getByRole('dialog')).toBeVisible();

        const input = page.locator('input[type="file"]');

        // 1x1 PNG (transparent)
        const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';

        const filePayload = {
            name: 'e2e-avatar.png',
            mimeType: 'image/png',
            buffer: Buffer.from(base64, 'base64'),
        } as Parameters<typeof input.setInputFiles>[0];

        await input.setInputFiles(filePayload);

        // Preview should be visible in the Avatar component
        const avatarImg = page.locator('[role="dialog"] img');
        await expect(avatarImg).toBeVisible({ timeout: 5000 });

        // Click upload button
        await page.getByRole('button', { name: /upload photo/i }).click();

        // Success message appears in Alert component
        const successAlert = page.getByText('Avatar uploaded successfully');
        await expect(successAlert).toBeVisible({ timeout: 5000 });
    });
});
