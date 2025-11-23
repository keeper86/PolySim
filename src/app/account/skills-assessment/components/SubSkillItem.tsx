'use client';

import { StarRating } from '@/components/client/StarRating';
import { Trash2 } from 'lucide-react';
import { isDefaultSkill } from '../utils/getDefaultAssessmentList';
import { getIconToSkill } from '../utils/getIconToSkill';
import { GoDot } from 'react-icons/go';
import type { SkillDefinition } from '@/server/controller/skillsAssessment';

interface SubSkillItemProps {
    item: SkillDefinition;
    parentName: string;
    onLevelChange: (level: number) => void;
    onDelete: () => void;
}

export function SubSkillItem({ item, parentName, onLevelChange, onDelete }: SubSkillItemProps) {
    const Icon = getIconToSkill(item.name) || getIconToSkill(parentName) || GoDot;
    return (
        <div className='flex flex-row justify-between items-center border rounded px-3 py-2 bg-secondary text-secondary-foreground sm:gap-4 min-w-0'>
            <div className='font-medium flex items-center gap-2 min-w-0 flex-1 overflow-hidden'>
                {!isDefaultSkill(item.name) ? (
                    <button aria-label='Delete sub-skill' onClick={onDelete}>
                        <Trash2 className='w-4 h-4 text-red-500 hover:text-red-600' />
                    </button>
                ) : (
                    <Icon className='w-5 h-5 text-primary shrink-0' />
                )}
                <span className='truncate overflow-hidden whitespace-nowrap'>{item.name}</span>
            </div>
            <div className='flex-shrink-0'>
                <StarRating level={item.level} onChange={onLevelChange} onDelete={() => onLevelChange(0)} />
            </div>
        </div>
    );
}
