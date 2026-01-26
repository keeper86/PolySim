'use client';

import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import type { ActivitySchema } from '@/server/controller/uploadActivity';

const columns: ColumnDef<ActivitySchema>[] = [
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
    {
        accessorKey: 'id',
        header: 'ID',
    },
];

export default function QueryPage() {
    const trpc = useTRPC();
    const { data } = useQuery(trpc.getActivities.queryOptions({ limit: 100, offset: 0 }));
    const activities = data?.activities || [];

    return (
        <Page title='Query Page'>
            <h2>Activities Table</h2>
            <DataTable columns={columns} data={activities}></DataTable>
        </Page>
    );
}
