const js = require('@eslint/js')
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
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: lintedSourceFiles,
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': 'off',
    },
  },
  {
    files: typedSourceFiles,
    languageOptions: {
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
      ecmaVersion: 2020,
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
    rules: {
      'no-empty': 'off',
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['tests/ci-test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  // packages/core: SDK runtime library. Enforce only unused-imports
  // (from the base override); disable historical TS shapes so no source
  // is rewritten.
  {
    files: ['packages/core/src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  // packages/react: React SDK. Conservative adoption -- enforce only
  // unused-imports. React Hooks rules are intentionally NOT enabled to
  // avoid introducing new exhaustive-deps findings. Stale eslint-disable
  // directives are preserved by turning off unused-disable reporting.
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
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    },
  },
)
