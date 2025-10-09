'use client';

import { trpcClient } from '@/app/clientTrpc';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, ChevronDown, ChevronUp, Loader, Loader2, Plus, Star, Trash2, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';

import { GoDot } from 'react-icons/go';

import { clientLogger } from '@/app/clientLogger';
import { Separator } from '@/components/ui/separator';
import type { SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import {
    cleanEmptyDefaultSkillsAssessment,
    getDefaultSkillsAssessment,
    isDefaultSkill,
} from './getDefaultAssessmentList';
import { getIconToSkill } from './getIconToSkill';

const childLogger = clientLogger.child('SkillsAssessmentPage');

export default function SkillsAssessmentPage() {
    const [data, setData] = useState<SkillsAssessmentSchema>([]);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [newSubSkill, setNewSubSkill] = useState<Record<string, Record<number, string>>>({});
    const [confirmDelete, setConfirmDelete] = useState<{ categoryIdx: number; itemIndex: number } | null>(null);
    const [collapsedSkills, setCollapsedSkills] = useState<Record<string, boolean>>({});
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Save mutation with React Query
    const saveMutation = useMutation({
        mutationFn: async (dataToSave: SkillsAssessmentSchema) => {
            const cleanedData = cleanEmptyDefaultSkillsAssessment(dataToSave);
            childLogger.debug('Saving skills assessment', { data: cleanedData });
            await trpcClient['skills-assessment-save'].mutate(cleanedData);
        },
        onError: (error) => {
            toast.error('Failed to save skills assessment', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
            childLogger.error('Failed to save skills assessment', { error });
        },
    });

    function deleteCustomSubSkill(category: string, itemIndex: number, subIndex: number): void {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = item.subSkills.filter((_, i) => i !== subIndex);
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
    }

    function deleteCustomSkill(category: string, itemIndex: number): void {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (item.subSkills && item.subSkills.some((s) => s.level && s.level > 0)) {
            toast.error('Cannot delete skill with rated sub-skills. Reset ratings first.');
            return;
        }
        updated[idx] = { ...updated[idx], skills: skills.filter((_, i) => i !== itemIndex) };
        setData(updated);
    }

    const getCategoryIdx = (category: string) => data.findIndex((c) => c.category === category);

    // Initialize data from query result
    const {
        data: queryData,
        isLoading: isInitializing,
        isError: isLoadError,
        error: loadError,
    } = useQuery({
        queryKey: ['skills-assessment'],
        queryFn: async () => {
            childLogger.debug('Fetching skills assessment');
            const result = await trpcClient['skills-assessment-get'].query();
            if (!result || result.length === 0) {
                childLogger.debug('No existing skills assessment found, loading default');
                return getDefaultSkillsAssessment();
            } else {
                childLogger.debug('Loaded existing skills assessment');
                return getDefaultSkillsAssessment(result);
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

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

    // Debounced auto-save effect
    useEffect(() => {
        if (isInitializing || data.length === 0) {
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
            saveMutation.mutate(data);
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, isInitializing]);

    const addItemToCategory = (category: string) => {
        const value = newItem[category]?.trim();
        if (!value) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        if (data[idx].skills.some((item) => item.name.toLowerCase() === value.toLowerCase())) {
            toast.error('This entry already exists');
            return;
        }
        const updated = [...data];
        updated[idx] = {
            ...updated[idx],
            skills: [...updated[idx].skills, { name: value, level: 0, subSkills: [] }],
        };
        setData(updated);
        setNewItem((prev) => ({ ...prev, [category]: '' }));
    };

    const updateItemLevel = (category: string, index: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        skills[index] = { ...skills[index], level };
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
    };

    const addSubSkillToItem = (category: string, itemIndex: number, subSkillName: string) => {
        if (!subSkillName.trim()) {
            return;
        }
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        item.subSkills = item.subSkills ? [...item.subSkills] : [];
        if (item.subSkills.some((s) => s.name.toLowerCase() === subSkillName.toLowerCase())) {
            toast.error('This sub-skill already exists');
            return;
        }
        item.subSkills.push({ name: subSkillName, level: 0 });
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
        setNewSubSkill((prev) => ({ ...prev, [category]: { ...(prev[category] || {}), [itemIndex]: '' } }));
    };

    const updateSubSkillLevel = (category: string, itemIndex: number, subSkillIndex: number, level: number) => {
        const idx = getCategoryIdx(category);
        if (idx === -1) {
            return;
        }
        const updated = [...data];
        const skills = [...updated[idx].skills];
        const item = { ...skills[itemIndex] };
        if (!item.subSkills) {
            return;
        }
        item.subSkills = [...item.subSkills];
        item.subSkills[subSkillIndex] = { ...item.subSkills[subSkillIndex], level };
        skills[itemIndex] = item;
        updated[idx] = { ...updated[idx], skills };
        setData(updated);
    };

    const StarRating = ({
        level,
        onChange,
        onDelete,
    }: {
        level: number;
        onChange?: (level: number) => void;
        onDelete?: () => void;
    }) => {
        return (
            <div className='flex gap-1 items-center'>
                {[1, 2, 3].map((star) => (
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
    };

    const getLevelText = (level: number) => {
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
    };

    if (isInitializing) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <Loader className='w-8 h-8 text-muted-foreground animate-spin' style={{ animationDuration: '2s' }} />
            </div>
        );
    }

    // Compute sync status
    const getSyncStatus = () => {
        if (saveMutation.isPending) {
            return { icon: Loader2, text: 'Saving...', className: 'text-blue-500 animate-spin' };
        }
        if (saveMutation.isError) {
            return { icon: XCircle, text: 'Save failed', className: 'text-red-500' };
        }
        if (saveMutation.isSuccess) {
            return { icon: CheckCircle2, text: 'All changes saved', className: 'text-green-500' };
        }
        return null;
    };
    const syncStatus = getSyncStatus();

    return (
        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6' style={{ minWidth: 320 }}>
            <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Ratings?</DialogTitle>
                        <DialogDescription>
                            This entry has sub-skills with a non-zero rating. Do you want to reset the ratings for the
                            sub-skills as well?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex gap-2 justify-end'>
                        <Button variant='outline' onClick={() => setConfirmDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant='destructive'
                            onClick={() => {
                                if (confirmDelete) {
                                    const updated = [...data];
                                    const { categoryIdx, itemIndex } = confirmDelete;
                                    const skills = [...updated[categoryIdx].skills];
                                    const skill = { ...skills[itemIndex], level: 0 };
                                    if (skill.subSkills) {
                                        skill.subSkills = skill.subSkills.map((s) => ({ ...s, level: 0 }));
                                    }
                                    skills[itemIndex] = skill;
                                    updated[categoryIdx] = { ...updated[categoryIdx], skills };
                                    setData(updated);
                                    setConfirmDelete(null);
                                }
                            }}
                        >
                            Reset all ratings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>Skills Assessment</h1>
                {syncStatus && (
                    <div className='flex items-center gap-2 text-sm'>
                        <syncStatus.icon className={`w-4 h-4 ${syncStatus.className}`} />
                        <span className={syncStatus.className}>{syncStatus.text}</span>
                    </div>
                )}
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
                    <div className='space-y-4 -mb-0.5' key={category}>
                        <button
                            type='button'
                            onClick={() => setCollapsedCategories((prev) => ({ ...prev, [category]: !prev[category] }))}
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
                                {items.map((item, itemIndex) => {
                                    const ItemIcon = getIconToSkill(item.name) || GoDot;
                                    return (
                                        <div
                                            key={itemIndex}
                                            className='flex flex-col border rounded px-3 py-2 text-secondary-foreground'
                                        >
                                            <div className='flex flex-row justify-between items-center gap-4'>
                                                <span className='font-medium min-w-0 truncate break-words sm:min-w-[100px] md:min-w-[100px] flex items-center gap-2'>
                                                    {!isDefaultSkill(item.name) ? (
                                                        <button onClick={() => deleteCustomSkill(category, itemIndex)}>
                                                            <Trash2 className='w-6 h-6 text-red-500 hover:text-red-600' />
                                                        </button>
                                                    ) : (
                                                        <ItemIcon className='w-6 h-6 text-primary shrink-0' />
                                                    )}
                                                    {item.name}
                                                </span>
                                                <StarRating
                                                    level={item.level || 0}
                                                    onChange={(level) => updateItemLevel(category, itemIndex, level)}
                                                    onDelete={() => {
                                                        if (
                                                            item.subSkills &&
                                                            item.subSkills.some((s) => s.level && s.level > 0)
                                                        ) {
                                                            setConfirmDelete({ categoryIdx, itemIndex });
                                                        } else {
                                                            const updated = [...data];
                                                            const skills = [...updated[categoryIdx].skills];
                                                            const skill = { ...skills[itemIndex], level: 0 };
                                                            if (skill.subSkills) {
                                                                skill.subSkills = skill.subSkills.map((s) => ({
                                                                    ...s,
                                                                    level: 0,
                                                                }));
                                                            }
                                                            skills[itemIndex] = skill;
                                                            updated[categoryIdx] = { ...updated[categoryIdx], skills };
                                                            setData(updated);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            {(item.level ?? 0) > 0 && (
                                                <div className='mt-3 space-y-2'>
                                                    <div className='flex items-center gap-2 '>
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                const key = `${category}-${itemIndex}`;
                                                                setCollapsedSkills((prev) => ({
                                                                    ...prev,
                                                                    [key]: !prev[key],
                                                                }));
                                                            }}
                                                            className='text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors  cursor-pointer'
                                                            aria-label={
                                                                collapsedSkills[`${category}-${itemIndex}`]
                                                                    ? 'Expand sub-skills'
                                                                    : 'Collapse sub-skills'
                                                            }
                                                        >
                                                            {collapsedSkills[`${category}-${itemIndex}`] ? (
                                                                <ChevronDown className='w-4 h-4' />
                                                            ) : (
                                                                <ChevronUp className='w-4 h-4' />
                                                            )}

                                                            <label className='text-sm font-medium  cursor-pointer'>
                                                                Sub-Skills
                                                            </label>
                                                        </button>
                                                    </div>
                                                    <div
                                                        className={`transition-all duration-250 overflow-hidden ${collapsedSkills[`${category}-${itemIndex}`] ? 'max-h-0 opacity-0 pointer-events-none' : 'opacity-100'}`}
                                                        style={{ willChange: 'max-height, opacity' }}
                                                    >
                                                        <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
                                                            {item.subSkills &&
                                                                item.subSkills.map((sub, subIndex) => {
                                                                    const SubIcon =
                                                                        getIconToSkill(sub.name) ||
                                                                        getIconToSkill(item.name) ||
                                                                        GoDot;
                                                                    return (
                                                                        <div
                                                                            key={subIndex}
                                                                            className='flex flex-row justify-between items-center border rounded px-3 py-2 bg-secondary text-secondary-foreground sm:gap-4'
                                                                        >
                                                                            <div className='font-medium flex items-center gap-2'>
                                                                                {!isDefaultSkill(sub.name) ? (
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            deleteCustomSubSkill(
                                                                                                category,
                                                                                                itemIndex,
                                                                                                subIndex,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className='w-4 h-4 text-red-500 hover:text-red-600' />
                                                                                    </button>
                                                                                ) : (
                                                                                    <SubIcon className='w-5 h-5 text-primary shrink-0' />
                                                                                )}
                                                                                {sub.name}
                                                                            </div>
                                                                            <StarRating
                                                                                level={sub.level || 0}
                                                                                onChange={(level) =>
                                                                                    updateSubSkillLevel(
                                                                                        category,
                                                                                        itemIndex,
                                                                                        subIndex,
                                                                                        level,
                                                                                    )
                                                                                }
                                                                                onDelete={() => {
                                                                                    updateSubSkillLevel(
                                                                                        category,
                                                                                        itemIndex,
                                                                                        subIndex,
                                                                                        0,
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                        <div className='flex gap-2 mt-2'>
                                                            <Input
                                                                type='text'
                                                                placeholder='Add a sub-skill'
                                                                value={newSubSkill[category]?.[itemIndex] || ''}
                                                                onChange={(e) =>
                                                                    setNewSubSkill((prev) => ({
                                                                        ...prev,
                                                                        [category]: {
                                                                            ...(prev[category] || {}),
                                                                            [itemIndex]: e.target.value,
                                                                        },
                                                                    }))
                                                                }
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') {
                                                                        addSubSkillToItem(
                                                                            category,
                                                                            itemIndex,
                                                                            newSubSkill[category]?.[itemIndex] || '',
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <Button
                                                                onClick={() =>
                                                                    addSubSkillToItem(
                                                                        category,
                                                                        itemIndex,
                                                                        newSubSkill[category]?.[itemIndex] || '',
                                                                    )
                                                                }
                                                            >
                                                                <Plus className='w-4 h-4' />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className='flex gap-2'>
                                <Input
                                    type='text'
                                    placeholder={`Add to ${category}`}
                                    value={newItem[category] || ''}
                                    onChange={(e) => setNewItem((prev) => ({ ...prev, [category]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && addItemToCategory(category)}
                                />
                                <Button onClick={() => addItemToCategory(category)}>
                                    <Plus className='w-4 h-4 cursor-pointer' />
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
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
