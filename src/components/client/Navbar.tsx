'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';

export default function Navbar() {
    const { status, data } = useSession();
    const loggedIn = status === 'authenticated';

    return (
        <header className='navbar bg-base-100 shadow-lg border-b border-base-300 py-4'>
            <div className='container mx-auto flex flex-row items-center justify-between w-full px-2 md:px-6'>
                <div className='flex items-center gap-6'>
                    <Link href='/' className='btn btn-ghost text-2xl px-4'>
                        <span className='font-bold tracking-tight'>PolySim</span>
                    </Link>
                    {loggedIn && (
                        <nav className='hidden md:flex gap-4'>
                            <Link href='/projects' className='btn btn-ghost px-4 py-2'>
                                Projects
                            </Link>
                            <Link href='/files' className='btn btn-ghost px-4 py-2'>
                                Files
                            </Link>
                            <Link href='/analysis' className='btn btn-ghost px-4 py-2'>
                                Analysis
                            </Link>
                        </nav>
                    )}
                </div>
                <div className='flex items-center gap-4'>
                    {loggedIn ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant='outline'>{data.user?.name}</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                                <DropdownMenuItem asChild>
                                    <Link href='/account'>Account Settings</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button variant={'link'} onClick={() => signIn('keycloak', { callbackUrl: '/' })}>
                            Login
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
