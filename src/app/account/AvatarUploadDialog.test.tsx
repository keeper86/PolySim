// noinspection LanguageDetectionInspection

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AvatarUploadDialog } from './AvatarUploadDialog';

// 1. Mock für tRPC
const mockMutate = vi.fn();
vi.mock('@/lib/trpc', () => ({
    useTRPCClient: () => ({
        updateUser: { mutate: mockMutate },
    }),
}));

// 2. Hilfsfunktion für Datei-Erstellung
const createTestFile = (type: string, sizeInBytes: number, name = 'test.png'): File => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Für Größentests: Array mit gewünschter Größe füllen
    const content = sizeInBytes > buffer.length ? new Uint8Array(sizeInBytes) : buffer;

    return new File([content], name, { type });
};

vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({
        children,
        open,
        onOpenChange,
    }: {
        children: React.ReactNode;
        open: boolean;
        onOpenChange: (open: boolean) => void;
    }) => (
        <div data-testid='dialog-wrapper' data-open={open} onClick={() => onOpenChange(!open)}>
            {children}
        </div>
    ),
    DialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DialogContent: ({ children }: { children: React.ReactNode }) => <div data-testid='dialog-content'>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
    DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

describe('AvatarUploadDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Block 1: Dialog öffnen/schließen Tests
    describe('Dialog Open/Close', () => {
        it('opens dialog when trigger button is clicked', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            // Dialog-Inhalt sollte initial nicht sichtbar sein
            expect(screen.queryByText('Profile Picture')).not.toBeInTheDocument();

            // Trigger-Button klicken
            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            // Dialog-Inhalt sollte jetzt sichtbar sein
            expect(screen.getByText('Profile Picture')).toBeInTheDocument();
            expect(screen.getByText(/drop your image here/i)).toBeInTheDocument();
        });

        it('closes dialog and resets state when closed', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            // Dialog öffnen
            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);
            expect(screen.getByText('Profile Picture')).toBeInTheDocument();

            // Datei auswählen, um State zu setzen
            const validFile = createTestFile('image/png', 500);
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            await user.upload(fileInput, validFile);

            // Upload-Button sollte angezeigt werden (zeigt previewUrl ist gesetzt)
            expect(screen.getByRole('button', { name: /upload photo/i })).toBeInTheDocument();

            // Dialog schließen (Escape-Taste)
            await user.keyboard('{Escape}');

            // Dialog-Inhalt sollte nicht mehr sichtbar sein
            expect(screen.queryByText('Profile Picture')).not.toBeInTheDocument();

            // Dialog erneut öffnen und prüfen, ob State zurückgesetzt wurde
            await user.click(triggerButton);
            expect(screen.getByText('Profile Picture')).toBeInTheDocument();

            // Preview sollte nicht mehr da sein (State wurde zurückgesetzt)
            expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();
            expect(screen.getByText(/drop your image here/i)).toBeInTheDocument();
        });
    });

    // Block 2: File Validation Tests
    describe('File Validation', () => {
        it('accepts valid PNG file under 1MB', async () => {
            // TODO
        });

        it('rejects non-PNG files with error message', async () => {
            // TODO
        });

        it('rejects files larger than 1MB', async () => {
            // TODO
        });
    });

    // Block 3: Drag & Drop Tests
    describe('Drag and Drop', () => {
        it('shows drag state when file is dragged over', async () => {
            // TODO
        });

        it('handles file drop correctly', async () => {
            // TODO
        });
    });

    // Block 4: Upload Tests
    describe('Upload Functionality', () => {
        it('uploads avatar successfully', async () => {
            // TODO
        });

        it('shows error when upload fails', async () => {
            // TODO
        });
    });

    // Block 5: Remove Tests
    describe('Remove Functionality', () => {
        it('removes avatar successfully', async () => {
            // TODO
        });

        it('shows error when remove fails', async () => {
            // TODO
        });
    });
});
