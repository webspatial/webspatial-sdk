module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@webspatial/core-sdk|puppeteer|puppeteer-core|ws)/)',
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['<rootDir>/tests/setup.js'],
};
