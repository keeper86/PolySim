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
