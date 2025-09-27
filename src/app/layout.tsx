import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { authOptions } from './api/auth/[...nextauth]/authOptions';
import AppSidebar from '../components/client/AppSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../components/ui/sidebar';
import SessionProviderWrapper from '../components/client/SessionProviderWrapper';
import { Toaster } from '../components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
    title: 'PolySim',
    description: 'Playground for data',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang='en'>
            <body
                className={`antialiased min-h-screen bg-background`}
            >
                <SessionProviderWrapper session={session ?? undefined}>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
                                <SidebarTrigger className='-ml-1' />
                                <div className='flex flex-1 items-center gap-2'>
                                    <h1 className='text-lg font-semibold'>PolySim</h1>
                                </div>
                            </header>
                            <main className='flex-1 p-6'>
                                <div className='max-w-4xl mx-auto'>{children}</div>
                            </main>

                            <footer className='border-t p-6 text-center text-sm text-muted-foreground'>
                                <div className='flex flex-col gap-4'>
                                    <nav className='flex justify-center items-center gap-4'>
                                        <a
                                            href='https://github.com/keeper86/PolySim'
                                            target='_blank'
                                            rel='noopener'
                                            className='hover:text-foreground flex items-center gap-2'
                                        >
                                            <Image
                                                src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                                                alt='GitHub'
                                                width={16}
                                                height={16}
                                                className='inline-block'
                                            />
                                            GitHub
                                        </a>
                                        <Link href='/imprint' className='hover:text-foreground'>
                                            Imprint
                                        </Link>
                                        <Link href='/pong' className='hover:text-foreground'>
                                            Pong
                                        </Link>
                                        <Link href='/api-doc' className='hover:text-foreground'>
                                            API Docs
                                        </Link>
                                    </nav>
                                    <p>
                                        &copy; {new Date().getFullYear()} PolySim. All rights reserved.
                                    </p>
                                </div>
                            </footer>
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
