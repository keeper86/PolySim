'use client';

import { Upload, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useTRPCClient } from '@/lib/trpc';
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
import { useCallback } from 'react';

export default function FileUploadDirectUploadPage() {
    const [files, setFiles] = React.useState<File[]>([]);
    const trpc = useTRPCClient();

    const fileToPngDataUrl = useCallback(async (file: File): Promise<string> => {
        const readAsDataURL = (f: File) =>
            new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = () => reject(new Error('Failed to read file'));
                r.readAsDataURL(f);
            });

        return readAsDataURL(file);
    }, []);

    const onFileReject = useCallback((file: File, message: string) => {
        toast(message, {
            description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
        });
    }, []);

    const onValueChange = async (files: File[]) => {
        setFiles(files);

        // Handle avatar removal
        if (!files || files.length === 0) {
            trpc.updateUser
                .mutate({ avatar: '' })
                .then(() => toast.success('Avatar removed successfully'))
                .catch((err) => {
                    toast.error('Failed to remove avatar');
                    console.error(err);
                });
        }
    };

    const onUpload: NonNullable<FileUploadProps['onUpload']> = useCallback(
        async (files, { onSuccess, onError }) => {
            const file = files[0];
            if (!file) {
                return;
            }

            try {
                const pngDataUrl = await fileToPngDataUrl(file);
                await trpc.updateUser.mutate({ avatar: pngDataUrl });
                onSuccess(file);
                toast.success('Avatar uploaded successfully');
            } catch (err) {
                console.error(err);
                onError(file, err instanceof Error ? err : new Error('Upload failed'));
                toast.error('Failed to process image. Only images are supported.');
            }
        },
        [trpc, fileToPngDataUrl],
    );

    return (
        <FileUpload
            value={files}
            onValueChange={onValueChange}
            onUpload={onUpload}
            onFileReject={onFileReject}
            maxFiles={1}
            accept='image/png'
            className='w-full max-w-md'
        >
            <FileUploadDropzone>
                <div className='flex flex-col items-center gap-1 text-center'>
                    <div className='flex items-center justify-center rounded-full border p-2.5'>
                        <Upload className='size-6 text-muted-foreground' />
                    </div>
                    <p className='font-medium text-sm'>Drag & drop files here</p>
                    <p className='text-muted-foreground text-xs'>Or click to browse (max 1 files)</p>
                </div>
                <FileUploadTrigger asChild>
                    <Button variant='outline' size='sm' className='mt-2 w-fit'>
                        Browse files
                    </Button>
                </FileUploadTrigger>
            </FileUploadDropzone>
            <FileUploadList>
                {files.map((file, index) => (
                    <FileUploadItem key={index} value={file} className='flex-col'>
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
    );
}
