import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ErrorStateProps = {
    title?: string;
    description?: string;
    className?: string;
};

export const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'Failed to load',
    description = 'Something went wrong. Please try again later.',
    className = '',
}) => {
    return (
        <div className={`flex items-center justify-center min-h-[400px] px-4 ${className}`}>
            <Alert variant='destructive' className='w-full max-w-xl'>
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription>{description}</AlertDescription>
            </Alert>
        </div>
    );
};

export default ErrorState;
