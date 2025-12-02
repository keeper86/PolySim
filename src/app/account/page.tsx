'use client';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/appRoutes';
import { useSession } from 'next-auth/react';
import { AvatarUploadDialog } from '@/app/account/AvatarUploadDialog';

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
                <AvatarUploadDialog triggerLabel='Upload Avatar' />
            </div>
        </div>
    );
}
