import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AvatarUploadDialog } from './AvatarUploadDialog';

const mockMutate = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@tanstack/react-query', async (importOriginal) => {
    const original = (await importOriginal()) as typeof import('@tanstack/react-query');
    return {
        ...original,
        useMutation: vi.fn(() => ({
            mutate: mockMutate,
            isPending: false,
            isSuccess: false,
            isError: false,
        })),
        useQueryClient: vi.fn(() => ({
            invalidateQueries: mockInvalidateQueries,
        })),
        useQuery: vi.fn(() => ({
            data: undefined,
            isLoading: false,
            isError: false,
            error: null,
        })),
    };
});

const mockMutationOptions = vi.fn();
const mockQueryKey = vi.fn(() => ['getUser']);
const mockQueryOptions = vi.fn();

vi.mock('@/lib/trpc', () => ({
    useTRPC: vi.fn(() => ({
        updateUser: {
            mutationOptions: mockMutationOptions,
        },
        getUser: {
            queryKey: mockQueryKey,
            queryOptions: mockQueryOptions,
        },
    })),
}));

interface MockFileReaderInstance {
    readAsDataURL: (file: File) => void;
    onloadend: (() => void) | null;
    result: string | null;
}

const createMockFileReader = (): MockFileReaderInstance => ({
    readAsDataURL(this: MockFileReaderInstance, _file: File) {
        const base64 =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
        setTimeout(() => {
            this.result = base64;
            this.onloadend?.();
        }, 0);
    },
    onloadend: null,
    result: null,
});

const originalFileReader = global.FileReader;
Object.defineProperty(global, 'FileReader', {
    writable: true,
    value: vi.fn(() => createMockFileReader()),
});

const createTestFile = (type: string, sizeInBytes: number, name = 'test.png'): File => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
    const buffer = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const content = sizeInBytes > buffer.length ? new Uint8Array(sizeInBytes) : buffer;
    return new File([content], name, { type });
};

