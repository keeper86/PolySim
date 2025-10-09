'use client';

import { CategorySection } from '@/app/account/skills-assessment/components/CategorySection';
import { ConfirmResetDialog } from '@/app/account/skills-assessment/components/ConfirmResetDialog';
import { useSkillsAssessment } from '@/app/account/skills-assessment/hooks/useSkillsAssessment';
import { useSkillsAssessmentActions } from '@/app/account/skills-assessment/hooks/useSkillsAssessmentActions';
import { getLevelText } from '@/app/account/skills-assessment/utils/getLevelText';
import { trpcClient } from '@/app/clientTrpc';
import { StarRating } from '@/components/shared/StarRating';
import { SyncStatusIndicator } from '@/components/shared/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SkillsAssessmentPage() {
    const [data, setData] = useState<SkillsAssessmentSchema>([]);
    const [confirmDelete, setConfirmDelete] = useState<{ categoryIdx: number; itemIndex: number } | null>(null);

    const { data: queryData, isInitializing, isLoadError, loadError, saveMutation } = useSkillsAssessment();

    const skillAssessmentActions = useSkillsAssessmentActions(data, setData, saveMutation);

    useEffect(() => {
        if (queryData) {
            setData(queryData);
        }
    }, [queryData]);

    useEffect(() => {
        if (isLoadError) {
            toast.error('Failed to load skills assessment', {
                description: loadError instanceof Error ? loadError.message : 'Unknown error',
            });
        }
    }, [isLoadError, loadError]);

    if (isInitializing) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <Loader className='w-8 h-8 text-muted-foreground animate-spin' style={{ animationDuration: '2s' }} />
            </div>
        );
    }

    const getSyncStatus = () => {
        if (saveMutation.isPending) {
            return 'pending';
        }
        if (saveMutation.isError) {
            return 'error';
        }
        return 'success';
    };

    return (
        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6 relative' style={{ minWidth: 320 }}>
            <div className='fixed right-4 top-4 z-10'>
                <SyncStatusIndicator status={getSyncStatus()} />
            </div>
            <ConfirmResetDialog
                open={!!confirmDelete}
                onCancel={() => setConfirmDelete(null)}
                onConfirm={() => {
                    if (confirmDelete) {
                        const { categoryIdx, itemIndex } = confirmDelete;
                        const category = data[categoryIdx].category;
                        skillAssessmentActions.resetSkillRatings(category, itemIndex);
                        setConfirmDelete(null);
                    }
                }}
            />
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>Skills Assessment</h1>
            </div>
            <div className='space-y-2'>
                <p className='text-muted-foreground'>
                    Rate your proficiency with programming languages and tools. Changes are saved automatically.
                </p>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground mt-4'>
                    <span className='font-medium min-w-[100px]'>Rating Scale:</span>
                    {[0, 1, 2, 3].map((level) => (
                        <Tooltip key={level}>
                            <TooltipTrigger asChild>
                                <div className='flex flex-col xs:flex-row xs:items-center gap-2 cursor-help'>
                                    <span className='px-2 py-1 rounded bg-muted text-muted-foreground text-xs min-w-[90px] text-center'>
                                        {getLevelText(level).label}
                                    </span>
                                    <div className='sm:hidden flex flex-row items-center justify-start gap-2 w-full mt-1 text-xs text-muted-foreground'>
                                        <StarRating level={level} />
                                        <span className='break-words text-left'>{getLevelText(level).description}</span>
                                    </div>
                                    <div className='hidden sm:flex items-center gap-1'>
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
            {data.map((categoryObj) => (
                <CategorySection
                    key={categoryObj.category}
                    categoryObj={categoryObj}
                    actions={skillAssessmentActions}
                />
            ))}
            <Separator className='mt-8' />
            <div className='h-16 mt-auto'>
                <Button
                    onClick={async () => {
                        const json = JSON.stringify(await trpcClient['skills-assessment-get'].query(), null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'skills-assessment.json';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    variant='outline'
                    className='w-full sm:w-auto mx-auto flex items-center gap-2'
                >
                    Download Data as JSON
                </Button>
            </div>
        </div>
    );
}
