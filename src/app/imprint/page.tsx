import Link from 'next/link';
import { APP_ROUTES } from '@/lib/appRoutes';
import { Page } from '@/components/client/Page';

export default function ImprintPage() {
    return (
        <Page title='Imprint'>
            <div className='prose'>
                <p>This is the legal imprint for PolySim.</p>
                <p>
                    Responsible for content: <br />
                    Tobias
                    <br />
                    Email: info@polysim.local
                </p>
                <p>This is a placeholder. Please update with your actual legal information as required by law.</p>
            </div>
            <div className='mt-8'>
                <Link href={APP_ROUTES.root.path} className='btn btn-outline'>
                    Back to Home
                </Link>
            </div>
        </Page>
    );
}
