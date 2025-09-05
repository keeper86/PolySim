import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
    development: {
        client: 'postgresql',
        connection: {
            database: process.env.POSTGRES_DB || 'polysimdb',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },

    production: {
        client: 'postgresql',
        connection: {
            database: process.env.POSTGRES_DB || 'polysimdb',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },
};

export default config;
