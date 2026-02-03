'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import PublishedAssessmentDialog from './components/PublishedAssessmentDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader } from 'lucide-react';
import { useTRPC } from '@/lib/trpc';
import type { UserSummary } from '@/server/controller/user';
import { Page } from '@/components/client/Page';

export default function SkillsListingPage() {
    const trpc = useTRPC();

    const [query, setQuery] = useState('');
    const [selected, setSelected] = useState<UserSummary | null>(null);

    const {
        data = { users: [], total: 0 },
        isLoading,
        refetch,
    } = useQuery(trpc.getUsers.queryOptions({ onlyWithPublishedAssessments: true }));

    return (
        <Page title='Published Skills Assessments'>
            <div className='flex gap-2 mb-4'>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder='Search by name or skill' />
                <Button onClick={() => void refetch()}>Search</Button>
                <Button
                    variant='outline'
                    onClick={() => {
                        setQuery('');
                        void refetch();
                    }}
                >
                    Clear
                </Button>
            </div>
            <div className='md:flex gap-4'>
                <div className='flex-1'>
                    {isLoading ? (
                        <div className='flex items-center justify-center'>
                            <Loader className='w-6 h-6 animate-spin' />
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {data.users.map((user) => (
                                <div key={user.userId} className='p-3 border rounded'>
                                    <div className='flex items-center justify-between'>
                                        <div>
                                            <div className='font-semibold'>{user.displayName || user.userId}</div>
                                            <div className='text-sm text-muted-foreground'>{user.userId}</div>
                                        </div>
                                        <div>
                                            <Button onClick={() => setSelected(user)}>View</Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className='w-full md:w-1/2 mt-4 md:mt-0'>
                    {selected ? (
                        <PublishedAssessmentDialog
                            userId={selected.userId}
                            displayName={selected.displayName}
                            onClose={() => setSelected(null)}
                        />
                    ) : (
                        <div className='text-sm text-muted-foreground'>
                            Select a published assessment to view details.
                        </div>
                    )}
                </div>
            </div>
        </Page>
    );
}
