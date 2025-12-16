import type { FC, ReactNode } from 'react';

type PageProps = {
    title: string;
    headerComponent?: ReactNode;
    children?: ReactNode;
    className?: string;
};

export const Page: FC<PageProps> = ({ title, headerComponent, children, className = '' }) => {
    return (
        <div className='max-w-4xl mx-auto px-4 py-6 space-y-6 relative' style={{ minWidth: 320 }}>
            <div className={`flex items-center justify-between ${className}`}>
                <h1 className='text-3xl font-bold'>{title}</h1>
                <div className='flex items-center space-x-2'>{headerComponent}</div>
            </div>

            {children}
        </div>
    );
};
