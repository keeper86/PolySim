import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { StarRating } from '@/components/client/StarRating';
import type { FC } from 'react';

function getLevelText(level: number) {
    switch (level) {
        case 0:
            return {
                label: 'No experience',
                description: 'What?',
            };
        case 1:
            return {
                label: 'Beginner',
                description: 'Some Experience, basic understanding, can work with guidance and documentation',
            };
        case 2:
            return {
                label: 'Intermediate',
                description: 'Solid working knowledge, can solve problems independently',
            };
        case 3:
            return {
                label: 'Expert',
                description: 'Can mentor others and handle complex challenges, knows their limitations',
            };
        default:
            return {
                label: `${level}`,
                description: 'Unknown level',
            };
    }
}

export const RatingScale: FC = () => {
    return (
        <div className='space-y-2'>
            <p className='text-muted-foreground'>
                Rate your proficiency with programming languages and tools. Changes are saved automatically.
            </p>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap flex-wrap text-sm text-muted-foreground mt-4'>
                <span className='font-medium min-w-0 w-[100px] sm:w-[100px]'>Rating Scale:</span>
                <div className='flex flex-wrap gap-2 items-start'>
                    {[0, 1, 2, 3].map((level) => (
                        <Tooltip key={level}>
                            <TooltipTrigger asChild>
                                <div className='flex flex-col xs:flex-row xs:items-center gap-2 cursor-help'>
                                    <span className='px-2 py-1 rounded bg-muted text-muted-foreground text-xs min-w-0 w-[100px] text-center'>
                                        {getLevelText(level).label}
                                    </span>
                                    <div className='sm:hidden flex flex-row items-center justify-start gap-8 w-full mt-1 text-xs text-muted-foreground'>
                                        <StarRating level={level} />
                                        <span className='break-words text-left'>{getLevelText(level).description}</span>
                                    </div>
                                    <div className='hidden sm:flex items-center justify-center gap-1'>
                                        <StarRating level={level} />
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side='bottom'>
                                <p className='max-w-sm break-words text-center'>{getLevelText(level).description}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </div>
            </div>
        </div>
    );
};
