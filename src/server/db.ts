import type { Tables } from '@/types/db_schemas';
import type { Knex } from 'knex';
import knex from 'knex';
import config from '../../knexfile';

const isDevelopment = process.env.NODE_ENV === 'development';

const databaseConfig: Knex.Config = isDevelopment ? config.development : config.production;

export const db = knex<Tables>(databaseConfig);
