import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import jsdoc from 'eslint-plugin-jsdoc';

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
        ],
    },
    { files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
    { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.browser } },
    {
        files: ['src/app/api/**/*.{js,ts}'],
        plugins: {
            jsdoc,
        },
        rules: {
            'jsdoc/no-missing-syntax': [
                'error',
                {
                    contexts: [
                        {
                            comment: 'JsdocBlock:has(JsdocTag[tag=swagger])',
                            context: 'any',
                            message:
                                '@swagger documentation is required on each API. Check this out for syntax info: https://github.com/jellydn/next-swagger-doc',
                        },
                    ],
                },
            ],
        },
    },
    {
        rules: {
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
        },
    },
    js.configs.recommended,
    tseslint.configs.recommended,
]);
