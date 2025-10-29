// Load environment variables from .env with variable expansion support
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
const env = dotenv.config();
dotenvExpand.expand(env);

const defaultConfig = (overrideUrl) => ({
    client: 'postgresql',
    connection: {
        connectionString: overrideUrl,
    },
    pool: {
        min: 2,
        max: 10,
    },
    migrations: {
        tableName: 'knex_migrations',
    },
});

const config = {
    development: defaultConfig(
        process.env.DATABASE_URL ||
            `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@localhost:5432/${process.env.POSTGRES_DB}`,
    ),
    production: defaultConfig(process.env.DATABASE_URL),
};

export default config;
