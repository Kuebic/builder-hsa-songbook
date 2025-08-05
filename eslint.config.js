import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';

export default tseslint.config(
  {
    ignores: [
      'dist', 
      'node_modules', 
      '.git', 
      'dev-dist', 
      '**/*.d.ts',
      'tailwind.config.ts',
      'vitest.config.ts',
      'vite.config.ts',
      'vite.config.server.ts',
      'eslint.config.js',
      '.claude/**',
      'claude/**'
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: { 
      react: { version: '18.3' } 
    },
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // React specific rules
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      
      // General code quality rules
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-unused-vars': 'off', // Using @typescript-eslint/no-unused-vars instead
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      
      // Component size enforcement
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines-per-function': ['warn', {
        max: 150,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
      
      // Code style rules (lighter since we have Prettier)
      'semi': ['error', 'always'],
      'quotes': ['error', 'double', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    files: ['**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        vi: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      // Allow console in tests
      'no-console': 'off',
      // Allow any in test files
      '@typescript-eslint/no-explicit-any': 'off',
      // Test files can be longer
      'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': 'off',
    },
  },
  {
    // Stricter rules for React components
    files: ['client/features/**/components/*.tsx', 'client/components/**/*.tsx'],
    rules: {
      'max-lines': ['error', {
        max: 200,  // Strict limit for component files
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines-per-function': ['warn', {
        max: 100,  // Components should be focused
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true,
      }],
    },
  },
  {
    files: ['server/**/*.{ts,js}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // Allow console in server code
      'no-console': 'off',
      // Server code often needs any for dynamic data
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);