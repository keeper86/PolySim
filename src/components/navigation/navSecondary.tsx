import * as React from 'react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import type { RouteMetadata } from '@/lib/appRoutes';
import { getSecondaryNavRoutes } from '@/lib/appRoutes';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function NavSecondary({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const secondaryNavRoutes = getSecondaryNavRoutes();
    const { isMobile, setOpenMobile } = useSidebar();

    const loggedIn = useSession().status === 'authenticated';

    const showRoute = (route: RouteMetadata): boolean => route.isSecondaryNav === true;

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {secondaryNavRoutes.map(
                        (item) =>
                            showRoute(item) && (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton
                                        asChild
                                        size='sm'
                                        onClick={() => isMobile && setOpenMobile(false)}
                                    >
                                        <Link href={item.path} aria-disabled={!(item.isPublic === true || loggedIn)}>
                                            {item.icon && <item.icon width={16} height={16} />}
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
