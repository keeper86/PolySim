'use client';
import Link from 'next/link';
import { Brain, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/appRoutes';
import { useSession } from 'next-auth/react';

export default function AccountPage() {
    const session = useSession();

    if (session.status !== 'authenticated') {
        return <div>Loading...</div>;
    }
    return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-2xl font-bold'>Account Management</h1>
            <div className='w-full max-w-md space-y-4'>
                <Link href={APP_ROUTES.account.skillsAssessment.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Skills Assessment
                    </Button>
                </Link>
                <Link href={APP_ROUTES.account.avatar.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Image className='w-4 h-4' aria-label='Avatar' />
                        Avatar
                    </Button>
                </Link>
            </div>
            <div className='w-full max-w-md space-y-4'>{JSON.stringify(session.data)}</div>
        </div>
    );
}
