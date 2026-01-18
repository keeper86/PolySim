'use client';

import React from 'react';
import { Page } from '@/components/client/Page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogClose,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTRPC, useTRPCClient } from '@/lib/trpc';
import { TRPCError } from '@trpc/server';
import { Badge } from '@/components/ui/badge';

type PatToken = {
    id: string;
    name?: string | null;
    created_at: string;
    expires_at?: string | null;
};

const isExpired = (token: PatToken): boolean => {
    return !!(token.expires_at && new Date(token.expires_at) <= new Date());
};
export default function PatPage() {
    const trpc = useTRPC();
    const trpcClient = useTRPCClient();

    const [creating, setCreating] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [latestTokenValue, setLatestTokenValue] = React.useState<string | null>(null);
    const [expiryDays, setExpiryDays] = React.useState<number>(1);
    const [openTokenDialog, setOpenTokenDialog] = React.useState(false);

    const { data: tokens = [], isLoading, refetch } = useQuery(trpc.listPATs.queryOptions({}));

    async function createToken() {
        if (creating) {
            return;
        }
        setCreating(true);
        setLatestTokenValue(null);

        try {
            const result = await trpcClient.createPAT.mutate({
                name: newName || undefined,
                expiresInDays: expiryDays,
            });
            if (result?.token) {
                setLatestTokenValue(result.token);
                void refetch();
                setOpenTokenDialog(true);
            }
            setNewName('');
        } finally {
            setCreating(false);
        }
    }

    function copyToClipboard(value: string) {
        void navigator.clipboard?.writeText(value).then(() => toast.success('Token copied to clipboard'));
    }

    return (
        <Page title='Personal Access Tokens'>
            <section className='mb-6'>
                <label htmlFor='patNameInput' className='block mb-2 text-sm font-medium'>
                    Token name (optional)
                </label>
                <div className='flex gap-2 items-center'>
                    <Input
                        id='patNameInput'
                        value={newName}
                        onChange={(e) => setNewName((e.target as HTMLInputElement).value)}
                    />
                    <select
                        value={String(expiryDays)}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpiryDays(Number(e.target.value))}
                        className='w-40 rounded border px-2 py-1 bg-white'
                    >
                        <option value='0.0007'>1 minute</option>
                        <option value='1'>1 day</option>
                        <option value='7'>1 week</option>
                        <option value='30'>1 month</option>
                        <option value='365'>1 year</option>
                    </select>
                    <Button onClick={createToken} disabled={creating}>
                        {creating ? 'Generating…' : 'Generate token'}
                    </Button>
                </div>

                {/* Token dialog */}
                <Dialog open={openTokenDialog} onOpenChange={setOpenTokenDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Personal Access Token</DialogTitle>
                        </DialogHeader>
                        <DialogDescription>Copy this token now — it will not be shown again.</DialogDescription>
                        <div className='mt-2'>
                            <textarea
                                value={latestTokenValue ?? ''}
                                readOnly
                                rows={3}
                                onFocus={(e) => (e.currentTarget as HTMLTextAreaElement).select()}
                                aria-label='Generated personal access token'
                                className='font-mono w-full resize-none break-all rounded border px-3 py-2 bg-white'
                            />
                        </div>
                        <DialogFooter>
                            <div className='flex gap-2 w-full justify-end'>
                                <Button
                                    variant='outline'
                                    onClick={() => latestTokenValue && copyToClipboard(latestTokenValue)}
                                >
                                    Copy
                                </Button>
                                <Button onClick={() => setOpenTokenDialog(false)}>Close</Button>
                            </div>
                        </DialogFooter>
                        <DialogClose />
                    </DialogContent>
                </Dialog>
            </section>

            <section>
                <h2 className='text-xl font-semibold mb-3'>Existing tokens</h2>
                {isLoading ? (
                    <div>Loading…</div>
                ) : tokens.length === 0 ? (
                    <div className='text-sm text-muted-foreground'>No tokens yet.</div>
                ) : (
                    <ul className='space-y-2'>
                        {tokens.map((token: PatToken) => (
                            <li key={token.id} className='flex items-center justify-between rounded border p-3'>
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <div className='font-medium'>{token.name || 'Unnamed token'}</div>
                                        {isExpired(token) ? <Badge variant='destructive'>Expired</Badge> : null}
                                    </div>
                                    <div className='text-xs text-muted-foreground'>
                                        Created {new Date(token.created_at).toLocaleString()}
                                        {token.expires_at ? (
                                            <span>
                                                {' · '}Expires {new Date(token.expires_at).toLocaleString()}
                                            </span>
                                        ) : (
                                            <span>{' · '}Never expires</span>
                                        )}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant={isExpired(token) ? 'ghost' : 'outline'}
                                        disabled={isExpired(token)}
                                        title={isExpired(token) ? 'Already revoked' : 'Revoke token'}
                                        onClick={async () => {
                                            const ok = confirm(
                                                'Revoke this personal access token?\nIt will be immediately invalidated but remain listed.',
                                            );
                                            if (!ok) {
                                                return;
                                            }
                                            await trpcClient.revokePAT.mutate({ id: token.id });
                                            void refetch();
                                        }}
                                    >
                                        Revoke
                                    </Button>
                                    <Button
                                        variant='destructive'
                                        onClick={async () => {
                                            const ok = confirm(
                                                'Delete this personal access token? This cannot be undone.',
                                            );
                                            if (!ok) {
                                                return;
                                            }
                                            await trpcClient.deletePAT.mutate({ id: token.id });
                                            void refetch();
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </Page>
    );
}
