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
            'tools/**',
            'scripts/**',
            'seeds/**',
            'migrations/**',
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
            // use the TypeScript-aware rule instead of the core rule
            'no-unused-vars': 'off',
            'no-undef': ['warn'],
            'semi': ['warn', 'always'],
            'dot-notation': 'off',
            '@typescript-eslint/dot-notation': ['error', { allowKeywords: true }],
            'class-methods-use-this': 'warn',
            'eol-last': ['warn', 'always'],
            'no-unused-expressions': ['error'],
            'no-multiple-empty-lines': ['error', { max: 1 }],
            'no-trailing-spaces': ['warn'],
            'no-useless-constructor': 0,
            'no-loop-func': 0,
            'exhaustive-switch': 0,
            'no-case-declarations': 0,
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    disallowTypeAnnotations: false,
                },
            ],
            'no-fallthrough': 0,
            'curly': ['error', 'all'],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    // ignore unused variables/args/caught errors that start with an underscore
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
        },
    },
    js.configs.recommended,
    tseslint.configs.recommended,
]);
