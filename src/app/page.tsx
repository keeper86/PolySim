import DatabaseTester from '../components/client/DbTester';

export default function Page() {
    return (
        <>
            <h1 className='text-2xl font-bold mb-4'>Database Connection Test</h1>
            There will be content. Promised.
            <DatabaseTester />
        </>
    );
}
