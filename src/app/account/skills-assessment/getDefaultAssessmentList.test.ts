import { describe, it, expect } from 'vitest';
import { getDefaultSkillsAssessment, cleanEmptyDefaultSkillsAssessment } from './getDefaultAssessmentList';
import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';

const defaultSkills = getDefaultSkillsAssessment();

const firstCategory = defaultSkills[0].name;
const firstSkill = defaultSkills[0].skills[0].name;
const firstSubSkill1 = defaultSkills[0].skills[0].subSkills![0].name;
const firstSubSkill2 = defaultSkills[0].skills[0].subSkills![1].name;

const someNewSkill = 'Some New Skill';
const minimalMerge: SkillsAssessmentSchema = [
    {
        name: firstCategory,
        skills: [
            {
                name: firstSkill,
                level: 3,
                subSkills: [
                    { name: firstSubSkill1, level: 2 },
                    { name: firstSubSkill2, level: 0 },
                ],
            },
            { name: someNewSkill, level: 2, subSkills: [{ name: 'SubSkill1', level: 1 }] },
        ],
    },
];

const nonDefaultCategory = 'Non-default category';
const wrongMerge1: SkillsAssessmentSchema = [
    {
        name: nonDefaultCategory, // This category does not exist in the default; categories cannot be added
        skills: [{ name: 'New Skill', level: 1 }],
    },
];

describe('getDefaultSkillsAssessment', () => {
    it('merges levels from mergeWith argument', () => {
        const result = getDefaultSkillsAssessment(minimalMerge);
        const js = result.find((cat) => cat.name === firstCategory)?.skills.find((s) => s.name === firstSkill);
        expect(js?.level).toBe(3);

        const ts = js?.subSkills?.find((ss) => ss.name === firstSubSkill1);
        expect(ts?.level).toBe(2);

        const node = js?.subSkills?.find((ss) => ss.name === firstSubSkill2);
        expect(node?.level).toBe(0);
    });

    it('ignores categories in mergeWith that are not in the default', () => {
        expect(wrongMerge1.find((cat) => cat.name === nonDefaultCategory)).toBeDefined();

        const result = getDefaultSkillsAssessment(wrongMerge1);

        expect(result.find((cat) => cat.name === nonDefaultCategory)).toBeUndefined();
    });

    it('includes user-defined skills in the merged result', () => {
        const result = getDefaultSkillsAssessment(minimalMerge);
        const cat = result.find((cat) => cat.name === firstCategory);

        expect(cat?.skills.find((s) => s.name === someNewSkill)).toBeDefined();
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.level).toBe(2);
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.subSkills?.[0].name).toBe('SubSkill1');
        expect(cat?.skills.find((s) => s.name === someNewSkill)?.subSkills?.[0].level).toBe(1);
    });
});

describe('cleanEmptyDefaultSkillsAssessment', () => {
    it('removes entire category if all skills are level 0', () => {
        const input: SkillsAssessmentSchema = [
            {
                name: firstCategory,
                skills: [{ name: 'Skill1', level: 0 }],
            },
        ];
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.length).toBe(0);
    });

    it('removes subSkills with level 0 but keeps skill if skill.level > 0', () => {
        const input: SkillsAssessmentSchema = [
            {
                name: firstCategory,
                skills: [
                    {
                        name: 'Skill',
                        level: 2,
                        subSkills: [
                            { name: 'Sub1', level: 0 },
                            { name: 'Sub2', level: 1 },
                        ],
                    },
                ],
            },
        ];
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);

        expect(cleaned).toEqual([
            {
                name: firstCategory,
                skills: [
                    {
                        name: 'Skill',
                        level: 2,
                        subSkills: [{ name: 'Sub2', level: 1 }],
                    },
                ],
            },
        ]);
    });

    it('removes skill if skill.level is 0, even if subSkills have level > 0', () => {
        const input: SkillsAssessmentSchema = [
            {
                name: firstCategory,
                skills: [
                    {
                        name: 'Skill',
                        level: 0,
                        subSkills: [{ name: 'Sub1', level: 2 }],
                    },
                ],
            },
        ];
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);
        expect(cleaned.length).toBe(0);
    });

    it('handles empty input gracefully', () => {
        const cleaned = cleanEmptyDefaultSkillsAssessment([]);
        expect(cleaned).toEqual([]);
    });

    it('keeps known default-categories and ignores unknown ones', () => {
        const input: SkillsAssessmentSchema = [
            {
                name: firstCategory,
                skills: [{ name: 'Skill1', level: 1 }],
            },
            {
                name: 'Non-default category',
                skills: [{ name: 'Skill3', level: 3 }],
            },
        ];
        const cleaned = cleanEmptyDefaultSkillsAssessment(input);

        expect(cleaned).toEqual([
            {
                name: firstCategory,
                skills: [{ name: 'Skill1', level: 1 }],
            },
        ]);
    });
});
