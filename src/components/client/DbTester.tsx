'use client';

import { useState } from 'react';
import { clientLogger } from '../../app/clientLogger';
import { trpc } from '../../app/clientTrpc';
import { useSession } from 'next-auth/react';

interface TestResult {
    message: string;
    time?: number | undefined;
    version?: string | undefined;
}

interface TestError {
    error: string;
    details?: string | undefined;
}

const log = clientLogger.child('DbTester');

export default function DatabaseTester() {
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [error, setError] = useState<TestError | null>(null);

    const session = useSession();

    const testConnection = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        const response = await trpc['test-connection'].query();

        if ('error' in response) {
            log.error('Database connection failed', response);
            setError(response);
        } else {
            log.info('Database connection successful', response);
            setResult(response);
        }

        setLoading(false);
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Database Connection Tester</h2>
            <div>{JSON.stringify(session, null, 2)}</div>
            <button
                onClick={testConnection}
                disabled={loading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                }}
            >
                {loading ? 'Testing...' : 'Test Database Connection'}
            </button>

            {result && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: '5px',
                    }}
                >
                    <h3 style={{ color: '#52c41a' }}>Success!</h3>
                    <p>{result.message}</p>
                    <p>Database time: {new Date(result.time ?? 0).toLocaleString()}</p>
                    <p>Version: {result.version}</p>
                </div>
            )}

            {error && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        backgroundColor: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: '5px',
                    }}
                >
                    <h3 style={{ color: '#ff4d4f' }}>Error</h3>
                    <p>
                        <strong>{error.error}:</strong> {error.details}
                    </p>
                </div>
            )}
        </div>
    );
}
