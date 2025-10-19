import { describe, it, vi, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useRealtimeMessages from '@/hooks/useRealtimeMessages';

// Mock trpcClient and supabase
vi.mock('@/app/clientTrpc', () => ({
    trpcClient: {
        'messages-get': {
            query: vi.fn().mockResolvedValue([]),
        },
        'logs': {
            mutate: vi.fn().mockResolvedValue(undefined),
        },
    },
}));

vi.mock('@/lib/supabaseClient', () => ({
    createBrowserSupabase: () => ({
        channel: () => ({
            on: () => ({ subscribe: () => ({}) }),
        }),
    }),
}));

describe('useRealtimeMessages', () => {
    it('loads messages and subscribes', async () => {
        const { result } = renderHook(() => useRealtimeMessages(1));
        await waitFor(() => {
            expect(result.current.messages).toEqual([]);
        });
    });
});
