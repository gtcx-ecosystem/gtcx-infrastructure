import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['node_modules/', 'dist/', 'build/', '.turbo/', 'coverage/'],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // Node.js globals (console, Buffer, process, crypto, fetch, TextEncoder, etc.)
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // Import plugin
  {
    plugins: {
      'import-x': importX,
    },
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // Project rules
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },

  // Override for infrastructure scripts — allow console
  {
    files: ['infra/**/scripts/**/*.js', 'infra/**/scripts/**/*.mjs', 'tools/scripts/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Override for k6 load tests — allow k6 globals
  {
    files: ['tools/load-tests/**/*.js'],
    languageOptions: {
      globals: {
        __ENV: 'readonly',
        __VU: 'readonly',
        __ITER: 'readonly',
      },
    },
  },

  // Prettier must be last — disables conflicting rules
  prettier,
);
