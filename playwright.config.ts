import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'https://polysim',
        trace: 'on-first-retry',
        ignoreHTTPSErrors: true, // For local dev with self-signed certs
        timeout: 30000, // 30 second timeout for individual actions
    },
    // Timeout for each test
    timeout: 60000, // 1 minute per test
    // Expect timeout
    expect: {
        timeout: 10000, // 10 seconds for assertions
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
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
    // Only run if dev server is already running
    webServer: undefined,
});
