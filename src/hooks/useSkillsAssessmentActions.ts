import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import type { UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useSkillsAssessmentActions(
    data: SkillsAssessmentSchema,
    setData: (data: SkillsAssessmentSchema) => void,
    saveMutation: UseMutationResult<void, unknown, SkillsAssessmentSchema>,
) {
    const getCategoryIdx = (category: string) => data.findIndex((c) => c.category === category);

    const addItemToCategory = (category: string, value: string) => {
        const trimmedValue = value.trim();
        if (!trimmedValue) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        if (data[idx].skills.some((item) => item.name.toLowerCase() === trimmedValue.toLowerCase())) {
            toast.error('This entry already exists');
            return;
        }
        const updated = [...data];
        updated[idx] = {
            ...updated[idx],
            skills: [...updated[idx].skills, { name: trimmedValue, level: 0, subSkills: [] }],
        };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const updateItemLevel = (category: string, index: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        skills[index] = { ...skills[index], level };
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const deleteCustomSkill = (category: string, itemIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (item.subSkills && item.subSkills.some((s) => s.level && s.level > 0)) {
            toast.error('Cannot delete skill with rated sub-skills. Reset ratings first.');
            return;
        }
        updated[idx] = { ...updated[idx], skills: skills.filter((_, i) => i !== itemIndex) };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const resetSkillRatings = (category: string, itemIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const skill = { ...skills[itemIndex], level: 0 };
        if (skill.subSkills) {
            skill.subSkills = skill.subSkills.map((s) => ({ ...s, level: 0 }));
        }
        skills[itemIndex] = skill;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const addSubSkillToItem = (category: string, itemIndex: number, subSkillName: string) => {
        if (!subSkillName.trim()) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        item.subSkills = item.subSkills ? [...item.subSkills] : [];
        if (item.subSkills.some((s) => s.name.toLowerCase() === subSkillName.toLowerCase())) {
            toast.error('This sub-skill already exists');
            return;
        }
        item.subSkills.push({ name: subSkillName, level: 0 });
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const updateSubSkillLevel = (category: string, itemIndex: number, subSkillIndex: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = [...item.subSkills];
        item.subSkills[subSkillIndex] = { ...item.subSkills[subSkillIndex], level };
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        saveMutation.mutate(updated);
    };

    const deleteCustomSubSkill = (category: string, itemIndex: number, subIndex: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = item.subSkills.filter((_, i) => i !== subIndex);
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        saveMutation.mutate(updated);
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
