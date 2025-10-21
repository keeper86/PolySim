import type { Tables } from '@/types/db_schemas';
import type { Knex } from 'knex';
import knex from 'knex';
import config from '../../knexfile';

const isDevelopment = process.env.NODE_ENV === 'development';

const databaseConfig: Knex.Config = isDevelopment ? config.development : config.production;

export const db = knex(databaseConfig) as {
    <T extends keyof Tables | `${string} as ${string}`>(
        tableName: T,
    ): Knex.QueryBuilder<
        T extends `${infer U} as ${string}`
            ? U extends keyof Tables
                ? Tables[U]
                : Record<string, unknown>
            : T extends keyof Tables
              ? Tables[T]
              : Record<string, unknown>,
        (T extends `${infer U} as ${string}`
            ? U extends keyof Tables
                ? Tables[U]
                : Record<string, unknown>
            : T extends keyof Tables
              ? Tables[T]
              : Record<string, unknown>)[]
    >;
};
