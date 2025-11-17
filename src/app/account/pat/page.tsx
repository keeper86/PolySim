'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@/lib/trpc';

type PatToken = {
    id: string;
    name?: string | null;
    created_at: string;
    expires_at?: string | null;
};

export default function PatPage() {
    const trpc = useTRPC();
    const trpcClient = useTRPCClient();

    const [creating, setCreating] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [latestTokenValue, setLatestTokenValue] = React.useState<string | null>(null);

    const { data: tokens = [], isLoading, refetch } = useQuery(trpc.listPATs.queryOptions({}));

    async function createToken() {
        if (creating) {
            return;
        }
        setCreating(true);
        setLatestTokenValue(null);
        try {
            const result = await trpcClient.createPAT.mutate({ name: newName || undefined });
            // server returns the one-time token value
            if (result?.token) {
                setLatestTokenValue(result.token);
                // refresh list to include the newly created token
                void refetch();
            }
            setNewName('');
        } catch (err) {
            console.error(err);
            alert('Could not create token');
        } finally {
            setCreating(false);
        }
    }

    async function deleteToken(id: string) {
        const ok = confirm('Delete this personal access token? This cannot be undone.');
        if (!ok) {
            return;
        }
        try {
            await trpcClient.revokePAT.mutate({ id });
            void refetch();
        } catch (err) {
            console.error(err);
            alert('Could not delete token');
        }
    }

    function copyToClipboard(value: string) {
        void navigator.clipboard?.writeText(value).then(() => alert('Token copied to clipboard'));
    }

    return (
        <div className='max-w-3xl mx-auto p-4'>
            <h1 className='text-2xl font-bold mb-4'>Personal Access Tokens</h1>

            <section className='mb-6'>
                <label className='block mb-2 text-sm font-medium'>Token name (optional)</label>
                <div className='flex gap-2'>
                    <Input value={newName} onChange={(e) => setNewName((e.target as HTMLInputElement).value)} />
                    <Button onClick={createToken} disabled={creating}>
                        {creating ? 'Generating…' : 'Generate token'}
                    </Button>
                </div>
                {latestTokenValue && (
                    <div className='mt-3 rounded border p-3 bg-muted'>
                        <div className='mb-2 font-medium'>Copy this token now — it will not be shown again</div>
                        <div className='flex items-center gap-2'>
                            <code className='truncate break-all bg-transparent'>{latestTokenValue}</code>
                            <Button variant='outline' onClick={() => copyToClipboard(latestTokenValue)}>
                                Copy
                            </Button>
                        </div>
                    </div>
                )}
            </section>

            <section>
                <h2 className='text-xl font-semibold mb-3'>Existing tokens</h2>
                {isLoading ? (
                    <div>Loading…</div>
                ) : tokens.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>No tokens yet.</div>
                ) : (
                    <ul className='space-y-2'>
                        {tokens.map((t: PatToken) => (
                            <li key={t.id} className='flex items-center justify-between rounded border p-3'>
                                <div>
                                    <div className='font-medium'>{t.name || 'Unnamed token'}</div>
                                    <div className='text-xs text-muted-foreground'>
                                        Created {new Date(t.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button variant='ghost' onClick={() => void refetch()} title='Refresh'>
                                        Refresh
                                    </Button>
                                    <Button variant='destructive' onClick={() => deleteToken(t.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { useTRPC, useTRPCClient } from '@/lib/trpc';

type PatToken = {
    id: string;
    name?: string | null;
    created_at: string; 
    expires_at?: string | null;
};

export default function PatPage() {
    const trpc = useTRPC();
    const trpcClient = useTRPCClient();

    const [creating, setCreating] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [latestTokenValue, setLatestTokenValue] = React.useState<string | null>(null);

    const { data: tokens = [], isLoading, refetch } = useQuery(trpc.listPATs.queryOptions({}));

    async function createToken() {
        if (creating) {
            return;
        }
        setCreating(true);
        setLatestTokenValue(null);
        try {
            const result = await trpcClient.createPAT.mutate({ name: newName || undefined });
            // server returns the one-time token value
            if (result?.token) {
                setLatestTokenValue(result.token);
                // refresh list to include the newly created token
                void refetch();
            }
            setNewName('');
        } catch (err) {
            console.error(err);
            alert('Could not create token');
        } finally {
            setCreating(false);
        }
    }

    async function deleteToken(id: string) {
        const ok = confirm('Delete this personal access token? This cannot be undone.');
        if (!ok) {
            return;
        }
        try {
            await trpcClient.revokePAT.mutate({ id });
            void refetch();
        } catch (err) {
            console.error(err);
            alert('Could not delete token');
        }
    }

    function copyToClipboard(value: string) {
        void navigator.clipboard?.writeText(value).then(() => alert('Token copied to clipboard'));
    }

    return (
        <div className='max-w-3xl mx-auto p-4'>
            <h1 className='text-2xl font-bold mb-4'>Personal Access Tokens</h1>

            <section className='mb-6'>
                <label className='block mb-2 text-sm font-medium'>Token name (optional)</label>
                <div className='flex gap-2'>
                    <Input value={newName} onChange={(e) => setNewName((e.target as HTMLInputElement).value)} />
                    <Button onClick={createToken} disabled={creating}>
                        {creating ? 'Generating…' : 'Generate token'}
                    </Button>
                </div>
                {latestTokenValue && (
                    <div className='mt-3 rounded border p-3 bg-muted'>
                        <div className='mb-2 font-medium'>Copy this token now — it will not be shown again</div>
                        <div className='flex items-center gap-2'>
                            <code className='truncate break-all bg-transparent'>{latestTokenValue}</code>
                            <Button variant='outline' onClick={() => copyToClipboard(latestTokenValue)}>
                                Copy
                            </Button>
                        </div>
                    </div>
                )}
            </section>

            <section>
                <h2 className='text-xl font-semibold mb-3'>Existing tokens</h2>
                {isLoading ? (
                    <div>Loading…</div>
                ) : tokens.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>No tokens yet.</div>
                ) : (
                    <ul className='space-y-2'>
                        {tokens.map((t: PatToken) => (
                            <li key={t.id} className='flex items-center justify-between rounded border p-3'>
                                <div>
                                    <div className='font-medium'>{t.name || 'Unnamed token'}</div>
                                    <div className='text-xs text-muted-foreground'>
                                        Created {new Date(t.created_at).toLocaleString()}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button variant='ghost' onClick={() => void refetch()} title='Refresh'>
                                        Refresh
                                    </Button>
                                    <Button variant='destructive' onClick={() => deleteToken(t.id)}>
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
