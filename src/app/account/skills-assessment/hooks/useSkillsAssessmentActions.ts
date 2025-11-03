import type { SkillsAssessmentSchema } from '@/server/controller/skillsAssessment';
import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cleanEmptyDefaultSkillsAssessment } from '../utils/getDefaultAssessmentList';

export function useSkillsAssessmentActions(
    schema: SkillsAssessmentSchema,
    saveMutation: UseMutationResult<unknown, unknown, SkillsAssessmentSchema>,
) {
    const getCategoryIdx = (category: string) => schema.data.findIndex((c) => c.category === category);

    const update = (schema: SkillsAssessmentSchema) => saveMutation.mutate(cleanEmptyDefaultSkillsAssessment(schema));

    const addItemToCategory = (category: string, value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        if (schema.data[idx].skills.some((item) => item.name.toLowerCase() === trimmedValue.toLowerCase())) {
            toast.error('This entry already exists');
            return;
        }
        const updated = { ...schema };
        updated.data[idx] = {
            ...updated.data[idx],
            skills: [...updated.data[idx].skills, { name: trimmedValue, level: 0, subSkills: [] }],
        };

        update(updated);
    };

    const updateItemLevel = (category: string, index: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        skills[index] = { ...skills[index], level };
        updated.data[idx] = { ...updated.data[idx], skills };

        update(updated);
    };

    const deleteCustomSkill = (category: string, itemIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        const item = { ...skills[itemIndex] };
        if (item.subSkills && item.subSkills.some((s) => s.level && s.level > 0)) {
            toast.error('Cannot delete skill with rated sub-skills. Reset ratings first.');
            return;
        }
        updated.data[idx] = { ...updated.data[idx], skills: skills.filter((_, i) => i !== itemIndex) };

        update(updated);
    };

    const resetSkillRatings = (category: string, itemIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        const skill = { ...skills[itemIndex], level: 0 };
        if (skill.subSkills) {
            skill.subSkills = skill.subSkills.map((s) => ({ ...s, level: 0 }));
        }
        skills[itemIndex] = skill;
        updated.data[idx] = { ...updated.data[idx], skills };

        update(updated);
    };

    const addSubSkillToItem = (category: string, itemIndex: number, subSkillName: string) => {
        if (!subSkillName.trim()) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        const item = { ...skills[itemIndex] };
        item.subSkills = item.subSkills ? [...item.subSkills] : [];
        if (item.subSkills.some((s) => s.name.toLowerCase() === subSkillName.toLowerCase())) {
            toast.error('This sub-skill already exists');
            return;
        }
        item.subSkills.push({ name: subSkillName, level: 0 });
        skills[itemIndex] = item;
        updated.data[idx] = { ...updated.data[idx], skills };

        update(updated);
    };

    const updateSubSkillLevel = (category: string, itemIndex: number, subSkillIndex: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = [...item.subSkills];
        item.subSkills[subSkillIndex] = { ...item.subSkills[subSkillIndex], level };
        skills[itemIndex] = item;
        updated.data[idx] = { ...updated.data[idx], skills };

        update(updated);
    };

    const deleteCustomSubSkill = (category: string, itemIndex: number, subIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = { ...schema };
        const skills = [...updated.data[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = item.subSkills.filter((_, i) => i !== subIndex);
        skills[itemIndex] = item;
        updated.data[idx] = { ...updated.data[idx], skills };

        update(updated);
    };

    return {
        addItemToCategory,
        updateItemLevel,
        deleteCustomSkill,
        resetSkillRatings,
        addSubSkillToItem,
        updateSubSkillLevel,
        deleteCustomSubSkill,
    };
}

export type SkillsAssessmentActions = ReturnType<typeof useSkillsAssessmentActions>;
