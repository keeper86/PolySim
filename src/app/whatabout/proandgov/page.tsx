// typescript
import Link from 'next/link';
import Image from 'next/image';

export default function WhataboutTestPage() {
    return (
        <main className='p-4'>
            <h1>Whatabout — Provenance and Governance</h1>
            <h1>
                <strong>What we want to achieve:</strong>
            </h1>

            <p>
                A (published) research artefact can be assigned a chain of metadata that clarifies how this artefact
                came about. In the best case we have full information to easily reproduce results (even if that would be
                unreasonable in case of too much compute involved). We want to encourage to make simulation code that
                produced published results to be accessible.
            </p>

            <section>
                <p>
                    As a researcher, I want to have a system that make it easy to organize simulation code and data in a
                    convenient way such that all data can be traced back to the version of code that produced the
                    result. It should be easier than managing some arbitrary folder structure.
                </p>
            </section>
            <p>
                <strong>Provenance</strong> is what happened.
                <strong>Governance</strong> ensures it always happens the right way. Provenance should happen by design,
                not by enforcement. The best governance system is the one that users adopt willingly because it
                simplifies their workflow, not because they are required to use it. Convenience drives adoption.
            </p>

            <section>
                <Image
                    src='/images/provenance-poc.png'
                    alt='Whatabout — Provenance and Governance'
                    width={800}
                    height={600}
                    className='w-full max-w-md rounded shadow-md mb-4'
                    priority
                    unoptimized
                />
            </section>

            <Link href='/whatabout' className='text-blue-600'>
                Zurück zu Whatabout
            </Link>
        </main>
    );
}
