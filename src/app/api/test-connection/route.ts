import { NextResponse } from 'next/server';
import { testConnection } from '../../../util/db';
import { getApiDocs } from '../../../util/swagger';

/**
 * @swagger
 * /api/hello:
 *   get:
 *     description: Returns the hello world
 *     responses:
 *       200:
 *         description: Hello World!
 */
export async function POST() {
    try {
        const result = await testConnection();
        const test = getApiDocs();
        console.log(test);
        if (result.success) {
            return NextResponse.json(
                {
                    message: 'Database connection successful',
                    time: result.time,
                    version: result.version,
                },
                { status: 200 },
            );
        } else {
            console.log('connect');
            return NextResponse.json(
                {
                    error: 'Database connection failed',
                    details: result.error,
                },
                { status: 500 },
            );
        }
    } catch (error) {
        console.log('unexpected');
        return NextResponse.json(
            {
                error: 'Unexpected error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
