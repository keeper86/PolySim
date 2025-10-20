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
import { getBreadcrumbData } from '@/lib/appRoutes';

export function DynamicBreadcrumbs() {
    const pathname = usePathname();
    const breadcrumbs = getBreadcrumbData(pathname);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, idx) => (
                    <React.Fragment key={breadcrumb.path}>
                        {idx > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                            {breadcrumb.isLast ? (
                                <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink href={breadcrumb.path}>{breadcrumb.label}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
