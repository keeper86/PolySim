'use client';
import { useSession } from 'next-auth/react';
import { Page } from '@/components/client/Page';
import { ProvenanceUploadPage } from '@/app/upload/ProvenanceUploadDialog';

export default function UploadPage() {
    const session = useSession();

    if (session.status !== 'authenticated') {
        return <div>Loading...</div>;
    }

    return (
        <Page title='Upload Provenance Data'>
            <ProvenanceUploadPage />
        </Page>
    );
}
