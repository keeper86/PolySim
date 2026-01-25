'use client';

import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

export type ActivityInTable = {
    id: string;
    label: string;
    started_at: Date;
    ended_at: Date;
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
        cell: ({ getValue }) => new Date(getValue() as Date).toLocaleString(),
    },
    {
        accessorKey: 'ended_at',
        header: 'Ended At',
        cell: ({ getValue }) => new Date(getValue() as Date).toLocaleString(),
    },
];

export default function QueryPage() {
    const { data } = useTRPC().getActivities.useQuery({ limit: 100, offset: 0 });
    const activities = data?.activities || [];

    return (
        <Page title='Query Page'>
            <DataTable columns={columns} data={activities}></DataTable>
        </Page>
    );
}
