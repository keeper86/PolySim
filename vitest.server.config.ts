import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        include: ['src/server/**/*.test.ts'],
        environment: 'node',
        env: {
            NODE_ENV: 'test',
        },
        setupFiles: ['./tests/vitest/setupTestcontainer.ts'],
        globals: true,
        typecheck: {
            tsconfig: './tsconfig.json',
        },
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/tests/e2e/**',
        ],
        hookTimeout: 30000,
        sequence: {
            shuffle: false, // Ensure tests run in a predictable order
            concurrent: false, // Run test files sequentially
        },
    },
});
