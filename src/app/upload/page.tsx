'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProvUploadInput } from '@/server/controller/uploadActivity';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTRPC } from '@/lib/trpc';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { TRPCClientError } from '@trpc/client';
import { useSession } from 'next-auth/react';
import { ErrorState } from '@/components/client/ErrorState';
import { Page } from '@/components/client/Page';

export default function ProvenanceUploadPage() {
    const session = useSession();

    const trpc = useTRPC();

    const [previewText, setPreviewText] = useState<string | null>(null);
    const [previewObject, setPreviewObject] = useState<ProvUploadInput | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadMutation = useMutation(trpc.uploadActivity.mutationOptions());

    if (session.status !== 'authenticated') {
        return <ErrorState title='Not Authenticated' description='You must be logged in to upload provenance data.' />;
    }

    const validateFile = (file: File): string | null => {
        const maxSize = 4 * 1024 * 1024; // 4MB

        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            return 'Please upload a JSON (.json) file';
        }

        if (file.size > maxSize) {
            return 'File size must be less than 4MB';
        }

        return null;
    };

    const handleFileSelect = (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setSuccessMessage(null);
            return;
        }

        setError(null);
        setSuccessMessage(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            const text = String(reader.result ?? '');
            setPreviewText(text);
            try {
                const parsed = JSON.parse(text) as ProvUploadInput;
                setPreviewObject(parsed);
            } catch (_) {
                setPreviewObject(null);
                setError('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleUpload = async () => {
        if (!previewObject) {
            setError('No valid JSON to upload');
            return;
        }

        setError(null);
        setSuccessMessage(null);

        try {
            await uploadMutation.mutateAsync(previewObject as ProvUploadInput);
            setSuccessMessage('Upload successful');
            setPreviewObject(null);
            setPreviewText(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err instanceof TRPCClientError ? err.message : String(err));
        }
    };

    const handleClear = () => {
        setPreviewObject(null);
        setPreviewText(null);
        setError(null);
        setSuccessMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Page title='Upload Provenance Data'>
            <div className='flex flex-col items-center gap-6 py-4'>
                {!previewText && (
                    <div
                        className={cn(
                            'border-2 border-dashed rounded-lg p-8 w-full text-center transition-colors',
                            isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className='flex flex-col items-center gap-3'>
                            <div className='rounded-full bg-muted p-4'>
                                <Upload className='h-6 w-6 text-muted-foreground' />
                            </div>
                            <div>
                                <p className='font-medium'>
                                    Drop your PROV JSON here, or{' '}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className='text-primary hover:underline'
                                    >
                                        browse
                                    </button>
                                </p>
                                <p className='text-muted-foreground text-sm mt-1'>JSON (.json) up to 4MB</p>
                            </div>
                            <Input
                                ref={fileInputRef}
                                type='file'
                                accept='application/json,.json'
                                onChange={handleFileInputChange}
                                className='hidden'
                            />
                        </div>
                    </div>
                )}

                {error && (
                    <Alert variant='destructive'>
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {successMessage && (
                    <>
                        <Alert>
                            <AlertDescription className='text-green-600'>{successMessage}</AlertDescription>
                        </Alert>
                    </>
                )}

                {previewText && (
                    <div className='w-full'>
                        <div className='mb-2 flex gap-3'>
                            <Button onClick={handleUpload} className='flex-1' disabled={uploadMutation.isPending}>
                                {uploadMutation.isPending ? 'Uploading...' : 'Upload PROV JSON'}
                            </Button>
                            <Button
                                onClick={handleClear}
                                variant='outline'
                                className='flex-1'
                                disabled={uploadMutation.isPending}
                            >
                                Clear
                            </Button>
                        </div>
                        <pre className='rounded border p-4 max-h-72 overflow-auto text-sm bg-surface'>
                            {previewText}
                        </pre>
                    </div>
                )}

                {!previewText && (
                    <Button onClick={() => fileInputRef.current?.click()} className='w-full'>
                        Choose File
                    </Button>
                )}
            </div>
        </Page>
    );
}
