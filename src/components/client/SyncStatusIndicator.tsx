'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

type SyncStatus = 'idle' | 'pending' | 'error' | 'success';

interface SyncStatusIndicatorProps {
    status: SyncStatus;
}

/**
 * Displays a sync status indicator in a fixed position (top-right corner).
 *
 * Note: This component uses fixed positioning (fixed right-4 top-4 z-10)
 * and will always appear in the top-right corner of the viewport.
 */
export function SyncStatusIndicator({ status }: SyncStatusIndicatorProps) {
    let icon = <CheckCircle2 className='w-5 h-5 text-green-500' />;

    if (status === 'pending') {
        icon = <Loader2 className='w-5 h-5 text-blue-500 animate-spin' />;
    } else if (status === 'error') {
        icon = <XCircle className='w-5 h-5 text-red-500 animate-pulse' />;
    }

    return <div className='flex items-center fixed right-4 top-4 z-10 h-8 select-none'>{icon}</div>;
}
