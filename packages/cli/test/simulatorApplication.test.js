const test = require('node:test')
const assert = require('node:assert/strict')

const {
  launchSimulatorApplication,
} = require('../dist/lib/xcode/simulatorApplication')

const deviceId = '8031DFE0-14AB-4F39-A641-DD7143F4D2CB'
const xcode26DeveloperDirectory =
  '/Applications/Xcode-26.app/Contents/Developer'
const xcode27DeveloperDirectory =
  '/Applications/Xcode-27.app/Contents/Developer'

test('launchSimulatorApplication opens Simulator on earlier Xcode', () => {
  const calls = []
  const simulatorPath = `${xcode26DeveloperDirectory}/Applications/Simulator.app`

  const application = launchSimulatorApplication(
    deviceId,
    args => {
      calls.push(args)
    },
    () => `${xcode26DeveloperDirectory}/usr/bin/simctl`,
    path => path === simulatorPath,
  )

  assert.equal(application, 'Simulator')
  assert.deepEqual(calls, [
    [simulatorPath, '--args', '-CurrentDeviceUDID', deviceId],
  ])
})

test('launchSimulatorApplication opens Device Hub from active Xcode 27 when an older Simulator is installed', () => {
  const calls = []
  const deviceHubPath =
    '/Applications/Xcode-27.app/Contents/Applications/DeviceHub.app'

  const application = launchSimulatorApplication(
    deviceId,
    args => {
      calls.push(args)
    },
    () => `${xcode27DeveloperDirectory}/usr/bin/simctl`,
    path => path === deviceHubPath,
  )

  assert.equal(application, 'DeviceHub')
  assert.deepEqual(calls, [[`devices://device/open?id=${deviceId}`]])
})

test('launchSimulatorApplication fails when active Xcode has no simulator UI', () => {
  const calls = []

  assert.throws(
    () =>
      launchSimulatorApplication(
        deviceId,
        args => {
          calls.push(args)
        },
        () => `${xcode27DeveloperDirectory}/usr/bin/simctl`,
        () => false,
      ),
    new RegExp(
      `No simulator application found in the active Xcode installation at ${xcode27DeveloperDirectory}`,
    ),
  )

  assert.deepEqual(calls, [])
})
