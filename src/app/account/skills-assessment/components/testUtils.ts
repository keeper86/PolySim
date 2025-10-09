import { vi } from 'vitest';

// Default values for test data and UI labels to avoid magic strings in tests
export const DEFAULT_CATEGORY_NAME = 'Frontend';
export const DEFAULT_SKILL_NAME = 'TypeScript';
export const DEFAULT_SECOND_SKILL_NAME = 'React';
export const DEFAULT_SUBSKILL_NAME = 'Generics';
export const DEFAULT_SECOND_SUBSKILL_NAME = 'Types';
export const DEFAULT_ADD_SKILL_PLACEHOLDER = (category = DEFAULT_CATEGORY_NAME) => `Add to ${category}`;
export const DEFAULT_ADD_SKILL_BUTTON = 'Add Skill';
export const DEFAULT_RESET_DIALOG_TITLE = 'Reset Ratings?';
export const DEFAULT_RESET_DIALOG_CONFIRM = 'Reset all ratings';
export const DEFAULT_RESET_DIALOG_CANCEL = 'Cancel';

export const mockActions = {
    addItemToCategory: vi.fn(),
    updateItemLevel: vi.fn(),
    deleteCustomSkill: vi.fn(),
    resetSkillRatings: vi.fn(),
    addSubSkillToItem: vi.fn(),
    updateSubSkillLevel: vi.fn(),
    deleteSubSkill: vi.fn(),
    deleteCustomSubSkill: vi.fn(),
};

export const sampleCategory = {
    category: DEFAULT_CATEGORY_NAME,
    skills: [
        {
            name: DEFAULT_SKILL_NAME,
            level: 2,
            subSkills: [
                { name: DEFAULT_SUBSKILL_NAME, level: 3 },
                { name: DEFAULT_SECOND_SUBSKILL_NAME, level: 2 },
            ],
        },
        {
            name: DEFAULT_SECOND_SKILL_NAME,
            level: 1,
            subSkills: [],
        },
    ],
};

export const sampleSkill = {
    name: DEFAULT_SKILL_NAME,
    level: 3,
    subSkills: [
        { name: DEFAULT_SUBSKILL_NAME, level: 3 },
        { name: DEFAULT_SECOND_SUBSKILL_NAME, level: 2 },
    ],
};

export const sampleSubSkill = { name: DEFAULT_SUBSKILL_NAME, level: 3 };
