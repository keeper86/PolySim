import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DatabaseTester from './DbTester';

vi.mock('next-auth/react');
vi.mock('../../lib/clientTrpc', () => ({
    trpcClient: {
        'test-connection': {
            query: vi.fn(),
        },
        'logs': { mutate: vi.fn() },
    },
}));

import AppProviders from '@/app/QueryClientProvider';
import { trpcClient } from '../../lib/clientTrpc';

const mockUseSession = vi.mocked(useSession);
const mockTrpcQuery = vi.mocked(trpcClient['test-connection'].query);

describe('DatabaseTester Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSession.mockReturnValue({
            data: null,
            status: 'unauthenticated',
            update: vi.fn(),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const renderComponent = () =>
        render(
            <AppProviders>
                <DatabaseTester />
            </AppProviders>,
        );

    it('shows error state when trpc query rejects', async () => {
        mockTrpcQuery.mockRejectedValue(new Error('UNAUTHORIZED: You must be logged in to access this resource'));

        renderComponent();

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        expect(screen.getByText('Testing...')).toBeInTheDocument();
        expect(button).toBeDisabled();

        await waitFor(() => {
            expect(button).not.toBeDisabled();
            expect(screen.getByText('Test Database Connection')).toBeInTheDocument();
        });

        // Check for error label and message separately due to DOM structure
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('UNAUTHORIZED: You must be logged in to access this resource')).toBeInTheDocument();
    });

    it('shows success state when database connection is successful', async () => {
        mockTrpcQuery.mockResolvedValue({
            message: 'Database connection successful',
            time: 150,
            version: 'PostgreSQL 15.0',
        });

        renderComponent();

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.getByText('Database connection successful')).toBeInTheDocument();
    });

    it('shows error state for generic trpc errors', async () => {
        mockTrpcQuery.mockRejectedValue(new Error('Network error'));

        renderComponent();

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('resets loading state even when error occurs', async () => {
        mockTrpcQuery.mockRejectedValue(new Error('Some error'));

        renderComponent();

        const button = screen.getByText('Test Database Connection');

        expect(button).not.toBeDisabled();

        fireEvent.click(button);

        expect(screen.getByText('Testing...')).toBeInTheDocument();
        expect(button).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText('Test Database Connection')).toBeInTheDocument();
            expect(button).not.toBeDisabled();
        });

        expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
    });
});
