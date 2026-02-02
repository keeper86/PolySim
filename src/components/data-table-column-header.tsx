'use client';

import * as React from 'react';

interface DataTableColumnHeaderProps {
    title: React.ReactNode;
    sortable?: boolean;
    isSorted?: boolean;
    sortDir?: 'asc' | 'desc';
    onSort?: () => void;
    className?: string;
}

export function DataTableColumnHeader({
    title,
    sortable = false,
    isSorted = false,
    sortDir = 'desc',
    onSort,
    className = '',
}: DataTableColumnHeaderProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {sortable ? (
                <button type='button' className='flex items-center gap-2' onClick={onSort}>
                    <span>{title}</span>
                    {isSorted ? (
                        <span aria-hidden>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    ) : (
                        <span className='opacity-50' aria-hidden>
                            ⇅
                        </span>
                    )}
                </button>
            ) : (
                <div>{title}</div>
            )}
        </div>
    );
}

export default DataTableColumnHeader;
