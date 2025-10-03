import Link from 'next/link';
import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PAGE_ROUTES } from '@/lib/pageRoutes';

export default function AccountPage() {
    return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-2xl font-bold'>Account Management</h1>
            <div className='w-full max-w-md space-y-4'>
                <Link href={PAGE_ROUTES.account.skillsAssessment.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Skills Assessment
                    </Button>
                </Link>
            </div>
        </div>
    );
}
