import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { dirname } from 'path';
import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
});

export default defineConfig([
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        ignores: [
            '.next/**',
            '.env',
            'node_modules',
            'public/**',
            'next.config.js',
            'next-env.d.ts',
            'postcss.config.js',
            'tailwind.config.cjs',
            'playwright**',
        ],
    },
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        plugins: { js },
        extends: ['js/recommended'],
    },
    { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.browser } },
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-floating-promises': 'error',
            'no-unused-vars': ['error'],
            'no-undef': ['warn'],
            'semi': ['warn', 'always'],
            'class-methods-use-this': 'warn',
            'eol-last': ['warn', 'always'],
            'no-unused-expressions': ['error'],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'no-trailing-spaces': ['warn'],
            'no-useless-constructor': 0,
            'no-loop-func': 0,
            'exhaustive-switch': 0,
            'no-case-declarations': 0,
            'no-fallthrough': 0,
            'curly': ['error', 'all'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    js.configs.recommended,
    tseslint.configs.recommended,
]);
