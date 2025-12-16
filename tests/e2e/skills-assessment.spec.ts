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

        const categoryTrigger = page.getByRole('button', { name: firstCategory.category }).first();
        await expect(categoryTrigger).toBeVisible();
        await categoryTrigger.click();

        const skillItem = page.getByText(firstSkill.name, { exact: true });
        await expect(skillItem).toBeVisible();
        const skillRow = skillItem.locator('..');

        const level2Btn = skillRow.getByRole('button', { name: /set level to 2/i }).first();
        await expect(level2Btn).toBeVisible();
        await expect(level2Btn).toBeEnabled();
        await level2Btn.click();

        expect(firstSubSkill).toBeDefined();

        const subSkillItem = page.getByText(firstSubSkill!.name, { exact: true });
        console.log(firstSubSkill);

        const subSkillRow = subSkillItem.locator('../..');
        await expect(subSkillRow).toBeVisible();

        const subLevel2Btn = subSkillRow.getByRole('button', { name: /set level to 1/i }).first();
        await expect(subLevel2Btn).toBeVisible();
        await expect(subLevel2Btn).toBeEnabled();
        await subLevel2Btn.click();

        const resetBtn = skillRow.getByRole('button', { name: /reset/i, exact: true }).first();
        await expect(resetBtn).toBeVisible();
        await expect(resetBtn).toBeEnabled({ timeout: 3000 });
        await resetBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        const confirmBtn = page.getByRole('dialog').getByRole('button', { name: /reset/i }).first();
        await expect(confirmBtn).toBeVisible({ timeout: 5000 });
        await expect(confirmBtn).toBeEnabled();
        await confirmBtn.click();
    });

    test('should add and delete a custom skill, verifying delete/reset buttons', async ({ page }) => {
        await page.goto('/account/skills-assessment');
        await page.waitForLoadState('networkidle');

        const categoryTrigger = page.getByRole('button', { name: firstCategory.category }).first();
        await expect(categoryTrigger).toBeVisible();
        await categoryTrigger.click();

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
