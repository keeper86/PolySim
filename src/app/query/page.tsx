'use client';

import { Page } from '@/components/client/Page';
import { useTRPC } from '@/lib/trpc';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';

export type AgentInTable = {
    label: string;
};

const columns: ColumnDef<AgentInTable>[] = [
    {
        accessorKey: 'label',
        header: 'Label',
    },
];

export default function QueryPage() {
    const TRPC = useTRPC;
    return (
        <Page title='Query Page'>
            <DataTable columns={columns} data={[]}></DataTable>
        </Page>
    );
}
