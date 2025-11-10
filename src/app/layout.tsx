import Footer from '@/app/Footer';
import { AppSidebar } from '@/components/navigation/appSidebar';
import { DynamicBreadcrumbs } from '@/components/navigation/dynamicBreadcrumbs';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import type { ReactNode } from 'react';
import { Toaster } from '../components/ui/sonner';
import { authOptions } from './api/auth/[...nextauth]/authOptions';
import AppProviders from './AppProviders';
import './globals.css';
import BackToTopButton from '@/components/ui/BackToTopButton';


export const metadata: Metadata = {
    title: 'PolySim',
    description: 'Governance for Provenance',
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    const session = await getServerSession(authOptions);

    return (
        <html lang='en'>
            <body>
                <AppProviders session={session}>
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
                            <main className='flex-1 p-0 sm:p-4 overflow-x-auto break-words'>{children}</main>
                            <Footer />
                        </SidebarInset>
                        <BackToTopButton />
                    </SidebarProvider>
                    <Toaster />
                </AppProviders>
            </body>
        </html>
    );
}
