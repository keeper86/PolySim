import { Page } from '@/components/client/Page';
import { Button } from '@/components/ui/button';
import { Brain } from 'lucide-react';
import Link from 'next/link';

export default function FilesPage() {
    return (
        <Page title='Files'>
            <div className='w-full max-w-md space-y-4'>
                <Link href={'/files/vis-network-demo'}>
                    <Button className='w-full justify-start' variant='outline'>
                        <Brain className='w-4 h-4' />
                        Vis-network Visualization Demo
                    </Button>
                </Link>
            </div>
        </Page>
    );
}
