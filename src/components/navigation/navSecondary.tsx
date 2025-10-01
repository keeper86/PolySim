import * as React from 'react';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { getSecondaryNavRoutes } from '@/lib/pageRoutes';
import Link from 'next/link';

export function NavSecondary({ ...props }: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
    const secondaryNavRoutes = getSecondaryNavRoutes();

    return (
        <SidebarGroup {...props}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {secondaryNavRoutes.map((item) => (
                        <SidebarMenuItem key={item.label}>
                            <SidebarMenuButton asChild size='sm'>
                                <Link href={item.path}>
                                    {item.icon && <item.icon />}
                                    <span>{item.label}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
