'use client';

import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

export type ActivityInTable = {
    id: string;
    label: string;
    started_at: string;
    ended_at: string;
    metadata: Record<string, unknown> | null;
};

const columns: ColumnDef<ActivityInTable>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
    },
    {
        accessorKey: 'label',
        header: 'Label',
    },
    {
        accessorKey: 'started_at',
        header: 'Started At',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
        accessorKey: 'ended_at',
        header: 'Ended At',
        cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
];

export default function QueryPage() {
    const trpc = useTRPC();
    const { data } = useQuery(trpc.getActivities.queryOptions({ limit: 100, offset: 0 }));
    const activities = data?.activities || [];

    return (
        <Page title='Query Page'>
            <DataTable columns={columns} data={activities}></DataTable>
        </Page>
    );
}
