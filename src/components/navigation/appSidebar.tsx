'use client';

import * as React from 'react';

import { NavMain } from '@/components/navigation/navMain';
import { NavSecondary } from '@/components/navigation/navSecondary';
import { NavUser } from '@/components/navigation/navUser';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { APP_ROUTES } from '@/lib/appRoutes';
import Image from 'next/image';
import Link from 'next/link';

import logo from '../../../public/logo.png';
import { Separator } from '../ui/separator';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant='inset' {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' className='' asChild>
                            <Link href={APP_ROUTES.root.path} className='flex items-center gap-2'>
                                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                                    <Image
                                        src={logo}
                                        alt='PolySim Logo'
                                        width={120}
                                        height={120}
                                        className='rounded-lg border border-black'
                                    />
                                </div>
                                <span className='truncate font-bold text-[26px] leading-tight'>PolySim</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <Separator />
            <SidebarContent>
                <NavMain />
                <NavSecondary className='mt-auto' />
            </SidebarContent>
            <Separator />
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
