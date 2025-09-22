import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { Geist, Geist_Mono } from 'next/font/google';
import { ReactNode } from 'react';
import SessionProviderWrapper from '../components/client/SessionProviderWrapper';
import { authOptions } from './api/auth/[...nextauth]/authOptions';
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
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <SessionProviderWrapper session={session}>{children}</SessionProviderWrapper>
            </body>
        </html>
    );
}
