const test = require('node:test')
const assert = require('node:assert/strict')

const {
  applyRuntimeBuildMetadata,
  createRuntimeBuildId,
} = require('../dist/lib/xcode/runtimeBuildId')
const {
  manifestSwiftTemplate,
} = require('../dist/lib/xcode/manifestSwiftTemplate')

test('createRuntimeBuildId prefers an explicit build ID', () => {
  assert.equal(
    createRuntimeBuildId('1.8.0', {
      WEBSPATIAL_RUNTIME_BUILD_ID: 'qa-runtime-42',
      GITHUB_SHA: 'abcdef1234567890',
    }),
    'qa-runtime-42',
  )
})

test('createRuntimeBuildId falls back to the platform package version', () => {
  assert.equal(
    createRuntimeBuildId('1.8.0', {
      GITHUB_REF_NAME: '1331/merge',
      GITHUB_SHA: 'abcdef1234567890',
    }),
    'package-1.8.0',
  )
  assert.equal(
    createRuntimeBuildId('2.0.0', {
      GITHUB_REF_NAME: 'stable',
      GITHUB_SHA: '0123456789abcdef',
    }),
    'package-2.0.0',
  )
  assert.equal(createRuntimeBuildId('1.8.0', {}), 'package-1.8.0')
})

test('applyRuntimeBuildMetadata renders all runtime placeholders', () => {
  const rendered = applyRuntimeBuildMetadata(
    manifestSwiftTemplate,
    '1.8.0',
    '1.8.0',
    { WEBSPATIAL_RUNTIME_BUILD_ID: 'pr-1331-abcdef123456' },
  )

  assert.match(rendered, /shellVersion: String = "1\.8\.0"/)
  assert.match(rendered, /sdkVersion: String = "1\.8\.0"/)
  assert.match(rendered, /runtimeBuildId: String = "pr-1331-abcdef123456"/)
  assert.doesNotMatch(
    rendered,
    /WS_SHELL_VERSION|WS_SDK_VERSION|WS_RUNTIME_BUILD_ID/,
  )
})

test('applyRuntimeBuildMetadata escapes Swift string values', () => {
  const rendered = applyRuntimeBuildMetadata(
    manifestSwiftTemplate,
    '1.8.0',
    'sdk"preview',
    { WEBSPATIAL_RUNTIME_BUILD_ID: 'qa\\build\n42' },
  )

  assert.match(rendered, /sdkVersion: String = "sdk\\"preview"/)
  assert.match(rendered, /runtimeBuildId: String = "qa\\\\build\\n42"/)
})
