#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
const { knex } = require('knex');
const { updateTypes } = require('knex-types');
const configModule = require('../knexfile.js');
const config = configModule?.default ?? configModule;

const env = process.env.NODE_ENV || 'development';
const envConfig = config?.[env] ?? config?.development;

function usageAndExit() {
    console.log('Usage: node ./tools/db_types.cjs <update|check>');
    process.exit(1);
}

const cmd = process.argv[2];
if (!cmd) {
    usageAndExit();
}

if (!envConfig) {
    console.error(`No knex configuration found for environment: ${env}`);
    process.exit(1);
}

console.log(
    `${cmd === 'update' ? 'Updating' : cmd === 'check' ? 'Checking' : 'Running'} database types using knex config for`,
    env,
);

const defaultFilePath = './src/types/db_schemas.ts';
const updateTypeFile = async (filePath = defaultFilePath) => {
    const db = knex(envConfig);
    try {
        await updateTypes(db, { output: filePath });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { execSync } = require('child_process');
        console.log('Formatting generated types.');
        execSync(`npm run format:file -- ${filePath}`, { stdio: 'inherit' });

        console.log('Database types update successfully.');
    } finally {
        await db.destroy();
    }
};

(async () => {
    try {
        if (cmd === 'update' || cmd === 'u') {
            await updateTypeFile();
            process.exit(0);
        }

        if (cmd === 'check' || cmd === 'c') {
            const filePathForCheck = './src/types/expected_db_schemas.ts';
            await updateTypeFile(filePathForCheck);

            const { execSync } = require('child_process');
            const diffOutput = execSync(`diff -u ${filePathForCheck} ${defaultFilePath} || true`, {
                encoding: 'utf-8',
            });
            execSync(`rm ${filePathForCheck}`);

            if (diffOutput.trim().length > 0) {
                console.error('Database types are inconsistent with expected types:');
                console.error(diffOutput);
                process.exit(1);
            }

            console.log('Database types are up-to-date.');

            process.exit(0);
        }

        usageAndExit();
    } catch (err) {
        console.error('Failed to run db types script:', err);
        process.exit(1);
    }
})();
