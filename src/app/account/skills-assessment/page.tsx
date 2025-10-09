'use client';

import { trpcClient } from '@/app/clientTrpc';
import { CategorySection } from '@/components/skills-assessment/CategorySection';
import { ConfirmResetDialog } from '@/components/skills-assessment/ConfirmResetDialog';
import { StarRating } from '@/components/shared/StarRating';
import { SyncStatusIndicator } from '@/components/shared/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSkillsAssessment } from '@/hooks/useSkillsAssessment';
import { useSkillsAssessmentActions } from '@/hooks/useSkillsAssessmentActions';
import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import { getIconToSkill } from '@/utils/getIconToSkill';
import { getLevelText } from '@/utils/getLevelText';
import { isDefaultSkill } from '@/utils/getDefaultAssessmentList';
import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SkillsAssessmentPage() {
    const [data, setData] = useState<SkillsAssessmentSchema>([]);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [newSubSkill, setNewSubSkill] = useState<Record<string, Record<number, string>>>({});
    const [confirmDelete, setConfirmDelete] = useState<{ categoryIdx: number; itemIndex: number } | null>(null);
    const [collapsedSkills, setCollapsedSkills] = useState<Record<string, boolean>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const { data: queryData, isInitializing, isLoadError, loadError, saveMutation } = useSkillsAssessment();

    const {
        addItemToCategory,
        updateItemLevel,
        deleteCustomSkill,
        resetSkillRatings,
        addSubSkillToItem,
        updateSubSkillLevel,
        deleteCustomSubSkill,
    } = useSkillsAssessmentActions(data, setData, saveMutation);

    // Sync query data to local state
    useEffect(() => {
        if (queryData) {
            setData(queryData);
        }
    }, [queryData]);

    // Show error toast on load error
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
        if (saveMutation.isPending) {return 'pending';}
        if (saveMutation.isError) {return 'error';}
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
                        resetSkillRatings(category, itemIndex);
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
            {data.map((categoryObj, categoryIdx) => {
                const category = categoryObj.category;
                const items = categoryObj.skills;
                const isCollapsed = collapsedCategories[category];

                return (
                    <CategorySection
                        key={category}
                        category={category}
                        skills={items}
                        isCollapsed={isCollapsed}
                        collapsedSkills={collapsedSkills}
                        newItemValue={newItem[category] || ''}
                        newSubSkillValues={newSubSkill[category] || {}}
                        onToggleCollapse={() =>
                            setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }))
                        }
                        onNewItemChange={(value) => setNewItem((prev) => ({ ...prev, [category]: value }))}
                        onAddItem={() => {
                            addItemToCategory(category, newItem[category] || '');
                            setNewItem((prev) => ({ ...prev, [category]: '' }));
                        }}
                        onSkillLevelChange={(skillIndex, level) => updateItemLevel(category, skillIndex, level)}
                        onSkillDelete={(skillIndex) => deleteCustomSkill(category, skillIndex)}
                        onSkillResetRatings={(skillIndex) => {
                            const item = items[skillIndex];
                            if (item.subSkills && item.subSkills.some((s) => s.level && s.level > 0)) {
                                setConfirmDelete({ categoryIdx, itemIndex: skillIndex });
                            } else {
                                resetSkillRatings(category, skillIndex);
                            }
                        }}
                        onToggleSkillCollapse={(skillIndex) => {
                            const key = `${category}-${skillIndex}`;
                            setCollapsedSkills((prev) => ({ ...prev, [key]: !prev[key] }));
                        }}
                        onNewSubSkillChange={(skillIndex, value) =>
                            setNewSubSkill((prev) => ({
                                ...prev,
                                [category]: { ...(prev[category] || {}), [skillIndex]: value },
                            }))
                        }
                        onAddSubSkill={(skillIndex) => {
                            const subSkillName = newSubSkill[category]?.[skillIndex] || '';
                            addSubSkillToItem(category, skillIndex, subSkillName);
                            setNewSubSkill((prev) => ({
                                ...prev,
                                [category]: { ...(prev[category] || {}), [skillIndex]: '' },
                            }));
                        }}
                        onSubSkillLevelChange={(skillIndex, subSkillIndex, level) =>
                            updateSubSkillLevel(category, skillIndex, subSkillIndex, level)
                        }
                        onSubSkillDelete={(skillIndex, subSkillIndex) =>
                            deleteCustomSubSkill(category, skillIndex, subSkillIndex)
                        }
                        getSkillIcon={getIconToSkill}
                        isSkillDefault={isDefaultSkill}
                    />
                );
            })}
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
