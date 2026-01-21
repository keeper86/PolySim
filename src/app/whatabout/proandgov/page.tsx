// typescript
import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <main className='p-4'>
            <h1>Whatabout — Provenance and Governance</h1>
            <p>
                <strong>Provenance</strong> is what happened.
                <strong>Governance</strong> ensures it always happens the right way. Provenance should happen by design,
                not by enforcement. The best governance system is the one that users adopt willingly because it
                simplifies their workflow, not because they are required to use it. Convenience drives adoption.
            </p>
            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </main>
    );
}
