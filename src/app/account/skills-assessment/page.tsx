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
import { Loader, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import type { SkillAssessment, SkillsAssessmentSchema } from '@/server/endpoints/skills-assessment';
import { getDefaultSkillsAssessment } from './getDefaultAssessmentList';

export default function SkillsAssessmentPage() {
    function handleDeleteItem(category: string, itemIndex: number) {
        const item = data[category]?.[itemIndex];
        if (!item) {
            return;
        }
        if (item.subSkills && item.subSkills.some((s) => s.level > 0)) {
            setConfirmDelete({ category, itemIndex });
        } else {
            actuallyDeleteItem(category, itemIndex);
        }
    }
    const [confirmDelete, setConfirmDelete] = useState<{
        category: string;
        itemIndex: number;
    } | null>(null);

    const setSkillToNoExperience = (skill: SkillAssessment) => {
        skill.level = 0;
        if (skill.subSkills) {
            skill.subSkills.forEach((sub) => (sub.level = 0));
        }
    };

    function actuallyDeleteItem(category: string, index: number) {
        setData((prev) => {
            const newData = { ...prev };
            if (!newData[category] || !newData[category][index]) {
                return newData;
            }
            setSkillToNoExperience(newData[category][index]);
            return newData;
        });
        setConfirmDelete(null);
    }

    function handleConfirmDelete(_deleteSubSkills: boolean) {
        if (!confirmDelete) {
            return;
        }
        const { category, itemIndex } = confirmDelete;
        actuallyDeleteItem(category, itemIndex);
    }

    const StarDisplay = ({ level, max = 3 }: { level: number; max?: number }) => (
        <div className='flex items-center gap-1'>
            {Array.from({ length: max }).map((_, i) => (
                <Star
                    key={i}
                    className={`w-6 h-6 ${
                        i < level
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                    }`}
                />
            ))}
        </div>
    );
    const defaultOrder = Object.keys(getDefaultSkillsAssessment());

    const [data, setData] = useState<SkillsAssessmentSchema>({});
    const [loading, setLoading] = useState(true);
    const [newItem, setNewItem] = useState<Record<string, string>>({});
    const [newSubSkill, setNewSubSkill] = useState<Record<string, Record<number, string>>>({});
    const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const savingRef = useRef(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await trpcClient['skills-assessment-get'].query();
            if (!result || Object.keys(result).length === 0) {
                console.log('No existing skills assessment found, loading default');
                const def = getDefaultSkillsAssessment();
                setData(def);
            } else {
                console.log('Loaded existing skills assessment:', result);
                setData(result);
            }
        } catch (error) {
            toast.error('Failed to load skills assessment', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    useEffect(() => {
        if (loading) {
            return;
        }

        const saveData = async () => {
            if (savingRef.current) {
                console.log('Save already in progress, skipping');

                return;
            }

            savingRef.current = true;
            try {
                console.log('Auto-saving skills assessment...', data);

                await trpcClient['skills-assessment-save'].mutate(data);
            } catch (error) {
                toast.error('Failed to save skills assessment', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            } finally {
                savingRef.current = false;
            }
        };

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        console.log('Scheduling auto-save in 1 second...');

        saveTimeoutRef.current = setTimeout(() => {
            void saveData();
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [data, loading]);

    const addItemToCategory = (category: string) => {
        const value = newItem[category]?.trim();
        if (!value) {
            return;
        }
        if (data[category]?.some((item) => item.name.toLowerCase() === value.toLowerCase())) {
            toast.error('This entry already exists');
            return;
        }
        setData({
            ...data,
            [category]: [...(data[category] || []), { name: value, level: 0, subSkills: [] }],
        });
        setNewItem((prev) => ({ ...prev, [category]: '' }));
    };

    const updateItemLevel = (category: string, index: number, level: number) => {
        const updated = [...(data[category] || [])];
        updated[index].level = level;
        setData({ ...data, [category]: updated });
    };

    const addSubSkillToItem = (category: string, itemIndex: number, subSkillName: string) => {
        if (!subSkillName.trim()) {
            return;
        }
        const updated = [...(data[category] || [])];
        if (!updated[itemIndex].subSkills) {
            updated[itemIndex].subSkills = [];
        }
        if (updated[itemIndex].subSkills.some((s) => s.name.toLowerCase() === subSkillName.toLowerCase())) {
            toast.error('This sub-skill already exists');
            return;
        }
        updated[itemIndex].subSkills = [...updated[itemIndex].subSkills, { name: subSkillName, level: 0 }];
        setData({ ...data, [category]: updated });
        setNewSubSkill((prev) => ({
            ...prev,
            [category]: { ...prev[category], [itemIndex]: '' },
        }));
    };

    const updateSubSkillLevel = (category: string, itemIndex: number, subSkillIndex: number, level: number) => {
        const updated = [...(data[category] || [])];
        if (!updated[itemIndex].subSkills) {
            return;
        }
        updated[itemIndex].subSkills = [...updated[itemIndex].subSkills];
        updated[itemIndex].subSkills[subSkillIndex].level = level;
        setData({ ...data, [category]: updated });
    };

    const StarRating = ({
        level,
        onChange,
        onDelete,
    }: {
        level: number;
        onChange: (level: number) => void;
        onDelete?: () => void;
    }) => {
        return (
            <div className='flex gap-1 items-center'>
                {[1, 2, 3].map((star) => (
                    <button
                        key={star}
                        type='button'
                        onClick={() => onChange(star)}
                        className='focus:outline-none hover:scale-110 transition-transform cursor-pointer'
                        aria-label={`Set level to ${star}`}
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
                <button
                    type='button'
                    onClick={onDelete ? onDelete : () => onChange(0)}
                    disabled={level === 0}
                    className={`ml-2 rounded p-1 border border-muted-foreground/30 transition-colors ${level === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted/70 text-muted-foreground/70'}${level !== 0 ? ' cursor-pointer' : ''}`}
                    aria-label='Reset to no experience'
                >
                    <Trash2 className={`w-4 h-4 ${level !== 0 ? 'text-red-500' : ''}`} />
                </button>
            </div>
        );
    };

    const getLevelLabel = (level: number) => {
        switch (level) {
            case 0:
                return 'No experience';
            case 1:
                return 'Beginner';
            case 2:
                return 'Intermediate';
            case 3:
                return 'Expert';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                {/* FIXME: Create Ticket and add reference here */}
                {/* TODO: Implement skeleton loading state */}
                <Loader className='w-8 h-8 text-muted-foreground animate-spin' style={{ animationDuration: '2s' }} />
            </div>
        );
    }

    return (
        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6' style={{ minWidth: 320 }}>
            <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Entry?</DialogTitle>
                        <DialogDescription>
                            This entry has sub-skills with a non-zero rating. Do you want to delete the sub-skills as
                            well?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex gap-2 justify-end'>
                        <Button variant='outline' onClick={() => setConfirmDelete(null)}>
                            Cancel
                        </Button>
                        <Button variant='destructive' onClick={() => handleConfirmDelete(true)}>
                            Delete with sub-skills
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <div className='flex items-center justify-between'>
                <h1 className='text-3xl font-bold'>Skills Assessment</h1>
            </div>
            <div className='space-y-2'>
                <p className='text-muted-foreground'>
                    Rate your proficiency with programming languages and tools. Changes are saved automatically.
                </p>
                <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 text-sm text-muted-foreground'>
                    <span className='font-medium min-w-[100px]'>Rating Scale:</span>
                    {[0, 1, 2, 3].map((level) => (
                        <div key={level} className='flex flex-col xs:flex-row xs:items-center gap-2'>
                            <span className='px-2 py-1 rounded bg-muted text-muted-foreground text-xs min-w-[90px] text-center'>
                                {getLevelLabel(level)}
                            </span>
                            <StarDisplay level={level} />
                        </div>
                    ))}
                </div>
            </div>

            {defaultOrder.map((category) => {
                const items = data[category];
                if (!items) {
                    return null;
                }
                return (
                    <div className='space-y-4' key={category}>
                        <h2 className='text-2xl font-semibold capitalize'>{category.replace(/([A-Z])/g, ' $1')}</h2>
                        <div className='space-y-3'>
                            {items.map((item, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className='flex flex-col border rounded px-3 py-2 text-secondary-foreground'
                                >
                                    <div className='flex flex-row justify-between items-center gap-4'>
                                        <span className='font-medium min-w-0 truncate break-words sm:min-w-[100px] md:min-w-[100px]'>
                                            {item.name}
                                        </span>
                                        <StarRating
                                            level={item.level}
                                            onChange={(level) => updateItemLevel(category, itemIndex, level)}
                                            onDelete={() => handleDeleteItem(category, itemIndex)}
                                        />
                                    </div>
                                    {item.level > 0 && (
                                        <div className='mt-3 space-y-2'>
                                            <label className='text-sm font-medium'>Sub-Skills:</label>
                                            <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
                                                {item.subSkills &&
                                                    item.subSkills.map((sub, subIndex) => (
                                                        <div
                                                            key={subIndex}
                                                            className='flex flex-row justify-between items-center border rounded px-3 py-2 bg-secondary text-secondary-foreground sm:gap-4'
                                                        >
                                                            <div className='font-medium'>{sub.name}</div>
                                                            <StarRating
                                                                level={sub.level}
                                                                onChange={(level) =>
                                                                    updateSubSkillLevel(
                                                                        category,
                                                                        itemIndex,
                                                                        subIndex,
                                                                        level,
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    ))}
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
                                    )}
                                </div>
                            ))}
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
                );
            })}
        </div>
    );
}
