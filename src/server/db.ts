import type { Knex } from 'knex';
import knex from 'knex';

const dbConnectionString = process.env.DATABASE_URL;

if (process.env.NODE_ENV === 'development') {
    console.log('Running Knex in development mode using DATABASE_URL: ', process.env.NODE_ENV);
}

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
