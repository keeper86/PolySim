import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/appRoutes';
import { Brain } from 'lucide-react';
import Link from 'next/link';

export default function FilesPage() {
    return (
        <div className='space-y-4'>
            <h1 className='text-2xl font-bold'>Network visualization demo</h1>
            <div className='w-full max-w-md space-y-4'>
                <Link href={APP_ROUTES.files.visNetworkDemo.path}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Vis-network Visualization Demo
                    </Button>
                </Link>
            </div>
        </div>
    );
}
