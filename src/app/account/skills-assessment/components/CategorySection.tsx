'use client';

import { TextInputWithButton } from '@/components/client/TextInputWithButton';
import type { SkillsAssessmentCategory } from '@/server/controller/skillsAssessment';
import { useState } from 'react';
import type { SkillsAssessmentActions } from '../hooks/useSkillsAssessmentActions';
import { SkillItem } from './SkillItem';

export function CategorySection({
    categoryObj,
    actions,
}: {
    categoryObj: SkillsAssessmentCategory;
    actions: SkillsAssessmentActions;
}) {
    const { category, skills } = categoryObj;

    const [newItemValue, setNewItemValue] = useState<string>('');

    const handleAdd = () => {
        actions.addItemToCategory(category, newItemValue);
        setNewItemValue('');
    };

    return (
        <div className='space-y-3 mb-3'>
            <div className='space-y-3'>
                {skills.map((skill, skillIndex) => (
                    <SkillItem
                        key={skillIndex}
                        skill={skill}
                        skillIndex={skillIndex}
                        category={category}
                        actions={actions}
                    />
                ))}
            </div>
            <TextInputWithButton
                value={newItemValue}
                onChange={setNewItemValue}
                onSubmit={handleAdd}
                placeholder={`Add to ${category}`}
                buttonLabel='Add Skill'
            />
        </div>
    );
}
