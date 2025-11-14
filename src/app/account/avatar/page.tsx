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
    FileUploadItemProgress,
    FileUploadList,
    type FileUploadProps,
    FileUploadTrigger,
} from '@/components/ui/file-upload';
import { useCallback } from 'react';

export default function FileUploadDirectUploadPage() {
    const [files, setFiles] = React.useState<File[]>([]);
    const trpc = useTRPCClient();

    // Helper: konvertiert beliebige Bild-Datei zu PNG Data-URL (base64).
    const fileToPngDataUrl = useCallback(async (file: File): Promise<string> => {
        // Wenn bereits PNG und Browser liefert DataURL, nutzen wir direkten FileReader-Output
        const readAsDataURL = (f: File) =>
            new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(String(r.result));
                r.onerror = () => reject(new Error('Failed to read file'));
                r.readAsDataURL(f);
            });

        return readAsDataURL(file);
    }, []);

    const onUpload: NonNullable<FileUploadProps['onUpload']> = useCallback(
        async (files, { onProgress, onSuccess, onError }) => {
            try {
                // Process each file individually
                const uploadPromises = files.map(async (file) => {
                    try {
                        // Simulate file upload with progress
                        const totalChunks = 10;
                        let uploadedChunks = 0;

                        // Simulate chunk upload with delays
                        for (let i = 0; i < totalChunks; i++) {
                            // Simulate network delay (100-300ms per chunk)
                            await new Promise((resolve) => setTimeout(resolve, Math.random() * 200 + 100));

                            // Update progress for this specific file
                            uploadedChunks++;
                            const progress = (uploadedChunks / totalChunks) * 100;
                            onProgress(file, progress);
                        }

                        // Simulate server processing delay
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        onSuccess(file);
                    } catch (error) {
                        onError(file, error instanceof Error ? error : new Error('Upload failed'));
                    }
                });

                // Wait for all uploads to complete
                await Promise.all(uploadPromises);
            } catch (error) {
                // This handles any error that might occur outside the individual upload processes
                console.error('Unexpected error during upload:', error);
            }
        },
        [],
    );

    const onFileReject = useCallback((file: File, message: string) => {
        toast(message, {
            description: `"${file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name}" has been rejected`,
        });
    }, []);

    return (
        <FileUpload
            value={files}
            onValueChange={async (files: File[]) => {
                // Wenn keine Dateien, leere Avatar im Backend setzen
                if (!files || files.length === 0) {
                    try {
                        await trpc.updateUser.mutate({ avatar: '' });
                        setFiles(files);
                        toast.success('Avatar entfernt');
                    } catch (err) {
                        toast.error('Fehler beim Entfernen des Avatars');
                        console.error(err);
                    }
                    return;
                }

                const first = files[0];
                try {
                    // Konvertiere zu PNG Data-URL (inkl. 'data:image/png;base64,...')
                    const pngDataUrl = await fileToPngDataUrl(first);

                    // Optional: Prüfen auf maximale Größe (serverseitig wird ebenfalls geprüft)
                    // Entferne Prefix nur falls gewünscht; backend akzeptiert beides
                    await trpc.updateUser.mutate({ avatar: pngDataUrl });

                    setFiles(files);
                    toast.success('Avatar hochgeladen');
                } catch (err) {
                    console.error(err);
                    toast.error('Fehler beim Verarbeiten des Bildes. Nur Bilder werden unterstützt.');
                }
            }}
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
                        <FileUploadItemProgress />
                    </FileUploadItem>
                ))}
            </FileUploadList>
        </FileUpload>
    );
}
