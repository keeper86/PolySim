import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [react(), tsconfigPaths()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        globals: true,
        typecheck: {
            tsconfig: './tsconfig.json',
        },
        environmentOptions: {
            jsdom: {
                resources: 'usable',
            },
        },
    },
});
