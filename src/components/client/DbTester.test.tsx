import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import DatabaseTester from './DbTester';

// Mock dependencies
vi.mock('next-auth/react');
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));
vi.mock('../../app/clientLogger', () => ({
    clientLogger: {
        child: () => ({
            error: vi.fn(),
            info: vi.fn(),
        }),
    },
}));
vi.mock('../../app/clientTrpc', () => ({
    trpc: {
        'test-connection': {
            query: vi.fn(),
        },
    },
}));

import { toast } from 'sonner';
import { trpc } from '../../app/clientTrpc';

const mockUseSession = vi.mocked(useSession);
const mockTrpcQuery = vi.mocked(trpc['test-connection'].query);
const mockToast = vi.mocked(toast);

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

    it('handles UNAUTHORIZED error properly and shows toast', async () => {
        // Mock UNAUTHORIZED error
        mockTrpcQuery.mockRejectedValue(new Error('UNAUTHORIZED: You must be logged in to access this resource'));

        render(<DatabaseTester />);

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        // Check loading state
        expect(screen.getByText('Testing...')).toBeInTheDocument();
        expect(button).toBeDisabled();

        // Wait for error handling
        await waitFor(() => {
            expect(button).not.toBeDisabled();
            expect(screen.getByText('Test Database Connection')).toBeInTheDocument();
        });

        // Check that error toast was called
        expect(mockToast.error).toHaveBeenCalledWith(
            'Authentication required',
            expect.objectContaining({
                description: 'You must be logged in to test the database connection',
            })
        );

        // Check that error state is displayed
        expect(screen.getByText(/Authentication Required/)).toBeInTheDocument();
        expect(screen.getByText('Please log in to access this feature')).toBeInTheDocument();
    });

    it('handles successful database connection and shows success toast', async () => {
        // Mock successful response
        mockTrpcQuery.mockResolvedValue({
            message: 'Database connection successful',
            time: 150,
            version: 'PostgreSQL 15.0',
        });

        render(<DatabaseTester />);

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        // Wait for success handling
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        // Check that success toast was called
        expect(mockToast.success).toHaveBeenCalledWith(
            'Database connection successful',
            expect.objectContaining({
                description: 'Connected in 150ms',
            })
        );

        // Check that success state is displayed
        expect(screen.getByText('Success!')).toBeInTheDocument();
        expect(screen.getByText('Database connection successful')).toBeInTheDocument();
    });

    it('handles database connection failure and shows error toast', async () => {
        // Mock database error response
        mockTrpcQuery.mockResolvedValue({
            error: 'Database connection failed',
            details: 'Connection timeout',
        });

        render(<DatabaseTester />);

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        // Wait for error handling
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        // Check that error toast was called
        expect(mockToast.error).toHaveBeenCalledWith(
            'Database connection failed',
            expect.objectContaining({
                description: 'Connection timeout',
            })
        );

        // Check that error state is displayed
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument();
        expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });

    it('handles generic tRPC errors properly', async () => {
        // Mock generic tRPC error
        mockTrpcQuery.mockRejectedValue(new Error('Network error'));

        render(<DatabaseTester />);

        const button = screen.getByText('Test Database Connection');
        fireEvent.click(button);

        // Wait for error handling
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });

        // Check that error toast was called
        expect(mockToast.error).toHaveBeenCalledWith(
            'Connection test failed',
            expect.objectContaining({
                description: 'Network error',
            })
        );

        // Check that error state is displayed
        expect(screen.getByText(/Request Failed/)).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('resets loading state even when error occurs', async () => {
        // Mock error
        mockTrpcQuery.mockRejectedValue(new Error('Some error'));

        render(<DatabaseTester />);

        const button = screen.getByText('Test Database Connection');

        // Initial state - button should not be disabled
        expect(button).not.toBeDisabled();

        // Click button
        fireEvent.click(button);

        // Should be in loading state
        expect(screen.getByText('Testing...')).toBeInTheDocument();
        expect(button).toBeDisabled();

        // Wait for error to be handled
        await waitFor(() => {
            expect(screen.getByText('Test Database Connection')).toBeInTheDocument();
            expect(button).not.toBeDisabled();
        });

        // Loading state should be reset
        expect(screen.queryByText('Testing...')).not.toBeInTheDocument();
    });
});