describe('AvatarUploadDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMutationOptions.mockReturnValue({
            onSuccess: vi.fn(),
            onError: vi.fn(),
        });
        mockQueryOptions.mockReturnValue({
            queryKey: ['getUser'],
            queryFn: vi.fn(),
        });
    });

    afterAll(() => {
        Object.defineProperty(global, 'FileReader', {
            writable: true,
            value: originalFileReader,
        });
    });

    describe('Dialog Open/Close', () => {
        it('opens dialog when trigger button is clicked', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            expect(triggerButton).toBeInTheDocument();

            await user.click(triggerButton);

            const dialogTitle = screen.getByRole('heading', { name: /profile picture/i });
            expect(dialogTitle).toBeInTheDocument();

            const dialogDescription = screen.getByText(/upload a profile picture to personalize your account/i);
            expect(dialogDescription).toBeInTheDocument();
        });

        it('resets upload state when cancel is clicked', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            expect(fileInput).toBeTruthy();

            const testFile = createTestFile('image/png', 500000);
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const uploadButton = await screen.findByRole('button', { name: /upload photo/i });
            expect(uploadButton).toBeInTheDocument();

            const cancelButton = screen.getByRole('button', { name: /cancel/i });
            await user.click(cancelButton);

            expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();

            const changePhotoButton = screen.getByRole('button', { name: /change photo/i });
            expect(changePhotoButton).toBeInTheDocument();
        });
    });

    describe('File Validation', () => {
        it('accepts valid PNG file under 1MB', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = createTestFile('image/png', 500000);
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const uploadButton = await screen.findByRole('button', { name: /upload photo/i });
            expect(uploadButton).toBeInTheDocument();

            expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        });

        it('rejects non-PNG files with error message', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = createTestFile('image/jpeg', 500000, 'test.jpg');
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const errorAlert = await screen.findByText(/please upload a png image file/i);
            expect(errorAlert).toBeInTheDocument();

            expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();
        });

        it('rejects files larger than 1MB', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = createTestFile('image/png', 2 * 1024 * 1024);
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const errorAlert = await screen.findByText(/file size must be less than 1mb/i);
            expect(errorAlert).toBeInTheDocument();

            expect(screen.queryByRole('button', { name: /upload photo/i })).not.toBeInTheDocument();
        });
    });

    describe('Drag and Drop', () => {
        it('shows drag state when file is dragged over', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const browseButton = screen.getByRole('button', { name: /browse/i });
            const dropZone = browseButton.closest('div')?.parentElement?.parentElement;
            expect(dropZone).toBeInTheDocument();

            const classNameBefore = dropZone?.className || '';
            expect(classNameBefore).toContain('border-muted-foreground/25');
            expect(classNameBefore).not.toContain('border-primary');

            fireEvent.dragOver(dropZone!);

            const classNameDuring = dropZone?.className || '';
            expect(classNameDuring).toContain('border-primary');
            expect(classNameDuring).toContain('bg-primary/5');
            expect(classNameDuring).not.toContain('border-muted-foreground/25');
        });

        it('restores default styling when drag leaves', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const browseButton = screen.getByRole('button', { name: /browse/i });
            const dropZone = browseButton.closest('div')?.parentElement?.parentElement;
            expect(dropZone).toBeInTheDocument();

            fireEvent.dragOver(dropZone!);
            const classNameDuring = dropZone?.className || '';
            expect(classNameDuring).toContain('border-primary');

            fireEvent.dragLeave(dropZone!);

            const classNameAfter = dropZone?.className || '';
            expect(classNameAfter).toContain('border-muted-foreground/25');
            expect(classNameAfter).not.toContain('border-primary');
            expect(classNameAfter).not.toContain('bg-primary/5');
        });

        it('handles file drop correctly', async () => {
            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const browseButton = screen.getByRole('button', { name: /browse/i });
            const dropZone = browseButton.closest('div')?.parentElement?.parentElement;
            expect(dropZone).toBeInTheDocument();

            const testFile = createTestFile('image/png', 500000);
            fireEvent.drop(dropZone!, {
                dataTransfer: {
                    files: [testFile],
                },
            });

            const uploadButton = await screen.findByRole('button', { name: /upload photo/i });
            expect(uploadButton).toBeInTheDocument();
        });
    });

    describe('Upload Functionality', () => {
        it('uploads avatar successfully', async () => {
            let capturedOnSuccess: (() => void) | undefined;
            mockMutationOptions.mockReturnValue({
                onSuccess: vi.fn(),
                onError: vi.fn(),
            });

            mockMutate.mockImplementation((_data, options) => {
                capturedOnSuccess = options?.onSuccess;
            });

            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = createTestFile('image/png', 500000);
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const uploadButton = await screen.findByRole('button', { name: /upload photo/i });
            await user.click(uploadButton);

            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    avatar: expect.stringContaining('data:image/png;base64,'),
                }),
                expect.any(Object),
            );

            await act(async () => {
                capturedOnSuccess?.();
            });

            const successMessage = await screen.findByText(/avatar uploaded successfully/i);
            expect(successMessage).toBeInTheDocument();
        });

        it('shows error when upload fails', async () => {
            let onErrorCallback: ((err: Error) => void) | undefined;
            mockMutationOptions.mockImplementation((opts) => {
                onErrorCallback = opts.onError;
                return opts;
            });

            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const fileInput = screen.getByRole('dialog').querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = createTestFile('image/png', 500000);
            Object.defineProperty(fileInput, 'files', {
                value: [testFile],
                writable: false,
            });
            fireEvent.change(fileInput);

            const uploadButton = await screen.findByRole('button', { name: /upload photo/i });
            await user.click(uploadButton);

            await act(async () => {
                const testError = new Error('Network error');
                onErrorCallback?.(testError);
            });

            const errorMessage = await screen.findByText(/network error/i);
            expect(errorMessage).toBeInTheDocument();
        });
    });

    describe('Remove Functionality', () => {
        it('removes avatar successfully', async () => {
            let capturedOnSuccess: (() => void) | undefined;
            mockMutationOptions.mockReturnValue({
                onSuccess: vi.fn(),
                onError: vi.fn(),
            });

            mockMutate.mockImplementation((_data, options) => {
                capturedOnSuccess = options?.onSuccess;
            });

            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const removeButton = screen.getByRole('button', { name: /remove/i });
            await user.click(removeButton);

            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({
                    avatar: '',
                }),
                expect.any(Object),
            );

            await act(async () => {
                capturedOnSuccess?.();
            });

            const successMessage = await screen.findByText(/avatar removed successfully/i);
            expect(successMessage).toBeInTheDocument();
        });

        it('shows error when remove fails', async () => {
            let onErrorCallback: ((err: Error) => void) | undefined;
            mockMutationOptions.mockImplementation((opts) => {
                onErrorCallback = opts.onError;
                return opts;
            });

            const user = userEvent.setup();
            render(<AvatarUploadDialog />);

            const triggerButton = screen.getByRole('button', { name: /upload avatar/i });
            await user.click(triggerButton);

            const removeButton = screen.getByRole('button', { name: /remove/i });
            await user.click(removeButton);

            await act(async () => {
                const testError = new Error('Failed to remove avatar');
                onErrorCallback?.(testError);
            });

            const errorMessage = await screen.findByText(/failed to remove avatar/i);
            expect(errorMessage).toBeInTheDocument();
        });
    });
});
