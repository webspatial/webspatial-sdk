const globals = require('globals')
const reactHooks = require('eslint-plugin-react-hooks')
const reactRefresh = require('eslint-plugin-react-refresh')
const unusedImports = require('eslint-plugin-unused-imports')
const tseslint = require('typescript-eslint')

const typedSourceFiles = ['**/*.{ts,tsx}']
const lintedSourceFiles = ['**/*.{js,jsx,ts,tsx,cjs,mjs}']

module.exports = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.next/**',
      '**/reports/**',
      '**/node_modules/**',
    ],
  },
  {
    files: lintedSourceFiles,
    languageOptions: {
      ecmaVersion: 'latest',
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    files: typedSourceFiles,
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: [
      'apps/test-server/**/*.{ts,tsx}',
      'tests/ci-test/src/**/*.{ts,tsx}',
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: [
      'apps/test-server/*.{js,cjs,mjs}',
      'tests/ci-test/{scripts,test,utils}/**/*.{ts,tsx,js}',
      'tests/ci-test/*.{ts,js}',
      'packages/cli/src/**/*.{ts,js}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
  {
    files: ['packages/cli/src/**/*.{ts,js}'],
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/react/src/**/*.{ts,tsx}'],
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
)
