'use client';
import type { RouteMetadata } from '@/lib/appRoutes';
import { APP_ROUTES, isRoute, isRouteManifest } from '@/lib/appRoutes';
import { SidebarMenuItem, SidebarMenuButton, SidebarMenu, useSidebar } from '@/components/ui/sidebar';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import React from 'react';
import type { JSX } from 'react/jsx-runtime';

function RenderNavEntry(route: RouteMetadata, opts?: { isSub?: boolean }): JSX.Element {
    const { isSub } = opts || {};
    const { isMobile, setOpenMobile } = useSidebar();

    const handleClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <SidebarMenuItem key={route.path}>
            <SidebarMenuButton
                asChild
                size={isSub ? 'sm' : 'default'}
                className={isSub ? 'font-normal text-muted-foreground' : 'font-medium'}
                onClick={handleClick}
            >
                <Link href={route.path}>
                    {route.icon && !isSub ? <route.icon width={14} height={14} /> : null}
                    <span>{route.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain() {
    const loggedIn = useSession().status === 'authenticated';

    const showRoute = (route: RouteMetadata): boolean =>
        route.isMainNav === true && (route.isPublic === true || loggedIn);
    return (
        <nav className='py-4 px-4'>
            <SidebarMenu>
                {Object.values(APP_ROUTES).map((route) => {
                    if (isRoute(route)) {
                        if (!showRoute(route)) {
                            return null;
                        }
                        return RenderNavEntry(route);
                    }
                    if (isRouteManifest(route)) {
                        const { root, ...rest } = route;
                        if (!isRoute(root) || !showRoute(root)) {
                            return null;
                        }
                        const subItems: JSX.Element[] = [];
                        Object.values(rest).forEach((subRoute) => {
                            if (isRoute(subRoute) && showRoute(subRoute)) {
                                subItems.push(RenderNavEntry(subRoute, { isSub: true }));
                            }
                        });
                        return (
                            <details
                                key={root.path + '.group'}
                                className='group [&_summary::-webkit-details-marker]:hidden'
                            >
                                <summary className='list-none'>{RenderNavEntry(root)}</summary>
                                {subItems.length > 0 && <ul className='ml-4 mt-2 space-y-1'>{subItems}</ul>}
                            </details>
                        );
                    }
                    return null;
                })}
            </SidebarMenu>
        </nav>
    );
}
