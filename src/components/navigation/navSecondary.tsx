import * as React from 'react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { RouteMetadata } from '@/lib/appRoutes';
import { getSecondaryNavRoutes } from '@/lib/appRoutes';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function NavSecondary({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const secondaryNavRoutes = getSecondaryNavRoutes();

    const loggedIn = useSession().status === 'authenticated';

    const showRoute = (route: RouteMetadata): boolean =>
        route.isSecondaryNav === true && (route.isPublic === true || loggedIn);

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {secondaryNavRoutes.map(
                        (item) =>
                            showRoute(item) && (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton asChild size='sm'>
                                        <Link href={item.path}>
                                            {item.icon && <item.icon />}
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ),
                    )}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
