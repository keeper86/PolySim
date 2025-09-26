'use client';

import DatabaseTester from '../components/client/DbTester';

export default function Home() {
    return (
        <div className='container mx-auto p-4'>
            <h1 className='text-3xl font-bold mb-8 text-center'>PolySim - Event Chain im Web</h1>
            <div className='card bg-base-100 shadow-xl mb-8'>
                <div className='card-body'>
                    <DatabaseTester />
                </div>
            </div>
        </div>
    );
}
