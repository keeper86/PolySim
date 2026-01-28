'use client';

import { useRef, useState } from 'react';
import { AlertCircle, Camera, Upload, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import UserAvatar from '@/components/client/UserAvatar';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTRPC } from '@/lib/trpc';
import { cn } from '@/lib/utils';

interface AvatarUploadDialogProps {
    triggerLabel?: string;
}

export function AvatarUploadDialog({ triggerLabel = 'Upload Avatar' }: AvatarUploadDialogProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const [open, setOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateUserMutation = useMutation(
        trpc.updateUser.mutationOptions({
            onSuccess: () => {
                void queryClient.invalidateQueries({ queryKey: trpc.getUser.queryKey() });
                setPreviewUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
            onError: (err) => {
                setError(err instanceof Error ? err.message : 'Operation failed');
            },
        }),
    );

    const cleanupAndCloseDialog = (openState: boolean) => {
        if (!openState) {
            setOpen(false);
            setToDefault();
        } else {
            setOpen(true);
        }
    };

    const validateFile = (file: File): string | null => {
        const maxSize = 1024 * 1024; // 1MB

        if (file.type !== 'image/png') {
            return 'Please upload a PNG image file';
        }

        if (file.size > maxSize) {
            return 'File size must be less than 1MB';
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
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
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

    const handleUpload = () => {
        if (!previewUrl) {
            return;
        }

        setError(null);
        setSuccessMessage(null);

        updateUserMutation.mutate(
            { avatar: previewUrl },
            {
                onSuccess: () => {
                    setSuccessMessage('Avatar uploaded successfully');
                },
            },
        );
    };

    const handleRemove = () => {
        setError(null);
        setSuccessMessage(null);

        updateUserMutation.mutate(
            { avatar: '' },
            {
                onSuccess: () => {
                    setSuccessMessage('Avatar removed successfully');
                },
            },
        );
    };

    const handleClose = () => {
        setOpen(false);
        setToDefault();
    };

    const setToDefault = () => {
        setPreviewUrl(null);
        setError(null);
        setSuccessMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const isUploading = updateUserMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={cleanupAndCloseDialog}>
            <DialogTrigger asChild>
                <Button className='w-full justify-start' variant='outline'>
                    <Camera className='w-4 h-4' />
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
                <DialogHeader>
                    <DialogTitle>Profile Picture</DialogTitle>
                    <DialogDescription>Upload a profile picture to personalize your account</DialogDescription>
                </DialogHeader>

                <div className='flex flex-col items-center gap-6 py-4'>
                    <UserAvatar large src={previewUrl} />

                    {!previewUrl && (
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
                                        Drop your image here, or{' '}
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className='text-primary hover:underline'
                                        >
                                            browse
                                        </button>
                                    </p>
                                    <p className='text-muted-foreground text-sm mt-1'>PNG only (max 1MB)</p>
                                </div>
                                <Input
                                    ref={fileInputRef}
                                    type='file'
                                    accept='image/png'
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
                            <Button onClick={handleClose} className='w-full'>
                                Close
                            </Button>
                        </>
                    )}

                    {previewUrl && (
                        <div className='flex gap-3 w-full'>
                            <Button onClick={handleUpload} className='flex-1' disabled={isUploading}>
                                <Camera className='h-4 w-4 mr-2' />
                                {isUploading ? 'Uploading...' : 'Upload Photo'}
                            </Button>
                            <Button onClick={setToDefault} variant='outline' className='flex-1' disabled={isUploading}>
                                Cancel
                            </Button>
                        </div>
                    )}

                    {!previewUrl && (
                        <div className='flex gap-3 w-full'>
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant='outline'
                                className='flex-1'
                                disabled={isUploading}
                            >
                                <Camera className='h-4 w-4 mr-2' />
                                Change Photo
                            </Button>
                            <Button
                                onClick={handleRemove}
                                variant='outline'
                                className='flex-1 text-destructive hover:text-destructive'
                                disabled={isUploading}
                            >
                                <X className='h-4 w-4 mr-2' />
                                {isUploading ? 'Removing...' : 'Remove'}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
