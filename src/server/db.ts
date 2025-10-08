import type { Knex } from 'knex';
import knex from 'knex';
import config from '../../knexfile';

const databaseConfig: Knex.Config = config.development;
export const db = knex(databaseConfig);
