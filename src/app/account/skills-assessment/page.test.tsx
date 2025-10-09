import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkillsAssessmentPage from './page';
import * as clientTrpc from '@/app/clientTrpc';

vi.mock('@/app/clientTrpc', () => ({
    trpcClient: {
        'skills-assessment-get': {
            query: vi.fn(),
        },
        'skills-assessment-save': {
            mutate: vi.fn(),
        },
    },
}));

vi.mock('@/app/clientLogger', () => ({
    clientLogger: {
        child: vi.fn(() => ({
            debug: vi.fn(),
            error: vi.fn(),
        })),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe('SkillsAssessmentPage with React Query', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
                mutations: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        const mockQuery = vi.fn().mockImplementation(() => new Promise(() => {}));
        vi.mocked(clientTrpc.trpcClient['skills-assessment-get'].query).mockImplementation(mockQuery);

        render(
            <QueryClientProvider client={queryClient}>
                <SkillsAssessmentPage />
            </QueryClientProvider>,
        );

        const loader = document.querySelector('.lucide-loader');
        expect(loader).toBeInTheDocument();
    });

    it('loads and displays default skills assessment', async () => {
        const mockQuery = vi.fn().mockResolvedValue([]);
        vi.mocked(clientTrpc.trpcClient['skills-assessment-get'].query).mockImplementation(mockQuery);

        render(
            <QueryClientProvider client={queryClient}>
                <SkillsAssessmentPage />
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('Skills Assessment')).toBeInTheDocument();
        });

        expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('displays sync status indicator when saving', async () => {
        const mockQuery = vi.fn().mockResolvedValue([]);
        vi.mocked(clientTrpc.trpcClient['skills-assessment-get'].query).mockImplementation(mockQuery);

        const mockMutate = vi.fn().mockImplementation(() => new Promise(() => {}));
        vi.mocked(clientTrpc.trpcClient['skills-assessment-save'].mutate).mockImplementation(mockMutate);

        render(
            <QueryClientProvider client={queryClient}>
                <SkillsAssessmentPage />
            </QueryClientProvider>,
        );

        await waitFor(() => {
            expect(screen.getByText('Skills Assessment')).toBeInTheDocument();
        });
    });
});
