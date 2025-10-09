'use client';

import { StarRating } from '@/components/shared/StarRating';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { IconType } from 'react-icons';
import { SubSkillItem } from './SubSkillItem';

interface SubSkill {
    name: string;
    level?: number;
}

interface SkillItemProps {
    name: string;
    level: number;
    subSkills?: SubSkill[];
    icon: IconType;
    isDefault: boolean;
    isCollapsed: boolean;
    newSubSkillValue: string;
    onLevelChange: (level: number) => void;
    onDelete: () => void;
    onResetRatings: () => void;
    onToggleCollapse: () => void;
    onNewSubSkillChange: (value: string) => void;
    onAddSubSkill: () => void;
    onSubSkillLevelChange: (subSkillIndex: number, level: number) => void;
    onSubSkillDelete: (subSkillIndex: number) => void;
    getSubSkillIcon: (subSkillName: string) => IconType;
    isSubSkillDefault: (subSkillName: string) => boolean;
}

export function SkillItem({
    name,
    level,
    subSkills,
    icon: Icon,
    isDefault,
    isCollapsed,
    newSubSkillValue,
    onLevelChange,
    onDelete,
    onResetRatings,
    onToggleCollapse,
    onNewSubSkillChange,
    onAddSubSkill,
    onSubSkillLevelChange,
    onSubSkillDelete,
    getSubSkillIcon,
    isSubSkillDefault,
}: SkillItemProps) {
    return (
        <div className='flex flex-col border rounded px-3 py-2 text-secondary-foreground'>
            <div className='flex flex-row justify-between items-center gap-4'>
                <span className='font-medium min-w-0 truncate break-words sm:min-w-[100px] md:min-w-[100px] flex items-center gap-2'>
                    {!isDefault ? (
                        <button onClick={onDelete}>
                            <Trash2 className='w-6 h-6 text-red-500 hover:text-red-600' />
                        </button>
                    ) : (
                        <Icon className='w-6 h-6 text-primary shrink-0' />
                    )}
                    {name}
                </span>
                <StarRating level={level} onChange={onLevelChange} onDelete={onResetRatings} />
            </div>
            {(level ?? 0) > 0 && (
                <div className='mt-3 space-y-2'>
                    <div className='flex items-center gap-2 '>
                        <button
                            type='button'
                            onClick={onToggleCollapse}
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
                                subSkills.map((sub, subIndex) => {
                                    const SubIcon = getSubSkillIcon(sub.name);
                                    return (
                                        <SubSkillItem
                                            key={subIndex}
                                            name={sub.name}
                                            level={sub.level || 0}
                                            icon={SubIcon}
                                            isDefault={isSubSkillDefault(sub.name)}
                                            onLevelChange={(level) => onSubSkillLevelChange(subIndex, level)}
                                            onDelete={() => onSubSkillDelete(subIndex)}
                                        />
                                    );
                                })}
                        </div>
                        <div className='flex gap-2 mt-2'>
                            <Input
                                type='text'
                                placeholder='Add a sub-skill'
                                value={newSubSkillValue}
                                onChange={(e) => onNewSubSkillChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onAddSubSkill();
                                    }
                                }}
                            />
                            <Button onClick={onAddSubSkill}>
                                <Plus className='w-4 h-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
