import { execFileSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, resolve } from 'path'

export type SimulatorApplication = 'DeviceHub' | 'Simulator'

type OpenApplication = (args: string[]) => void
type FindExecutable = (executable: string) => string
type ApplicationExists = (path: string) => boolean

const openApplication: OpenApplication = args => {
  execFileSync('open', args, { stdio: 'ignore' })
}

const findExecutable: FindExecutable = executable =>
  execFileSync('xcrun', ['--find', executable], {
    encoding: 'utf8',
  }).trim()

export function launchSimulatorApplication(
  deviceId: string,
  open: OpenApplication = openApplication,
  find: FindExecutable = findExecutable,
  exists: ApplicationExists = existsSync,
): SimulatorApplication {
  const developerDirectory = resolve(dirname(find('simctl')), '../..')
  const deviceHubPath = resolve(
    developerDirectory,
    '../Applications/DeviceHub.app',
  )
  if (exists(deviceHubPath)) {
    open([`devices://device/open?id=${encodeURIComponent(deviceId)}`])
    return 'DeviceHub'
  }

  const simulatorPath = resolve(
    developerDirectory,
    'Applications/Simulator.app',
  )
  if (exists(simulatorPath)) {
    open([simulatorPath, '--args', '-CurrentDeviceUDID', deviceId])
    return 'Simulator'
  }

  throw new Error(
    `No simulator application found in the active Xcode installation at ${developerDirectory}`,
  )
}
