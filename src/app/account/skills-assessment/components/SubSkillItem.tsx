'use client';

import { StarRating } from '@/components/shared/StarRating';
import { Trash2 } from 'lucide-react';
import type { IconType } from 'react-icons';

interface SubSkillItemProps {
    name: string;
    level: number;
    icon: IconType;
    isDefault: boolean;
    onLevelChange: (level: number) => void;
    onDelete: () => void;
}

export function SubSkillItem({ name, level, icon: Icon, isDefault, onLevelChange, onDelete }: SubSkillItemProps) {
    return (
        <div className='flex flex-row justify-between items-center border rounded px-3 py-2 bg-secondary text-secondary-foreground sm:gap-4'>
            <div className='font-medium flex items-center gap-2'>
                {!isDefault ? (
                    <button onClick={onDelete}>
                        <Trash2 className='w-4 h-4 text-red-500 hover:text-red-600' />
                    </button>
                ) : (
                    <Icon className='w-5 h-5 text-primary shrink-0' />
                )}
                {name}
            </div>
            <StarRating level={level} onChange={onLevelChange} onDelete={() => onLevelChange(0)} />
        </div>
    );
}
