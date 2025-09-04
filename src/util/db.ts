import { Pool } from 'pg';

const databaseUrl = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@db:5432/${process.env.POSTGRES_DB}`
if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}

export const pool = new Pool({
    connectionString: databaseUrl,
});

export async function testConnection() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        return {
            success: true,
            time: result.rows[0].current_time,
            version: result.rows[0].version,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    } finally {
        client.release();
    }
}

export interface QueryResult<T = string> {
    success: boolean;
    data?: T[];
    error?: string;
    rowCount?: number;
}

export async function query<T = string>(text: string, params?: string[]): Promise<QueryResult<T>> {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return {
            success: true,
            data: result.rows,
            rowCount: result.rowCount || undefined,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    } finally {
        client.release();
    }
}
