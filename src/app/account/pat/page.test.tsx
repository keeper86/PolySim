import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PatToken } from 'src/server/controller/pAccessToken.ts';
import { describe, expect, it, vi } from 'vitest';
import PatPage from './page';

const mockRefetch = vi.fn();
const mockListPATs = vi.fn((): PatToken[] => []);
const mockCreatePAT = vi.fn();
const mockRevokePAT = vi.fn();
const mockDeletePAT = vi.fn();

vi.mock('@/lib/trpc', () => ({
    useTRPC: vi.fn(() => ({
        listPATs: {
            queryOptions: vi.fn(() => ({ queryKey: ['pats'], queryFn: mockListPATs })),
        },
        createPAT: {
            mutationOptions: vi.fn(() => ({ mutationFn: mockCreatePAT })),
        },
        revokePAT: {
            mutationOptions: vi.fn(() => ({ mutationFn: mockRevokePAT })),
        },
        deletePAT: {
            mutationOptions: vi.fn(() => ({ mutationFn: mockDeletePAT })),
        },
    })),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const original = (await importOriginal()) as typeof import('@tanstack/react-query');
    return {
        ...original,
        useQuery: vi.fn(() => ({
            data: mockListPATs(),
            isLoading: false,
            refetch: mockRefetch,
        })),
        useMutation: vi.fn((options) => ({
            mutateAsync: options?.mutationFn || vi.fn(),
            isPending: false,
        })),
    };
});

const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);

const mockWriteText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: mockWriteText,
    },
    writable: true,
});

const mockToast = vi.fn();
vi.mock('sonner', async (importOriginal) => {
    const original = (await importOriginal()) as typeof import('sonner');
    return {
        ...original,
        toast: {
            success: (msg: unknown) => mockToast(msg),
        },
    };
});

describe('PatPage', () => {
    const existingTokens: PatToken[] = [
        {
            id: 'pat-1',
            name: 'Test Token 1',
            created_at: new Date('2025-01-01T10:00:00Z'),
            expires_at: new Date('2025-01-08T10:00:00Z'),
        },
        {
            id: 'pat-2',
            name: 'API Key',
            created_at: new Date('2025-02-15T12:00:00Z'),
            expires_at: null, // Never expires
        },
    ];

    it('renders headers, components for tokens: name field, expiry dropdown, Generate Token button', () => {
        mockListPATs.mockReturnValue([]);
        render(<PatPage />);

        expect(screen.getByRole('heading', { name: /Personal Access Tokens/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Token name \(optional\)/i)).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument(); // The expiry dropdown
        expect(screen.getByRole('button', { name: /Generate token/i })).toBeInTheDocument();

        expect(screen.getByRole('heading', { name: /Existing tokens/i })).toBeInTheDocument();
        expect(screen.getByText(/No tokens yet/i)).toBeInTheDocument();
    });

    it('renders all the components of an existing token: token Name, Created Date and time, Expires date and time', () => {
        mockListPATs.mockReturnValue(existingTokens);
        render(<PatPage />);

        const createDate = new Date(existingTokens[0].created_at).toLocaleString();
        const expireDate = new Date(existingTokens[0].expires_at ?? '').toLocaleString();

        const token1 = screen.getByText('Test Token 1').closest('li');
        expect(token1).toHaveTextContent(new RegExp(`Created ${createDate}`, 'i'));
        expect(token1).toHaveTextContent(new RegExp(`Expires ${expireDate}`, 'i'));
        expect(screen.getAllByRole('button', { name: /Delete/i }).length).toBe(2);

        const token2 = screen.getByText('API Key').closest('li');
        expect(token2).toHaveTextContent(/Never expires/i);
    });

    it('presses the create pat button and listens for the copy Pat dialog and for the backend call createPat', async () => {
        const NEW_TOKEN_VALUE = 'pat_newly_generated_secret_value';
        mockCreatePAT.mockResolvedValue({ token: NEW_TOKEN_VALUE });

        mockListPATs.mockReturnValue([]);
        render(<PatPage />);

        const nameInput = screen.getByLabelText(/Token name \(optional\)/i);
        fireEvent.change(nameInput, { target: { value: 'My New PAT' } });

        const expiryDropdown = screen.getByRole('combobox');
        fireEvent.change(expiryDropdown, { target: { value: '30' } });

        const generateButton = screen.getByRole('button', { name: /Generate token/i });
        fireEvent.click(generateButton);

        await waitFor(() => {
            expect(mockCreatePAT).toHaveBeenCalledWith({
                name: 'My New PAT',
                expiresInDays: 30,
            });
        });

        const dialog = screen.getByRole('dialog', { name: /Personal Access Token/i });
        expect(dialog).toBeInTheDocument();
        expect(screen.getByLabelText('Generated personal access token')).toHaveValue(NEW_TOKEN_VALUE);

        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('presses the Copy button in the dialog and verifies the token is copied', async () => {
        const NEW_TOKEN_VALUE = 'pat_to_copy_123';
        mockCreatePAT.mockResolvedValue({ token: NEW_TOKEN_VALUE });
        mockListPATs.mockReturnValue([]);
        render(<PatPage />);
        fireEvent.click(screen.getByRole('button', { name: /Generate token/i }));
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

        const copyButton = screen.getByRole('button', { name: /Copy/i });
        expect(copyButton).toBeVisible();
        fireEvent.click(copyButton);

        expect(mockWriteText).toHaveBeenCalledWith(NEW_TOKEN_VALUE);

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith('Token copied to clipboard');
        });
    });

    it('presses the delete pat button listens for the confirmation popup', () => {
        mockListPATs.mockReturnValue(existingTokens);
        render(<PatPage />);

        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);

        expect(mockConfirm).toHaveBeenCalledWith('Delete this personal access token? This cannot be undone.');
    });

    it('renders the delete pat confirmation popup and presses the OK button. It listens for the delete pat backend call. It expects the list to refetch', async () => {
        mockListPATs.mockReturnValue(existingTokens);
        mockConfirm.mockReturnValue(true);

        render(<PatPage />);

        const [_, deleteButton] = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(mockDeletePAT).toHaveBeenCalledWith({ id: 'pat-2' });
        });

        expect(mockRefetch).toHaveBeenCalled();
    });

    it('renders the delete pat confirmation popup and presses the cancel button. It expects the backend call to be skipped.', async () => {
        mockListPATs.mockReturnValue(existingTokens);
        mockConfirm.mockReturnValue(false);

        render(<PatPage />);

        mockRevokePAT.mockClear();
        mockRefetch.mockClear();

        const [cancelButton] = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(cancelButton);

        await waitFor(() => {
            expect(mockRevokePAT).not.toHaveBeenCalled();
            expect(mockRefetch).not.toHaveBeenCalled();
        });
    });
});
