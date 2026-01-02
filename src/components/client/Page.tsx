import type { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageProps = {
    title: string;
    headerComponent?: ReactNode;
    children?: ReactNode;
    className?: string;
};

export const Page: FC<PageProps> = ({ title, headerComponent, children, className = '' }) => {
    return (
        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6 relative min-w-[320px]'>
            <div className={cn('flex items-center justify-between', className)}>
                <h1 className='text-3xl font-bold'>{title}</h1>
                <div className='flex items-center space-x-2'>{headerComponent}</div>
            </div>

            {children}
        </div>
    );
};
