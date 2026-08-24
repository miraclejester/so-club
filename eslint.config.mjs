import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import hooksPlugin from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
    // 1. Ignore build artifacts and system folders
    {
        ignores: ['.next/*', 'node_modules/*', 'out/*', 'dist/*', 'prisma/generated/*', 'next-env.d.ts'],
    },

    // 2. Core JavaScript and TypeScript configurations
    js.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        extends: [...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },

    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        extends: [tseslint.configs.disableTypeChecked],
    },

    // 3. React, React Hooks, and Next.js setup
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-hooks': hooksPlugin,
            '@next/next': nextPlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        rules: {
            // React Hooks rules
            ...hooksPlugin.configs.recommended.rules,

            // Next.js core rules
            ...nextPlugin.configs.recommended.rules,
            ...nextPlugin.configs['core-web-vitals'].rules,

            // Custom rules adjustments
            '@typescript-eslint/no-unused-vars': ['warn'],
            'react/react-in-jsx-scope': 'off', // Not needed in Next.js
            '@typescript-eslint/no-floating-promises': 'error', // unawaited server actions
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/require-await': 'error',
            'react/no-unescaped-entities': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['@/app/*'],
                            message: 'Components must not import from app/ — move shared types into lib/.',
                        },
                    ],
                },
            ],
        },
    },

    // 4. MUST BE LAST: Integrates Prettier and disables formatting conflicts
    eslintPluginPrettierRecommended
);
