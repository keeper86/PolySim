import type { SkillsAssessmentSchema } from '@/server/controller/skillsAssessment';
import { describe, expect, it } from 'vitest';
import { cleanEmptyDefaultSkillsAssessment, getDefaultSkillsAssessment } from './getDefaultAssessmentList';

const defaultSkills = getDefaultSkillsAssessment();

const firstCategory = defaultSkills.data[0].category;
const firstSkill = defaultSkills.data[0].skills[0].name;
const firstSubSkill = defaultSkills.data[0].skills[0].subSkills![0].name;
const secondSubSkill = defaultSkills.data[0].skills[0].subSkills![1].name;

const someNewSkill = 'Some New Skill';
const someNewSubSkill = 'Some New SubSkill';
const minimalMerge: SkillsAssessmentSchema = {
    data: [
        {
            category: firstCategory,
            skills: [
                {
                    name: firstSkill,
                    level: 3,
                    subSkills: [
                        { name: firstSubSkill, level: 2 },
                        { name: secondSubSkill, level: 0 },
                        { name: someNewSubSkill, level: 0 },
                    ],
                },
                { name: someNewSkill, level: 2, subSkills: [{ name: someNewSubSkill, level: 1 }] },
            ],
        },
    ],
};

const nonDefaultCategory = 'Non-default category';
const wrongMerge1: SkillsAssessmentSchema = {
    data: [
        {
            category: nonDefaultCategory, // This category does not exist in the default; categories cannot be added
            skills: [{ name: 'New Skill', level: 1 }],
        },
    ],
};

describe('getDefaultSkillsAssessment', () => {
    it('preserves the toMerge structure', () => {
        const result = getDefaultSkillsAssessment(minimalMerge);

        const cat = result.data.find((cat) => cat.category === firstCategory);
        expect(cat).toBeDefined();

        const skill = cat!.skills.find((s) => s.name === firstSkill);
        expect(skill).toBeDefined();

        expect(skill?.level).toBe(3);
        expect(skill?.subSkills?.find((ss) => ss.name === someNewSubSkill)?.level).toBeDefined();

        expect(cat?.skills.find((s) => s.name === someNewSkill)).toBeDefined();
    });

    it('ignores categories in mergeWith that are not in the default', () => {
        expect(wrongMerge1.data.find((cat) => cat.category === nonDefaultCategory)).toBeDefined();

        const result = getDefaultSkillsAssessment(wrongMerge1);

        expect(result.data.find((cat) => cat.category === nonDefaultCategory)).toBeUndefined();
    });

    it('includes user-defined skills in the merged result', () => {
        const result = getDefaultSkillsAssessment(minimalMerge);
        const cat = result.data.find((cat) => cat.category === firstCategory);

        expect(cat?.skills.find((s) => s.name === someNewSkill)).toBeDefined();
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.level).toBe(2);
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.subSkills?.[0].name).toBe(someNewSubSkill);
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.subSkills?.[0].level).toBe(1);
    });
});

describe('cleanEmptyDefaultSkillsAssessment', () => {
    it('keeps custom (non-default) skills with level 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: 'Custom Category',
                    skills: [{ name: 'Custom Skill', level: 0 }],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.data).toEqual([
            {
                category: 'Custom Category',
                skills: [{ name: 'Custom Skill', level: 0 }],
            },
        ]);
    });

    it('keeps custom (non-default) subSkills with level 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: 'Custom Category',
                    skills: [
                        {
                            name: 'Custom Skill',
                            level: 2,
                            subSkills: [
                                { name: 'Custom SubSkill', level: 0 },
                                { name: 'Another SubSkill', level: 1 },
                            ],
                        },
                    ],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.data).toEqual([
            {
                category: 'Custom Category',
                skills: [
                    {
                        name: 'Custom Skill',
                        level: 2,
                        subSkills: [
                            { name: 'Custom SubSkill', level: 0 },
                            { name: 'Another SubSkill', level: 1 },
                        ],
                    },
                ],
            },
        ]);
    });

    it('removes default skills with level 0 but keeps custom skills with level 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [
                        { name: firstSkill, level: 0 },
                        { name: 'Custom Skill', level: 0 },
                    ],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.data).toEqual([
            {
                category: firstCategory,
                skills: [{ name: 'Custom Skill', level: 0 }],
            },
        ]);
    });

    it('removes default subSkills with level 0 but keeps custom subSkills with level 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [
                        {
                            name: firstSkill,
                            level: 2,
                            subSkills: [
                                { name: firstSubSkill, level: 0 },
                                { name: someNewSkill, level: 0 },
                                { name: secondSubSkill, level: 1 },
                            ],
                        },
                    ],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned).toEqual({
            data: [
                {
                    category: firstCategory,
                    skills: [
                        {
                            name: firstSkill,
                            level: 2,
                            subSkills: [
                                { name: someNewSkill, level: 0 },
                                { name: secondSubSkill, level: 1 },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it('removes entire category if all skills are level 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [{ name: firstSkill, level: 0 }],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.data.length).toBe(0);
    });

    it('removes subSkills with level 0 but keeps skill if skill.level > 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [
                        {
                            name: firstSkill,
                            level: 2,
                            subSkills: [
                                { name: firstSubSkill, level: 0 },
                                { name: secondSubSkill, level: 1 },
                            ],
                        },
                    ],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);

        expect(cleaned.data).toEqual([
            {
                category: firstCategory,
                skills: [
                    {
                        name: firstSkill,
                        level: 2,
                        subSkills: [{ name: secondSubSkill, level: 1 }],
                    },
                ],
            },
        ]);
    });

    it('removes skill if skill.level is 0, even if subSkills have level > 0', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [
                        {
                            name: firstSkill,
                            level: 0,
                            subSkills: [{ name: firstSubSkill, level: 2 }],
                        },
                    ],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);

        expect(cleaned.data.length).toBe(0);
    });

    it('handles empty input gracefully', () => {
        const cleaned = cleanEmptyDefaultSkillsAssessment({ data: [] });
        expect(cleaned).toEqual({ data: [] });
    });

    it('keeps known default and unknown categories', () => {
        const input: SkillsAssessmentSchema = {
            data: [
                {
                    category: firstCategory,
                    skills: [{ name: firstSkill, level: 1 }],
                },
                {
                    category: nonDefaultCategory,
                    skills: [{ name: someNewSkill, level: 3 }],
                },
            ],
        };
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);

        expect(cleaned).toEqual({
            data: [
                {
                    category: firstCategory,
                    skills: [{ name: firstSkill, level: 1 }],
                },
                {
                    category: nonDefaultCategory,
                    skills: [{ name: someNewSkill, level: 3 }],
                },
            ],
        });
    });
});
