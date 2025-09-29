'use client';

import { BookOpen, Frame, Gamepad, Map, PieChart } from 'lucide-react';
import * as React from 'react';

import { NavMain } from '@/components/navigation/nav-main';
import { NavSecondary } from '@/components/navigation/nav-secondary';
import { NavUser } from '@/components/navigation/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import Link from 'next/link';

const data = {
    user: {
        name: 'PolySim User',
        email: 'user@polysim.local',
        avatar: '/favicon.ico', // fallback to favicon or add user logic
    },
    navMain: [
        {
            title: 'Projects',
            url: '/projects',
            icon: Frame,
            isActive: false,
        },
        {
            title: 'Analysis',
            url: '/analysis',
            icon: PieChart,
            isActive: false,
        },
        {
            title: 'Files',
            url: '/files',
            icon: Map,
            isActive: false,
        },
    ],
    navSecondary: [
        {
            title: 'API Docs',
            url: '/api-doc',
            icon: BookOpen,
            isActive: false,
        },
        {
            title: 'Paddle War',
            url: '/pong',
            icon: Gamepad,
            isActive: false,
        },
    ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant='inset' {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size='lg' asChild>
                            <Link href='/'>
                                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                                    <Image
                                        src='/polysim-logo.svg'
                                        alt='PolySim Logo'
                                        width={24}
                                        height={24}
                                        className='size-6'
                                        style={{ imageRendering: 'auto' }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = '/favicon.ico';
                                        }}
                                        priority
                                    />
                                </div>
                                <div className='grid flex-1 text-left text-lg leading-tight'>
                                    <span className='truncate font-bold'>PolySim</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain />
                <NavSecondary items={data.navSecondary} className='mt-auto' />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
