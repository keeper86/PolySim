// typescript
import Link from 'next/link';

export default function WhataboutTestPage() {
    return (
        <main className='p-4'>
            <h1>Whatabout — Test</h1>
            <p>Das ist die Test-Subpage unter /whatabout/test</p>
            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </main>
    );
}
