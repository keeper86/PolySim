import knex, { Knex } from 'knex';

const dbConnectionString =
    process.env.NODE_ENV === 'production'
        ? process.env.DATABASE_URL
        : `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`;

const databaseConfig: Knex.Config = {
    client: 'pg',

    connection: {
        connectionString: dbConnectionString,
    },
    pool: {
        min: 2,
        max: 10,
    },
};

export const db = knex(databaseConfig);

export async function testConnection(): Promise<{
    success: boolean;
    time?: number;
    version?: string;
    error?: string;
}> {
    const start = Date.now();
    try {
        const result = await db.raw('SELECT version()');
        const end = Date.now();
        const time = end - start;
        const version = result.rows[0].version;
        return { success: true, time, version };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
