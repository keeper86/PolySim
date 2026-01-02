'use client';
import Link from 'next/link';
import { Brain, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/appRoutes';
import { useSession } from 'next-auth/react';
import { AvatarUploadDialog } from '@/app/account/AvatarUploadDialog';
import { Page } from '@/components/client/Page';

export default function AccountPage() {
    const session = useSession();

    if (session.status !== 'authenticated') {
        return <div>Loading...</div>;
    }

    return (
        <Page title='Account Management'>
            <div className='w-full max-w-md space-y-4 flex flex-col flex-gap-2'>
                <Link href={APP_ROUTES.account.skillsAssessment.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Skills Assessment
                    </Button>
                </Link>

                <Link href={APP_ROUTES.account.pat.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <KeyRound />
                        PAT Management
                    </Button>
                </Link>

                <AvatarUploadDialog triggerLabel='Upload Avatar' />
            </div>
        </Page>
    );
}
