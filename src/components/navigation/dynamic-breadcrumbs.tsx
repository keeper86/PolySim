'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Optional: Map route segments to pretty labels
const LABELS: Record<string, string> = {
    'dashboard': 'Dashboard',
    'projects': 'Projects',
    'analysis': 'Analysis',
    'files': 'Files',
    'api-doc': 'API Docs',
    'imprint': 'Imprint',
};

export function DynamicBreadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    // Build up the path for each segment
    let path = '';

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                </BreadcrumbItem>
                {segments.map((segment, idx) => {
                    path += `/${segment}`;
                    const isLast = idx === segments.length - 1;
                    const label = LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
                    return (
                        <React.Fragment key={segment + '-' + idx}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={path}>{label}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
