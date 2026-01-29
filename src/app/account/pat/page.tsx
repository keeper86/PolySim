'use client';

import { Page } from '@/components/client/Page';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTRPC, useTRPCClient } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'sonner';

const isExpired = (token: PatToken2): boolean => {
    return new Date(token.expiresAt) <= new Date();
};

type PatToken2 = Pick<PatToken, 'id' | 'name'> & {
    createdAt: Date;
    expiresAt: Date;
};

export default function PatPage() {
    const trpc = useTRPC();

    const [newName, setNewName] = React.useState('');
    const [latestTokenValue, setLatestTokenValue] = React.useState<string | null>(null);
    const [expiryDays, setExpiryDays] = React.useState<number>(1);
    const [openTokenDialog, setOpenTokenDialog] = React.useState(false);

    const { data = [], isLoading, refetch } = useQuery(trpc.listPATs.queryOptions({}));

    const tokens: PatToken2[] = data.map((token) => ({
        ...token,
        createdAt: new Date(token.createdAt),
        expiresAt: new Date(token.expiresAt),
    }));

    const createPATMutation = useMutation(trpc.createPAT.mutationOptions());
    const revokePATMutation = useMutation(trpc.revokePAT.mutationOptions());
    const deletePATMutation = useMutation(trpc.deletePAT.mutationOptions());

    async function createToken() {
        setLatestTokenValue(null);

        const result = await createPATMutation.mutateAsync({
            name: newName || undefined,
            expiresInDays: expiryDays,
        });
        if (result?.token) {
            setLatestTokenValue(result.token);
            void refetch();
            setOpenTokenDialog(true);
        }
        setNewName('');
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
                <div className='flex flex-wrap sm:flex-nowrap gap-2 items-center'>
                    <Input
                        id='patNameInput'
                        value={newName}
                        onChange={(e) => setNewName((e.target as HTMLInputElement).value)}
                    />
                    <Field>
                        <Select value={String(expiryDays)} onValueChange={(value) => setExpiryDays(Number(value))}>
                            <SelectTrigger className='w-40'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='0.0007'>1 minute</SelectItem>
                                <SelectItem value='1'>1 day</SelectItem>
                                <SelectItem value='7'>1 week</SelectItem>
                                <SelectItem value='30'>1 month</SelectItem>
                                <SelectItem value='365'>1 year</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
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
                        {tokens.map((token: PatToken2) => (
                            <li key={token.id} className='flex items-center justify-between rounded border p-3'>
                                <div>
                                    <div className='flex items-center gap-2'>
                                        <div className='font-medium'>{token.name || 'Unnamed token'}</div>
                                        {isExpired(token) ? <Badge variant='destructive'>Expired</Badge> : null}
                                    </div>
                                    <div className='text-xs text-muted-foreground'>
                                        Created {token.createdAt.toLocaleString()}
                                        {' · '}Expires {token.expiresAt.toLocaleString()}
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Button
                                        variant={isExpired(token) ? 'ghost' : 'outline'}
                                        disabled={isExpired(token) || revokePATMutation.isPending}
                                        title={isExpired(token) ? 'Already revoked' : 'Revoke token'}
                                        onClick={async () => {
                                            const ok = confirm(
                                                'Revoke this personal access token?\nIt will be immediately invalidated but remain listed.',
                                            );
                                            if (!ok) {
                                                return;
                                            }

                                            await revokePATMutation.mutateAsync({ id: token.id });
                                            void refetch();
                                        }}
                                    >
                                        Revoke
                                    </Button>
                                    <Button
                                        variant='destructive'
                                        disabled={deletePATMutation.isPending}
                                        onClick={async () => {
                                            const ok = confirm(
                                                'Delete this personal access token? This cannot be undone.',
                                            );
                                            if (!ok) {
                                                return;
                                            }

                                            await deletePATMutation.mutateAsync({ id: token.id });
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
