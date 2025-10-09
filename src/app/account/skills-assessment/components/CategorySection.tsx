'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SkillsAssessmentCategory } from '@/server/endpoints/skills-assessment';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { GoDot } from 'react-icons/go';
import type { SkillsAssessmentActions } from '../hooks/useSkillsAssessmentActions';
import { SkillItem } from './SkillItem';

import { isDefaultSkill } from '../utils/getDefaultAssessmentList';
import { getIconToSkill } from '../utils/getIconToSkill';

export function CategorySection({
    categoryObj,
    actions,
}: {
    categoryObj: SkillsAssessmentCategory;
    actions: SkillsAssessmentActions;
}) {
    const { category, skills } = categoryObj;

    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [collapsedSkills, setCollapsedSkills] = useState<Record<number, boolean>>({});
    const [newItemValue, setNewItemValue] = useState<string>('');
    const [newSubSkillValues, setNewSubSkillValues] = useState<Record<number, string>>({});

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
                    {skills.map((skill, skillIndex) => {
                        const ItemIcon = getIconToSkill(skill.name) || GoDot;
                        return (
                            <SkillItem
                                key={skillIndex}
                                name={skill.name}
                                level={skill.level || 0}
                                subSkills={skill.subSkills}
                                icon={ItemIcon}
                                isDefault={isDefaultSkill(skill.name)}
                                isCollapsed={collapsedSkills[skillIndex] || false}
                                newSubSkillValue={newSubSkillValues[skillIndex] || ''}
                                onLevelChange={(level) => actions.updateItemLevel(category, skillIndex, level)}
                                onDelete={() => actions.deleteCustomSkill(category, skillIndex)}
                                onResetRatings={() => actions.resetSkillRatings(category, skillIndex)}
                                onToggleCollapse={() =>
                                    setCollapsedSkills((prev) => ({ ...prev, [skillIndex]: !prev[skillIndex] }))
                                }
                                onNewSubSkillChange={(value) =>
                                    setNewSubSkillValues((prev) => ({ ...prev, [skillIndex]: value }))
                                }
                                onAddSubSkill={() => {
                                    actions.addSubSkillToItem(
                                        category,
                                        skillIndex,
                                        newSubSkillValues[skillIndex] || '',
                                    );
                                    setNewSubSkillValues((prev) => ({ ...prev, [skillIndex]: '' }));
                                }}
                                onSubSkillLevelChange={(subSkillIndex, level) =>
                                    actions.updateSubSkillLevel(category, skillIndex, subSkillIndex, level)
                                }
                                onSubSkillDelete={(subSkillIndex) =>
                                    actions.deleteCustomSubSkill(category, skillIndex, subSkillIndex)
                                }
                                getSubSkillIcon={(subSkillName) => getIconToSkill(subSkillName) || ItemIcon}
                                isSubSkillDefault={isDefaultSkill}
                            />
                        );
                    })}
                </div>
                <div className='flex gap-2'>
                    <Input
                        type='text'
                        placeholder={`Add to ${category}`}
                        value={newItemValue}
                        onChange={(e) => setNewItemValue(e.target.value)}
                        onKeyDown={(e) =>
                            e.key === 'Enter' &&
                            (() => {
                                actions.addItemToCategory(category, newItemValue);
                                setNewItemValue('');
                            })()
                        }
                    />
                    <Button
                        onClick={() => {
                            actions.addItemToCategory(category, newItemValue);
                            setNewItemValue('');
                        }}
                    >
                        <Plus className='w-4 h-4 cursor-pointer' />
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}
