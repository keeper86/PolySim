import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import pathToAuthStorage from 'tests/e2e/auth.path';

const env = dotenv.config({ path: '.env.example.development' });
dotenvExpand.expand(env);

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 2,
    workers: 1,
    reporter: 'html',
    use: {
        baseURL: process.env.NEXTAUTH_URL || 'SomethingsWrongNoBasePath',
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true,
    },
    timeout: 60000,
    expect: {
        timeout: 10000,
    },
    projects: [
        { name: 'setup', testMatch: '**/auth.setup.ts' },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: pathToAuthStorage,
            },
            dependencies: ['setup'],
        },
        // Uncomment for comprehensive cross-browser testing
        // {
        //     name: 'firefox',
        //     use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //     name: 'webkit',
        //     use: { ...devices['Desktop Safari'] },
        // },
    ],
    webServer: undefined,
});
