import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/appRoutes';
import { Brain } from 'lucide-react';
import Link from 'next/link';
import { Page } from '@/components/client/Page';

export default function FilesPage() {
    return (
        <Page title='Files'>
            <div className='w-full max-w-md space-y-4'>
                <Link href={APP_ROUTES.files.visNetworkDemo.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Vis-network Visualization Demo
                    </Button>
                </Link>
            </div>
        </Page>
    );
}
