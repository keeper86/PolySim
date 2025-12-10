import { describe, it, expect, vi } from 'vitest';
import PatPage from './page';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockRefetch = vi.fn();
const mockListPATs = vi.fn(() => []); // Default mock: no tokens
const mockCreatePAT = vi.fn();
const mockRevokePAT = vi.fn();

vi.mock('@/lib/trpc', () => ({
    useTRPC: vi.fn(() => ({
        listPATs: {
            queryOptions: vi.fn(() => ({ queryKey: ['pats'], queryFn: mockListPATs })),
        },
    })),
    useTRPCClient: vi.fn(() => ({
        createPAT: {
            mutate: mockCreatePAT,
        },
        revokePAT: {
            mutate: mockRevokePAT,
        },
    })),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const original = await importOriginal();
    return {
        ...original, // Mimic the queryOptions structure used in the component

        useQuery: vi.fn(() => ({
            data: mockListPATs(), // Use the mocked function to supply initial data
            isLoading: false,
            refetch: mockRefetch,
        })),
    };
});

const mockConfirm = vi.fn();
global.confirm = mockConfirm;

// Mock the navigator.clipboard API
const mockWriteText = vi.fn(() => Promise.resolve());
Object.defineProperty(navigator, 'clipboard', {
    value: {
        writeText: mockWriteText,
    },
    writable: true,
});

// Mock the global alert function
const mockAlert = vi.fn();
global.alert = mockAlert;

describe('PatPage', () => {
    // Helper data for existing tokens
    const existingTokens = [
        {
            id: 'pat-1',
            name: 'Test Token 1',
            created_at: new Date('2025-01-01T10:00:00Z').toISOString(),
            expires_at: new Date('2025-01-08T10:00:00Z').toISOString(),
        },
        {
            id: 'pat-2',
            name: 'API Key',
            created_at: new Date('2025-02-15T12:00:00Z').toISOString(),
            expires_at: null, // Never expires
        },
    ];

    it('renders headers, components for tokens: name field, expiry dropdown, Generate Token button', () => {
        // Renders with default mock data (no existing tokens)
        mockListPATs.mockReturnValue([]);
        render(<PatPage />);

        // Assert creation form components
        expect(screen.getByRole('heading', { name: /Personal Access Tokens/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/Token name \(optional\)/i)).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toBeInTheDocument(); // The expiry dropdown
        expect(screen.getByRole('button', { name: /Generate token/i })).toBeInTheDocument();

        // Assert existing tokens section (empty state)
        expect(screen.getByRole('heading', { name: /Existing tokens/i })).toBeInTheDocument();
        expect(screen.getByText(/No tokens yet/i)).toBeInTheDocument();
    });

    it('renders all the components of an existing token: token Name, Created Date and time, Expires date and time', () => {
        // Set mock data to return existing tokens
        mockListPATs.mockReturnValue(existingTokens);
        render(<PatPage />);

        // Verify the first token with an expiry date
        const token1 = screen.getByText('Test Token 1').closest('li');
        expect(token1).toHaveTextContent(/Created 1\/1\/2025/i); // Date formatting depends on local
        expect(token1).toHaveTextContent(/Expires 1\/8\/2025/i);
        expect(screen.getAllByRole('button', { name: /Delete/i }).length).toBe(2);

        // Verify the second token that never expires
        const token2 = screen.getByText('API Key').closest('li');
        expect(token2).toHaveTextContent(/Never expires/i);
    });

    it('presses the create pat button and listens for the copy Pat dialog and for the backend call createPat', async () => {
        // 1. Setup mock for creation success
        const NEW_TOKEN_VALUE = 'pat_newly_generated_secret_value';
        mockCreatePAT.mockResolvedValue({ token: NEW_TOKEN_VALUE });

        // Reset the dialog state before rendering
        mockListPATs.mockReturnValue([]);
        render(<PatPage />);

        // 2. Fill in inputs
        const nameInput = screen.getByLabelText(/Token name \(optional\)/i);
        fireEvent.change(nameInput, { target: { value: 'My New PAT' } });

        const expiryDropdown = screen.getByRole('combobox');
        fireEvent.change(expiryDropdown, { target: { value: '30' } }); // Select 1 month

        // 3. Click the Generate button
        const generateButton = screen.getByRole('button', { name: /Generate token/i });
        fireEvent.click(generateButton);

        // 4. Assert backend call
        await waitFor(() => {
            expect(mockCreatePAT).toHaveBeenCalledWith({
                name: 'My New PAT',
                expiresInDays: 30,
            });
        });

        // 5. Assert dialog is open and token is displayed
        const dialog = screen.getByRole('dialog', { name: /Personal Access Token/i });
        expect(dialog).toBeInTheDocument();
        expect(screen.getByLabelText('Generated personal access token')).toHaveValue(NEW_TOKEN_VALUE);

        // 6. Assert refetch is called to update the list
        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('presses the Copy button in the dialog and verifies the token is copied', async () => {
        // Ensure the dialog is open and token is visible (reusing setup logic)
        const NEW_TOKEN_VALUE = 'pat_to_copy_123';
        mockCreatePAT.mockResolvedValue({ token: NEW_TOKEN_VALUE });
        mockListPATs.mockReturnValue([]);
        render(<PatPage />);
        fireEvent.click(screen.getByRole('button', { name: /Generate token/i }));
        await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());

        // Click the copy button
        const copyButton = screen.getByRole('button', { name: /Copy/i });
        fireEvent.click(copyButton);

        // Assert clipboard function was called
        expect(mockWriteText).toHaveBeenCalledWith(NEW_TOKEN_VALUE);

        // Assert alert was called
        await waitFor(() => {
            expect(mockAlert).toHaveBeenCalledWith('Token copied to clipboard');
        });
    });

    it('presses the delete pat button listens for the confirmation popup', () => {
        mockListPATs.mockReturnValue(existingTokens);
        render(<PatPage />);

        // We target the delete button for the first token
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);

        // Assert the global confirm function was called with the correct prompt
        expect(mockConfirm).toHaveBeenCalledWith('Delete this personal access token? This cannot be undone.');
    });

    it('renders the delete pat confirmation popup and presses the OK button. It listens for the delete pat backend call. It expects the list to refetch', async () => {
        // 1. Setup mock data and confirm response (OK)
        mockListPATs.mockReturnValue(existingTokens);
        mockConfirm.mockReturnValue(true); // User clicks OK

        render(<PatPage />);

        // 2. Click the Delete button for the second token (ID: 'pat-2')
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[1]); // Assuming index 1 corresponds to 'pat-2'

        // 3. Assert revokePAT backend call
        await waitFor(() => {
            expect(mockRevokePAT).toHaveBeenCalledWith({ id: 'pat-2' });
        });

        // 4. Assert list refetch is called
        expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it('renders the delete pat confirmation popup and presses the cancel button. It expects the backend call to be skipped.', async () => {
        // 1. Setup mock data and confirm response (Cancel)
        mockListPATs.mockReturnValue(existingTokens);
        mockConfirm.mockReturnValue(false); // User clicks Cancel

        render(<PatPage />);

        // Reset the mock before the test to ensure it wasn't called from a previous test
        mockRevokePAT.mockClear();
        mockRefetch.mockClear();

        // 2. Click the Delete button for the first token
        const deleteButtons = screen.getAllByRole('button', { name: /Delete/i });
        fireEvent.click(deleteButtons[0]);

        // 3. Assert backend call is NOT made
        await waitFor(() => {
            expect(mockRevokePAT).not.toHaveBeenCalled();
            expect(mockRefetch).not.toHaveBeenCalled();
        });
    });
});
