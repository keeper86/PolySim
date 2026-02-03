import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UploadPage from './page';

const mockUpload = vi.fn();

vi.mock('@/lib/trpc', () => ({
    useTRPC: vi.fn(() => ({
        uploadActivity: {
            mutationOptions: vi.fn(() => ({ mutationFn: mockUpload })),
        },
    })),
}));

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const original = (await importOriginal()) as typeof import('@tanstack/react-query');
    return {
        ...original,
        useMutation: vi.fn((options) => ({
            mutateAsync: options?.mutationFn || vi.fn(),
            isPending: false,
        })),
    };
});

vi.mock('next-auth/react', () => ({
    useSession: vi.fn(() => ({ status: 'authenticated', data: { user: { id: 'test-user' } } })),
}));

describe('UploadPage', () => {
    it('renders the page title and drop area', () => {
        render(<UploadPage />);

        expect(screen.getByRole('heading', { name: /Upload Provenance Data/i })).toBeInTheDocument();
        expect(screen.getByText(/Drop your PROV JSON here/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Choose File/i })).toBeInTheDocument();
    });

    it('accepts a JSON file, previews it and calls upload', async () => {
        render(<UploadPage />);

        const payload = {
            entities: [
                { id: 'e1', role: 'output', label: 'out', metadata: {} },
                { id: 'p1', role: 'process', label: 'proc', metadata: {} },
            ],
            activity: { id: 'a1', startedAt: Date.now(), endedAt: Date.now() + 1000 },
        };

        const file = new File([JSON.stringify(payload)], 'prov.json', { type: 'application/json' });

        const input = document.querySelector('input[type=file]') as HTMLInputElement;
        expect(input).toBeTruthy();

        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText(/Upload PROV JSON/i)).toBeInTheDocument());

        expect(screen.getByText(/"entities"/i)).toBeInTheDocument();

        const uploadButton = screen.getByRole('button', { name: /Upload PROV JSON/i });
        fireEvent.click(uploadButton);

        await waitFor(() => {
            expect(mockUpload).toHaveBeenCalledWith(payload);
        });
    });

    it('shows validation error for non-JSON file types', async () => {
        render(<UploadPage />);

        const file = new File(['plain text'], 'notes.txt', { type: 'text/plain' });
        const input = document.querySelector('input[type=file]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText(/Please upload a JSON/i)).toBeInTheDocument());
    });

    it('shows error for invalid JSON content', async () => {
        render(<UploadPage />);

        const file = new File(['not a json'], 'prov.json', { type: 'application/json' });
        const input = document.querySelector('input[type=file]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText(/Invalid JSON file/i)).toBeInTheDocument());
    });

    it('displays server error when upload fails', async () => {
        mockUpload.mockReset();
        mockUpload.mockRejectedValue(new Error('Server upload failed'));

        render(<UploadPage />);

        const payload = {
            entities: [
                { id: 'e1', role: 'output', label: 'out', metadata: {} },
                { id: 'p1', role: 'process', label: 'proc', metadata: {} },
            ],
            activity: { id: 'a1', startedAt: Date.now(), endedAt: Date.now() + 1000 },
        };

        const file = new File([JSON.stringify(payload)], 'prov.json', { type: 'application/json' });
        const input = document.querySelector('input[type=file]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => expect(screen.getByText(/Upload PROV JSON/i)).toBeInTheDocument());

        const uploadButton = screen.getByRole('button', { name: /Upload PROV JSON/i });
        fireEvent.click(uploadButton);

        await waitFor(() => expect(screen.getByText(/Server upload failed/i)).toBeInTheDocument());
    });
});
