'use client';

import * as React from 'react';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    FileUpload,
    FileUploadDropzone,
    FileUploadItem,
    FileUploadItemDelete,
    FileUploadItemMetadata,
    FileUploadItemPreview,
    FileUploadList,
    type FileUploadProps,
    FileUploadTrigger,
} from '@/components/ui/file-upload';
import { useTRPCClient } from '@/lib/trpc';

interface FileUploadDialogProps {
    triggerLabel?: string;
    title?: string;
    description?: string;
    maxFiles?: number;
    accept?: string;
    onUploadSuccess?: () => void;
}

export function FileUploadDialog({
    triggerLabel = 'Upload File',
    title = 'Upload File',
    description = 'Drag and drop your file here or click to browse.',
    maxFiles = 1,
    accept = 'image/*',
    onUploadSuccess,
}: FileUploadDialogProps) {
    const [open, setOpen] = React.useState(false);
    const [files, setFiles] = React.useState<File[]>([]);
    const trpc = useTRPCClient();

    const fileToPngDataUrl = React.useCallback(async (file: File): Promise<string> => {
        const readAsDataURL = (f: File) =>
            new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = () => reject(new Error('Failed to read file'));
                r.readAsDataURL(f);
            });

        return readAsDataURL(file);
    }, []);

    const onFileReject = React.useCallback((file: File, message: string) => {
        toast(message, {
            description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
        });
    }, []);

    const onValueChange = React.useCallback(async (newFiles: File[]) => {
        setFiles(newFiles);
    }, []);

    const onUpload: NonNullable<FileUploadProps['onUpload']> = React.useCallback(
        async (uploadFiles, { onSuccess, onError }) => {
            const file = uploadFiles[0];
            if (!file) {
                return;
            }

            try {
                const pngDataUrl = await fileToPngDataUrl(file);
                await trpc.updateUser.mutate({ avatar: pngDataUrl });
                onSuccess(file);
                toast.success('File uploaded successfully');
                onUploadSuccess?.();
                setOpen(false);
                setFiles([]);
            } catch (err) {
                onError(file, err instanceof Error ? err : new Error('Upload failed'));
            }
        },
        [trpc, fileToPngDataUrl, onUploadSuccess],
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant='outline'>{triggerLabel}</Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px] max-h-[80vh] overflow-y-auto'>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className='py-4 overflow-y-auto max-h-[calc(80vh-200px)]'>
                    <FileUpload
                        value={files}
                        onValueChange={onValueChange}
                        onUpload={onUpload}
                        onFileReject={onFileReject}
                        maxFiles={maxFiles}
                        accept={accept}
                        className='w-full'
                    >
                        <FileUploadDropzone>
                            <div className='flex flex-col items-center gap-1 text-center'>
                                <div className='flex items-center justify-center rounded-full border p-2.5'>
                                    <Upload className='size-6 text-muted-foreground' />
                                </div>
                                <p className='font-medium text-sm'>Drag & drop files here</p>
                                <p className='text-muted-foreground text-xs'>Or click to browse</p>
                            </div>
                            <FileUploadTrigger asChild>
                                <Button variant='outline' size='sm' className='mt-2 w-fit'>
                                    Browse files
                                </Button>
                            </FileUploadTrigger>
                        </FileUploadDropzone>
                        <FileUploadList>
                            {files.map((file) => (
                                <FileUploadItem key={`${file.name}-${file.size}`} value={file} className='flex-col'>
                                    <div className='flex w-full items-center gap-2'>
                                        <FileUploadItemPreview />
                                        <FileUploadItemMetadata />
                                        <FileUploadItemDelete asChild>
                                            <Button variant='ghost' size='icon' className='size-7'>
                                                <X />
                                            </Button>
                                        </FileUploadItemDelete>
                                    </div>
                                </FileUploadItem>
                            ))}
                        </FileUploadList>
                    </FileUpload>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type='button' variant='outline'>
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
