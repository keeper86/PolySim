'use client';

import { Star, Trash2 } from 'lucide-react';

interface StarRatingProps {
    level: number;
    maxStars?: number;
    onChange?: (level: number) => void;
    onDelete?: () => void;
}

export function StarRating({ level, maxStars = 3, onChange, onDelete }: StarRatingProps) {
    return (
        <div className='flex gap-1 items-center'>
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
                <button
                    key={star}
                    type='button'
                    onClick={() => onChange && onChange(star)}
                    className={`focus:outline-none hover:scale-110 transition-transform ${onChange ? 'cursor-pointer' : ''}`}
                    aria-label={onChange ? `Set level to ${star}` : undefined}
                >
                    <Star
                        className={`w-6 h-6 ${
                            level >= star
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                        }`}
                    />
                </button>
            ))}
            {onDelete && (
                <button
                    type='button'
                    onClick={onDelete}
                    disabled={level === 0}
                    className={`ml-2 rounded p-1 border border-muted-foreground/30 transition-colors ${level === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/70 text-muted-foreground/70'}${level !== 0 ? ' cursor-pointer' : ''}`}
                    aria-label='Reset to no experience'
                >
                    <Trash2 className={`w-4 h-4 ${level !== 0 ? 'text-red-500' : ''}`} />
                </button>
            )}
        </div>
    );
}
