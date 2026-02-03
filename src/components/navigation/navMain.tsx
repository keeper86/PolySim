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
    const loggedIn = useSession().status === 'authenticated';

    const handleClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const showRoute = (route: RouteMetadata): boolean => route.isPublic === true || loggedIn;

    return (
        <SidebarMenuItem key={route.path}>
            <SidebarMenuButton
                asChild
                size={isSub ? 'sm' : 'default'}
                className={isSub ? 'font-normal text-muted-foreground' : 'text-md'}
                onClick={handleClick}
            >
                <Link href={route.path} aria-disabled={!showRoute(route)}>
                    {route.icon && !isSub ? <route.icon width={16} height={16} /> : null}
                    <span>{route.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export function NavMain() {
    return (
        <nav className='py-4 px-4'>
            <SidebarMenu>
                {Object.values(APP_ROUTES).map((route) => {
                    if (isRoute(route)) {
                        if (route.isMainNav === true) {
                            return RenderNavEntry(route);
                        }
                        return null;
                    }
                    if (isRouteManifest(route)) {
                        const { root, ...rest } = route;
                        if (!isRoute(root) || root.isMainNav !== true) {
                            return null;
                        }
                        const subItems: JSX.Element[] = [];
                        Object.values(rest).forEach((subRoute) => {
                            if (isRoute(subRoute)) {
                                subItems.push(RenderNavEntry(subRoute, { isSub: true }));
                            }
                        });
                        return (
                            <React.Fragment key={root.path + '.block'}>
                                {RenderNavEntry(root)}
                                {subItems.length > 0 && <ul>{subItems}</ul>}
                            </React.Fragment>
                        );
                    }
                    return null;
                })}
            </SidebarMenu>
        </nav>
    );
}
