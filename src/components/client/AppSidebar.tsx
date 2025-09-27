'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { Files, BarChart3, FolderOpen, User, LogOut } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

// Menu items for navigation
const items: Array<{
    title: string;
    href: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
    {
        title: 'Projects',
        href: '/projects',
        icon: FolderOpen,
    },
    {
        title: 'Files',
        href: '/files',
        icon: Files,
    },
    {
        title: 'Analysis',
        href: '/analysis',
        icon: BarChart3,
    },
];

export default function AppSidebar() {
    const { status, data } = useSession();
    const loggedIn = status === 'authenticated';

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex flex-row items-center gap-2 px-2 py-2">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                        <span className="font-bold tracking-tight">PolySim</span>
                    </Link>
                </div>
            </SidebarHeader>
            {loggedIn && (
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => {
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild>
                                                <a href={item.href}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </a>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
            )}
            <SidebarFooter>
                {loggedIn ? (
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                                        <User />
                                        <div className="grid flex-1 text-left text-sm leading-tight">
                                            <span className="truncate font-semibold">{data.user?.name}</span>
                                            <span className="truncate text-xs">Account</span>
                                        </div>
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuItem asChild>
                                        <Link href="/account" className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Account Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                ) : (
                    <div className="p-2">
                        <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => signIn('keycloak', { callbackUrl: '/' })}
                        >
                            <User />
                            Login
                        </Button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
