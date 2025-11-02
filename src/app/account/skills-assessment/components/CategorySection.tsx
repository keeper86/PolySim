'use client';

import { TextInputWithButton } from '@/components/client/TextInputWithButton';
import type { SkillsAssessmentCategory } from '@/server/controller/skillsAssessment';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [newItemValue, setNewItemValue] = useState<string>('');

    const handleAdd = () => {
        actions.addItemToCategory(category, newItemValue);
        setNewItemValue('');
    };

    return (
        <div className='space-y-4 -mb-0.5'>
            <button
                type='button'
                onClick={() => setIsCollapsed((v) => !v)}
                className='flex items-center gap-2 text-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus:outline-none px-0 py-0 bg-transparent border-none w-auto'
                aria-label={isCollapsed ? 'Expand category' : 'Collapse category'}
                style={{ textAlign: 'left' }}
            >
                {isCollapsed ? <ChevronDown className='w-6 h-6' /> : <ChevronUp className='w-6 h-6' />}
                <span className='text-2xl font-semibold capitalize'>{category}</span>
            </button>
            <div
                className={`transition-all duration-200 ease-out overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'opacity-100 mb-6'}`}
                style={{ willChange: 'max-height, opacity' }}
            >
                <div className='space-y-3 mb-3'>
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
        </div>
    );
}
