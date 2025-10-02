import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { authOptions } from './api/auth/[...nextauth]/authOptions';
import { AppSidebar } from '@/components/navigation/appSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { DynamicBreadcrumbs } from '@/components/navigation/dynamicBreadcrumbs';
import SessionProviderWrapper from './SessionProviderWrapper';
import { Toaster } from '../components/ui/sonner';
import './globals.css';
import Footer from '@/app/Footer';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
    display: 'swap',
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
    display: 'swap',
});

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
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <SessionProviderWrapper session={session}>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <header className='flex h-16 shrink-0 items-center gap-2'>
                                <div className='flex items-center gap-2 px-4'>
                                    <SidebarTrigger className='-ml-1' />
                                    <Separator orientation='vertical' className='mr-2 h-4' />
                                    <DynamicBreadcrumbs />
                                </div>
                            </header>
                            <main className='flex-1 p-4 overflow-x-auto break-words'>{children}</main>
                            <Footer />
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
