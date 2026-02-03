'use client';

import * as React from 'react';
import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import type { ActivitySchema } from '@/server/controller/uploadActivity';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Field, FieldLabel } from '@/components/ui/field';

const columns: ColumnDef<ActivitySchema>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ getValue }) => <code className='font-mono'>{getValue<string>().slice(0, 8)}</code>,
    },
    {
        accessorKey: 'label',
        header: 'Label',
    },
    {
        accessorKey: 'startedAt',
        header: 'Started At',
        cell: ({ getValue }) => new Date(getValue() as number).toLocaleString(),
    },
    {
        accessorKey: 'endedAt',
        header: 'Ended At',
        cell: ({ getValue }) => new Date(getValue() as number).toLocaleString(),
    },
];

export default function QueryPage() {
    const trpc = useTRPC();

    // Form state
    const [textQuery, setTextQuery] = React.useState('');
    const [entityName, setEntityName] = React.useState('');
    const [fileHash, setFileHash] = React.useState('');
    const [fromLocal, setFromLocal] = React.useState('');
    const [toLocal, setToLocal] = React.useState('');
    const [minWallSec, setMinWallSec] = React.useState<string>('');
    const [maxWallSec, setMaxWallSec] = React.useState<string>('');
    const [limit, setLimit] = React.useState<number>(25);
    const [offset, setOffset] = React.useState<number>(0);
    const [sortBy, setSortBy] = React.useState<'startedAt' | 'endedAt' | 'wallTime' | 'id' | 'label'>('startedAt');
    const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');

    type ActivitiesQueryInput = {
        limit: number;
        offset: number;
        from?: number;
        to?: number;
        minWallTimeMs?: number;
        maxWallTimeMs?: number;
        query?: string;
        fileHash?: string;
        entityName?: string;
        sortBy?: 'startedAt' | 'endedAt' | 'wallTime' | 'id' | 'label';
        sortDir?: 'asc' | 'desc';
    };

    // build input for query (not the live lastInput used by the hook)
    const input = React.useMemo((): ActivitiesQueryInput => {
        const obj: ActivitiesQueryInput = {
            limit,
            offset,
            sortBy,
            sortDir,
        };
        if (textQuery) {
            obj.query = textQuery;
        }
        if (entityName) {
            obj.entityName = entityName;
        }
        if (fileHash) {
            obj.fileHash = fileHash;
        }
        if (fromLocal) {
            obj.from = new Date(fromLocal).getTime();
        }
        if (toLocal) {
            obj.to = new Date(toLocal).getTime();
        }
        if (minWallSec) {
            obj.minWallTimeMs = Math.floor(Number(minWallSec) * 1000);
        }
        if (maxWallSec) {
            obj.maxWallTimeMs = Math.floor(Number(maxWallSec) * 1000);
        }
        return obj;
    }, [textQuery, entityName, fileHash, fromLocal, toLocal, minWallSec, maxWallSec, limit, offset, sortBy, sortDir]);

    const [lastInput, setLastInput] = React.useState<ActivitiesQueryInput>({
        limit,
        offset,
        sortBy,
        sortDir,
    });

    // useQuery with the last committed input; we update lastInput on search to trigger the request
    const query = useQuery(trpc.getActivities.queryOptions(lastInput));

    const activities = query.data?.activities || [];

    const total = query.data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.floor(offset / limit) + 1;

    function handleSort(columnId: string) {
        // toggle or set new sort column
        const newSortBy = columnId as 'startedAt' | 'endedAt' | 'wallTime' | 'id' | 'label';
        const newSortDir = sortBy === newSortBy ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc';
        setSortBy(newSortBy);
        setSortDir(newSortDir);
        setOffset(0);
        setLastInput({ ...input, sortBy: newSortBy, sortDir: newSortDir, offset: 0 });
    }

    function onSearch(e?: React.FormEvent) {
        e?.preventDefault();
        setLastInput(input);
    }

    function onReset() {
        setTextQuery('');
        setEntityName('');
        setFileHash('');
        setFromLocal('');
        setToLocal('');
        setMinWallSec('');
        setMaxWallSec('');
        setLimit(25);
        setOffset(0);
        setSortBy('startedAt');
        setSortDir('desc');
    }

    function handlePageChange(page: number) {
        const newOffset = (page - 1) * limit;
        setOffset(newOffset);
        setLastInput({ ...input, offset: newOffset });
    }

    return (
        <Page title='Query Page'>
            <h2 className='text-2xl font-semibold mb-4'>Search Activities</h2>

            <form onSubmit={onSearch} className='flex gap-4 mb-6'>
                <div className='space-y-2'>
                    <div className='grid grid-cols-2 gap-2 mt-2'>
                        <span>
                            <label className='text-sm font-medium'>Started (from)</label>
                            <Input
                                type='datetime-local'
                                value={fromLocal}
                                onChange={(e) => setFromLocal(e.target.value)}
                            />
                        </span>

                        <span>
                            <label className='text-sm font-medium mt-2'>Started (to)</label>
                            <Input type='datetime-local' value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
                        </span>
                    </div>

                    <div className='grid grid-cols-2 gap-2 mt-2'>
                        <div>
                            <label className='text-sm font-medium'>Min wall (s)</label>
                            <Input value={minWallSec} onChange={(e) => setMinWallSec(e.target.value)} />
                        </div>
                        <div>
                            <label className='text-sm font-medium'>Max wall (s)</label>
                            <Input value={maxWallSec} onChange={(e) => setMaxWallSec(e.target.value)} />
                        </div>
                    </div>

                    <div className='flex gap-2 mt-4'>
                        <Button type='submit' disabled={query.isFetching}>
                            {query.isFetching ? 'Searching…' : 'Search'}
                        </Button>
                        <Button variant='outline' onClick={onReset} type='button'>
                            Reset
                        </Button>
                    </div>
                </div>
            </form>

            <div className='mb-4 flex items-center justify-between'>
                <div className='text-sm text-muted-foreground'>
                    Results: {total} — Showing {activities.length} — Page {currentPage} / {totalPages}
                </div>
                <div className='flex items-center justify-end gap-2'>
                    <Field className='flex flex-row'>
                        <FieldLabel htmlFor='select-rows-per-page'>Rows</FieldLabel>

                        <Select value={String(limit)} onValueChange={(v: string) => setLimit(Number(v))}>
                            <SelectTrigger className='w-auto'>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className='w-auto'>
                                <SelectItem value='10'>10</SelectItem>
                                <SelectItem value='25'>25</SelectItem>
                                <SelectItem value='50'>50</SelectItem>
                                <SelectItem value='100'>100</SelectItem>
                            </SelectContent>
                        </Select>
                    </Field>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={activities}
                onSort={handleSort}
                sortBy={sortBy}
                sortDir={sortDir}
            ></DataTable>

            <Pagination className='mb-4'>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            size='default'
                            onClick={() => handlePageChange(currentPage - 1)}
                            className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                size='default'
                                onClick={() => handlePageChange(page)}
                                isActive={page === currentPage}
                                className='cursor-pointer'
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                            size='default'
                            onClick={() => handlePageChange(currentPage + 1)}
                            className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </Page>
    );
}
