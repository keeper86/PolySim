#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { knex } = require('knex');
const { updateTypes } = require('knex-types');
const configModule = require('../knexfile.js');
const config = configModule?.default ?? configModule;

const env = process.env.NODE_ENV || 'development';
const envConfig = config?.[env] ?? config?.development;

if (!envConfig) {
    console.error(`No knex configuration found for environment: ${env}`);
    process.exit(1);
}

console.log('Updating database types using knex config for', env);

(async () => {
    const db = knex(envConfig);

    try {
        await updateTypes(db, { output: './src/types/db_schemas.ts' });
        console.log('Database types updated successfully.');
        await db.destroy();
        process.exit(0);
    } catch (err) {
        console.error('Failed to update database types:', err);
        try {
            await db.destroy();
        } catch (destroyErr) {
            console.error('Error while destroying db connection:', destroyErr);
        }
        process.exit(1);
    }
})();
