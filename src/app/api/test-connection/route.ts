import { NextResponse } from 'next/server';
import { testConnection } from '../../../util/db';
import { getApiDocs } from '../../../util/swagger';

/**
 * @swagger
 * /api/test-connection:
 *   post:
 *     description: Tests the database connection
 *     responses:
 *       200:
 *         description: Database connection successful
 *       500:
 *         description: Database connection failed
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
            return NextResponse.json(
                {
                    error: 'Database connection failed',
                    details: result.error,
                },
                { status: 500 },
            );
        }
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Unexpected error',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 },
        );
    }
}
