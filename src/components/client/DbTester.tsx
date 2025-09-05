'use client';

import { useState } from 'react';

interface TestResult {
    message: string;
    time: string;
    version: string;
}

interface TestError {
    error: string;
    details: string;
}

export default function DatabaseTester() {
    const [loading, setLoading] = useState<boolean>(false);
    const [result, setResult] = useState<TestResult | null>(null);
    const [error, setError] = useState<TestError | null>(null);

    const testConnection = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/test-connection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                setResult(data as TestResult);
            } else {
                setError(data as TestError);
            }
        } catch (err) {
            setError({
                error: 'Network error',
                details: err instanceof Error ? err.message : 'Unknown error',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h2>Database Connection Tester</h2>
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
                    <p>Database time: {new Date(result.time).toLocaleString()}</p>
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
