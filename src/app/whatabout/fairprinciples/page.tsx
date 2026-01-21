// typescript
import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <main className='p-4'>
            <h1>Whatabout — Fair principles</h1>
            <p>Here will be an introduction to the FAIR principles</p>
            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </main>
    );
}
