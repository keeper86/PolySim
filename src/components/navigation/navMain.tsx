'use client';
import type { RouteMetadata } from '@/lib/pageRoutes';
import { PAGE_ROUTES, isRoute, isRouteManifest } from '@/lib/pageRoutes';
import Link from 'next/link';
import React from 'react';
import type { JSX } from 'react/jsx-runtime';

const ICON_WIDTH = 18;

function renderNavEntry(route: RouteMetadata, opts?: { isSub?: boolean }): JSX.Element {
    const { isSub } = opts || {};
    return (
        <li key={route.path}>
            <Link
                href={route.path}
                className={[
                    'flex items-center gap-2 rounded',
                    isSub
                        ? 'font-normal text-[14px] text-muted-foreground pb-1 mb-1 -mt-1.5'
                        : 'font-medium text-[16px] text-base-content',
                ].join(' ')}
            >
                <span style={{ display: 'inline-block', width: ICON_WIDTH, minWidth: ICON_WIDTH }} aria-hidden='true'>
                    {route.icon && !isSub ? <route.icon width={14} height={14} /> : null}
                </span>
                {route.label}
            </Link>
        </li>
    );
}

export function NavMain() {
    return (
        <nav className='py-4 px-4'>
            <ul className='flex flex-col gap-2'>
                {Object.values(PAGE_ROUTES).map((route) => {
                    if (isRoute(route) && route.isMainNav) {
                        return renderNavEntry(route);
                    }
                    if (isRouteManifest(route)) {
                        const { root, ...rest } = route;
                        if (!isRoute(root) || !root.isMainNav) {
                            return null;
                        }
                        const subItems: JSX.Element[] = [];
                        Object.values(rest).forEach((subRoute) => {
                            if (isRoute(subRoute) && subRoute.isMainNav) {
                                subItems.push(renderNavEntry(subRoute, { isSub: true }));
                            }
                        });
                        return (
                            <React.Fragment key={root.path + '.block'}>
                                {renderNavEntry(root)}
                                {subItems.length > 0 && <ul>{subItems}</ul>}
                            </React.Fragment>
                        );
                    }
                    return null;
                })}
            </ul>
        </nav>
    );
}
