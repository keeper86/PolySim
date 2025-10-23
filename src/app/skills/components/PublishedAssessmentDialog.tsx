'use client';

import { StarRating } from '@/components/client/StarRating';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';

export default function PublishedAssessmentDialog({
    userId,
    displayName,
    onClose,
}: {
    userId: string;
    displayName?: string | null;
    onClose?: () => void;
}) {
    const trpc = useTRPC();
    const { data: assessment, isLoading } = useQuery(trpc['skills-assessment-get'].queryOptions({ userId }));
    return (
        <div className='p-4 border rounded'>
            <div className='flex items-center justify-between mb-3'>
                <div>
                    <h2 className='text-xl font-semibold'>{displayName || userId}</h2>
                    <div className='text-sm text-muted-foreground'>{userId}</div>
                </div>
                <div>
                    <Button variant='ghost' onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className='flex items-center justify-center py-8'>
                    <Loader className='w-6 h-6 animate-spin' />
                </div>
            ) : assessment ? (
                assessment.map((cat) => (
                    <div key={cat.category} className='mb-4'>
                        <h3 className='font-semibold'>{cat.category}</h3>
                        <div className='mt-2 space-y-2'>
                            {cat.skills.map((s) => (
                                <div key={s.name} className='flex items-center justify-between p-2 border rounded'>
                                    <div>
                                        <div className='font-medium'>{s.name}</div>
                                        {s.subSkills && (
                                            <div className='text-xs text-muted-foreground'>
                                                {s.subSkills.map((ss) => ss.name).join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <StarRating level={s.level ?? 0} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className='text-sm text-muted-foreground'>No assessment data available.</div>
            )}
        </div>
    );
}
