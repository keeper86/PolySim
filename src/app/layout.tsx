import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import { ReactNode } from 'react';
import { authOptions } from './api/auth/[...nextauth]/authOptions';
import Navbar from '../components/client/Navbar';
import SessionProviderWrapper from '../components/client/SessionProviderWrapper';
import { Toaster } from '../components/ui/sonner';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
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
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gradient-to-br from-base-200 via-base-100 to-base-300`}
            >
                <SessionProviderWrapper session={session ?? undefined}>
                    <Navbar />

                    <main className='container mx-auto flex-1 px-2 md:px-6 py-8'>
                        <div className='max-w-4xl mx-auto'>{children}</div>
                    </main>

                    <footer className='footer footer-center p-6 bg-base-100 text-base-content border-t border-base-300 mt-12'>
                        <aside>
                            <span className='flex flex-row justify-between items-center w-full'>
                                <nav className='flex flex-row items-center gap-4 mt-2'>
                                    <a
                                        href='https://github.com/keeper86/PolySim'
                                        target='_blank'
                                        rel='noopener'
                                        className='link link-hover flex items-center gap-2'
                                    >
                                        <Image
                                            src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
                                            alt='GitHub'
                                            width={24}
                                            height={24}
                                            className='inline-block align-middle'
                                        />
                                    </a>
                                    <Link href='/imprint' className='link link-hover flex items-center'>
                                        Imprint
                                    </Link>
                                    <Link href='/pong' className='link link-hover flex items-center'>
                                        Pong
                                    </Link>
                                    <Link href='/api-doc' className='link link-hover flex items-center'>
                                        API Docs
                                    </Link>
                                </nav>
                                <p className='text-sm opacity-80'>
                                    &copy; {new Date().getFullYear()} PolySim. All rights reserved.
                                </p>
                            </span>
                        </aside>
                    </footer>
                    <Toaster />
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
