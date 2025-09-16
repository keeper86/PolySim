import knex, { Knex } from "knex";

const dbDomain = process.env.NODE_ENV === "production" ? "db" : "localhost";

const databaseConfig: Knex.Config = {
    client: "pg",
    connection: {
        host: dbDomain,
        port: 5432,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
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
        const result = await db.raw("SELECT version()");
        const end = Date.now();
        const time = end - start;
        const version = result.rows[0].version;
        return { success: true, time, version };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
