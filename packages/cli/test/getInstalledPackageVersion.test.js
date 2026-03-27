const test = require('node:test')
const assert = require('node:assert/strict')

const { getInstalledPackageVersion } = require('../dist/lib/utils/utils')

test('getInstalledPackageVersion: returns semver string for an installed dependency', () => {
  const version = getInstalledPackageVersion('@webspatial/platform-visionos')
  console.log('version:', version)
  assert.equal(typeof version, 'string')
  assert.match(version, /^\d+\.\d+\.\d+/)
})

test('getInstalledPackageVersion: returns null for a missing package', () => {
  const version = getInstalledPackageVersion(
    '@webspatial/__definitely_not_exist__',
  )
  console.log('version:', version)
  assert.equal(version, null)
})
