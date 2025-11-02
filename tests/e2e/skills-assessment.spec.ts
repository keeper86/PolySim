import { test, expect } from '@playwright/test';
import authPath from './auth.path';
import { getDefaultSkillsAssessment } from '../../src/app/account/skills-assessment/utils/getDefaultAssessmentList';

test.use({ storageState: authPath });

const defaultSkillsAssessment = getDefaultSkillsAssessment();
const firstCategory = defaultSkillsAssessment.data[0];
const firstSkill = firstCategory.skills[0];
const firstSubSkill = firstSkill.subSkills?.[0];

test.describe('Skills Assessment E2E', () => {
    test('should display and update a skill by visible text', async ({ page }) => {
        await page.goto('/account/skills-assessment');
        await page.waitForLoadState('networkidle');

        await expect(page.getByRole('heading', { name: /skills assessment/i })).toBeVisible();

        const skillItem = page.getByText(firstSkill.name, { exact: true });
        await expect(skillItem).toBeVisible();
        const skillRow = skillItem.locator('..');
        const increaseBtn = skillRow.getByRole('button', { name: /set level to 1/i }).first();
        if (await increaseBtn.isVisible()) {
            await increaseBtn.click();
        }

        if (firstSubSkill) {
            const subSkillItem = page.getByText(firstSubSkill.name, { exact: true });
            const subSkillRow = subSkillItem.locator('..');
            const subSkillLevel2Btn = subSkillRow.getByRole('button', { name: /set level to 2/i }).first();
            if (await subSkillLevel2Btn.isVisible()) {
                await subSkillLevel2Btn.click();
            }
        }

        const resetBtn = skillRow.getByRole('button', { name: /reset/i, exact: true }).first();
        if (await resetBtn.isVisible()) {
            await resetBtn.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            const confirmBtn = page.getByRole('button', { name: /confirm|yes/i });
            if (await confirmBtn.isVisible()) {
                await confirmBtn.click();
            }
        }
    });

    test('should add and delete a custom skill, verifying delete/reset buttons', async ({ page }) => {
        await page.goto('/account/skills-assessment');
        await page.waitForLoadState('networkidle');

        const addSkillInput = page.getByPlaceholder(`Add to ${firstCategory.category}`);
        const uniqueSuffix = Date.now();
        const newSkillName = `E2E Custom Skill ${uniqueSuffix}`;

        await addSkillInput.fill(newSkillName);
        await page
            .getByRole('button', { name: /add skill/i })
            .first()
            .click();
        await expect(page.getByText(newSkillName, { exact: true })).toBeVisible();

        const newSkillRow = page.getByText(newSkillName, { exact: true }).locator('..');

        const setLevelBtn = newSkillRow.getByRole('button', { name: /set level to 1/i }).first();
        await setLevelBtn.click();

        const deleteButtons = newSkillRow.getByRole('button', { name: /delete|reset/i });
        await expect(deleteButtons).toHaveCount(2);

        const skillDeleteBtn = newSkillRow.getByRole('button', { name: /delete/i }).first();
        await skillDeleteBtn.click();
        await expect(page.getByText(newSkillName, { exact: true })).not.toBeVisible();
    });
});
