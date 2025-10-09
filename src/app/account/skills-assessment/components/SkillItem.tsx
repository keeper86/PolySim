'use client';

import { StarRating } from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SubSkillItem } from './SubSkillItem';

import type { SkillAssessment } from '@/server/endpoints/skills-assessment';
import { GoDot } from 'react-icons/go';
import type { SkillsAssessmentActions } from '../hooks/useSkillsAssessmentActions';
import { isDefaultSkill } from '../utils/getDefaultAssessmentList';
import { getIconToSkill } from '../utils/getIconToSkill';

export function SkillItem({
    skill,
    skillIndex,
    category,
    actions,
}: {
    skill: SkillAssessment;
    skillIndex: number;
    category: string;
    actions: SkillsAssessmentActions;
}) {
    const { name, level = 0, subSkills } = skill;
    const isDefault = isDefaultSkill(name);
    const Icon = getIconToSkill(name) || GoDot;
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
    const [newSubSkillValue, setNewSubSkillValue] = useState<string>('');
    return (
        <div className='flex flex-col border rounded px-3 py-2 text-secondary-foreground'>
            <div className='flex flex-row justify-between items-center gap-4'>
                <span className='font-medium min-w-0 truncate break-words sm:min-w-[100px] md:min-w-[100px] flex items-center gap-2'>
                    {!isDefault ? (
                        <button onClick={() => actions.deleteCustomSkill(category, skillIndex)}>
                            <Trash2 className='w-6 h-6 text-red-500 hover:text-red-600' />
                        </button>
                    ) : (
                        <Icon className='w-6 h-6 text-primary shrink-0' />
                    )}
                    {name}
                </span>
                <StarRating
                    level={level}
                    onChange={(level) => actions.updateItemLevel(category, skillIndex, level)}
                    onDelete={() => actions.resetSkillRatings(category, skillIndex)}
                />
            </div>
            {level > 0 && (
                <div className='mt-3 space-y-2'>
                    <div className='flex items-center gap-2 '>
                        <button
                            type='button'
                            onClick={() => setIsCollapsed((v) => !v)}
                            className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors  cursor-pointer'
                            aria-label={isCollapsed ? 'Expand sub-skills' : 'Collapse sub-skills'}
                        >
                            {isCollapsed ? <ChevronDown className='w-4 h-4' /> : <ChevronUp className='w-4 h-4' />}
                            <label className='text-sm font-medium  cursor-pointer'>Sub-Skills</label>
                        </button>
                    </div>
                    <div
                        className={`transition-all duration-250 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 pointer-events-none' : 'opacity-100'}`}
                        style={{ willChange: 'max-height, opacity' }}
                    >
                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
                            {subSkills &&
                                subSkills.map((sub, subIndex) => (
                                    <SubSkillItem
                                        key={subIndex}
                                        item={sub}
                                        onLevelChange={(level) =>
                                            actions.updateSubSkillLevel(category, skillIndex, subIndex, level)
                                        }
                                        onDelete={() => actions.deleteCustomSubSkill(category, skillIndex, subIndex)}
                                    />
                                ))}
                        </div>
                        <div className='flex gap-2 mt-2'>
                            <Input
                                type='text'
                                placeholder='Add a sub-skill'
                                value={newSubSkillValue}
                                onChange={(e) => setNewSubSkillValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        actions.addSubSkillToItem(category, skillIndex, newSubSkillValue);
                                        setNewSubSkillValue('');
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    actions.addSubSkillToItem(category, skillIndex, newSubSkillValue);
                                    setNewSubSkillValue('');
                                }}
                            >
                                <Plus className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
