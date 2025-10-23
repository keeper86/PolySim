'use client';

import { Star, Trash2 } from 'lucide-react';

interface StarRatingProps {
    level?: number;
    maxStars?: number;
    onChange?: (level: number) => void;
    onDelete?: () => void;
}

function getStarClass(level: number | undefined, star: number) {
    if (level && level >= star) {
        return 'fill-yellow-400 text-yellow-400';
    }
    return 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700';
}

function getDeleteButtonClass(level: number | undefined) {
    const base = 'ml-2 rounded p-1 border border-muted-foreground/30 transition-colors';
    if (!level || level === 0) {
        return `${base} opacity-40 cursor-not-allowed`;
    }
    return `${base} hover:bg-muted/70 text-muted-foreground/70 cursor-pointer`;
}

function getStarButtonClass(onChange: ((level: number) => void) | undefined) {
    const base = 'focus:outline-none hover:scale-110 transition-transform';
    return onChange ? `${base} cursor-pointer` : base;
}

export function StarRating({ level, maxStars = 3, onChange, onDelete }: StarRatingProps) {
    return (
        <div className='flex gap-1 items-center'>
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
                <button
                    key={star}
                    type='button'
                    onClick={() => onChange && onChange(star)}
                    className={getStarButtonClass(onChange)}
                    aria-label={onChange ? `Set level to ${star}` : undefined}
                >
                    <Star className={`w-6 h-6 ${getStarClass(level, star)}`} />
                </button>
            ))}
            {onDelete && (
                <button
                    type='button'
                    onClick={onDelete}
                    disabled={level === 0}
                    className={getDeleteButtonClass(level)}
                    aria-label='Reset to no experience'
                >
                    <Trash2 className={`w-4 h-4${level && level !== 0 ? ' text-red-500' : ''}`} />
                </button>
            )}
        </div>
    );
}
