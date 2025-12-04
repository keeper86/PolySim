'use client';

import { ChevronsUpDown, LogOut } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import UserAvatar from '@/components/client/UserAvatar';
import { APP_ROUTES } from '@/lib/appRoutes';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

export function NavUser() {
    const { isMobile } = useSidebar();
    const { data: session, status } = useSession();
    const loggedIn = status === 'authenticated';

    const callbackUrl = typeof window !== 'undefined' ? window.location.href : undefined;

    if (!loggedIn) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size='lg' onClick={() => signIn('keycloak', { callbackUrl })}>
                        <Avatar className='h-8 w-8 rounded-lg'>
                            <AvatarFallback className='rounded-lg p-1 bg-muted'>
                                <svg viewBox='0 0 24 24' fill='none' className='w-6 h-6 text-muted-foreground'>
                                    <circle cx='12' cy='8' r='4' fill='currentColor' />
                                    <rect x='4' y='16' width='16' height='6' rx='3' fill='currentColor' />
                                </svg>
                            </AvatarFallback>
                        </Avatar>
                        <span className='font-semibold'>Login</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        );
    }

    const user = session?.user;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                        >
                            <UserAvatar />
                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-semibold'>{user?.displayName}</span>
                                {user?.email && <span className='truncate text-xs'>{user?.email}</span>}
                            </div>
                            <ChevronsUpDown className='ml-auto size-4' />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                        side={isMobile ? 'bottom' : 'right'}
                        align='end'
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className='p-0 font-normal'>
                            <div className='flex items-center gap-2 py-1.5 text-left text-sm'>
                                <UserAvatar />
                                <div className='grid flex-1 text-left text-sm leading-tight'>
                                    <span className='truncate font-semibold'>{user?.displayName}</span>
                                    {user?.email && <span className='truncate text-xs'>{user?.email}</span>}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href={APP_ROUTES.account.root.path} className='flex items-center gap-2'>
                                    {APP_ROUTES.account.root.icon && <APP_ROUTES.account.root.icon />}
                                    Account
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={APP_ROUTES.pong.path} className='flex items-center gap-2'>
                                    {APP_ROUTES.pong.icon && <APP_ROUTES.pong.icon />}
                                    Paddle War
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => signOut({ callbackUrl: APP_ROUTES.root.path })}
                            className='text-destructive'
                        >
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
