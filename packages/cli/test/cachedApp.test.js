const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')

const { isCachedAppValid } = require('../dist/lib/utils/history')

const EMPTY_INFO_PLIST =
  'YnBsaXN0MDDQCAAAAAAAAAEBAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAJ'
const INFO_PLIST_WITH_BUNDLE_ID =
  'YnBsaXN0MDDRAQJfEBJDRkJ1bmRsZUlkZW50aWZpZXJfEA9jb20uZXhhbXBsZS5hcHAICyAAAAAAAAABAQAAAAAAAAADAAAAAAAAAAAAAAAAAAAAMg=='

function writeInfoPlist(appPath, bundleId) {
  fs.mkdirSync(appPath, { recursive: true })
  fs.writeFileSync(
    path.join(appPath, 'Info.plist'),
    Buffer.from(
      bundleId ? INFO_PLIST_WITH_BUNDLE_ID : EMPTY_INFO_PLIST,
      'base64',
    ),
  )
}

test('isCachedAppValid accepts an app with the expected bundle ID', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cached-app-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const appPath = path.join(directory, 'Example.app')

  writeInfoPlist(appPath, 'com.example.app')

  assert.equal(isCachedAppValid(appPath, 'com.example.app'), true)
})

test('isCachedAppValid rejects missing, malformed, and mismatched app metadata', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cached-app-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const appPath = path.join(directory, 'Example.app')

  assert.equal(isCachedAppValid(appPath, 'com.example.app'), false)

  writeInfoPlist(appPath)
  assert.equal(isCachedAppValid(appPath, 'com.example.app'), false)

  writeInfoPlist(appPath, 'com.example.app')
  assert.equal(isCachedAppValid(appPath, 'com.example.other'), false)

  fs.writeFileSync(path.join(appPath, 'Info.plist'), 'not a plist')
  assert.equal(isCachedAppValid(appPath, 'com.example.app'), false)
})
