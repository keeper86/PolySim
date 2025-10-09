'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import type { IconType } from 'react-icons';
import { GoDot } from 'react-icons/go';
import { SkillItem } from './SkillItem';

interface SubSkill {
    name: string;
    level?: number;
}

interface Skill {
    name: string;
    level?: number;
    subSkills?: SubSkill[];
}

interface CategorySectionProps {
    category: string;
    skills: Skill[];
    isCollapsed: boolean;
    collapsedSkills: Record<string, boolean>;
    newItemValue: string;
    newSubSkillValues: Record<number, string>;
    onToggleCollapse: () => void;
    onNewItemChange: (value: string) => void;
    onAddItem: () => void;
    onSkillLevelChange: (skillIndex: number, level: number) => void;
    onSkillDelete: (skillIndex: number) => void;
    onSkillResetRatings: (skillIndex: number) => void;
    onToggleSkillCollapse: (skillIndex: number) => void;
    onNewSubSkillChange: (skillIndex: number, value: string) => void;
    onAddSubSkill: (skillIndex: number) => void;
    onSubSkillLevelChange: (skillIndex: number, subSkillIndex: number, level: number) => void;
    onSubSkillDelete: (skillIndex: number, subSkillIndex: number) => void;
    getSkillIcon: (skillName: string) => IconType;
    isSkillDefault: (skillName: string) => boolean;
}

export function CategorySection({
    category,
    skills,
    isCollapsed,
    collapsedSkills,
    newItemValue,
    newSubSkillValues,
    onToggleCollapse,
    onNewItemChange,
    onAddItem,
    onSkillLevelChange,
    onSkillDelete,
    onSkillResetRatings,
    onToggleSkillCollapse,
    onNewSubSkillChange,
    onAddSubSkill,
    onSubSkillLevelChange,
    onSubSkillDelete,
    getSkillIcon,
    isSkillDefault,
}: CategorySectionProps) {
    return (
        <div className='space-y-4 -mb-0.5'>
            <button
                type='button'
                onClick={onToggleCollapse}
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
                        const ItemIcon = getSkillIcon(skill.name) || GoDot;
                        const skillKey = `${category}-${skillIndex}`;

                        return (
                            <SkillItem
                                key={skillIndex}
                                name={skill.name}
                                level={skill.level || 0}
                                subSkills={skill.subSkills}
                                icon={ItemIcon}
                                isDefault={isSkillDefault(skill.name)}
                                isCollapsed={collapsedSkills[skillKey] || false}
                                newSubSkillValue={newSubSkillValues[skillIndex] || ''}
                                onLevelChange={(level) => onSkillLevelChange(skillIndex, level)}
                                onDelete={() => onSkillDelete(skillIndex)}
                                onResetRatings={() => onSkillResetRatings(skillIndex)}
                                onToggleCollapse={() => onToggleSkillCollapse(skillIndex)}
                                onNewSubSkillChange={(value) => onNewSubSkillChange(skillIndex, value)}
                                onAddSubSkill={() => onAddSubSkill(skillIndex)}
                                onSubSkillLevelChange={(subSkillIndex, level) =>
                                    onSubSkillLevelChange(skillIndex, subSkillIndex, level)
                                }
                                onSubSkillDelete={(subSkillIndex) => onSubSkillDelete(skillIndex, subSkillIndex)}
                                getSubSkillIcon={(subSkillName) => getSkillIcon(subSkillName) || ItemIcon}
                                isSubSkillDefault={isSkillDefault}
                            />
                        );
                    })}
                </div>
                <div className='flex gap-2'>
                    <Input
                        type='text'
                        placeholder={`Add to ${category}`}
                        value={newItemValue}
                        onChange={(e) => onNewItemChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onAddItem()}
                    />
                    <Button onClick={onAddItem}>
                        <Plus className='w-4 h-4 cursor-pointer' />
                        Add
                    </Button>
                </div>
            </div>
        </div>
    );
}
