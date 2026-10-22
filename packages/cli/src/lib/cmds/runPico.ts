import { execFile } from 'child_process'
import * as fs from 'fs'
import { join } from 'path'
import { loadJsonFromDisk, loadJsonFromNet } from '../resource/load'

export const DEFAULT_PICO_BASE = 'http://10.0.2.2:5173/'

const PICO_WEB_ROUTER_ACTIVITY =
  'com.picoxr.browser/com.picoxr.webappservice.feature.router.ui.WebRouterActivity'

interface RunPicoArgs {
  base?: string
  manifest?: string
  manifestUrl?: string
}

interface RunPicoDependencies {
  checkPrerequisites: () => Promise<void>
  loadManifest: (args: RunPicoArgs) => Promise<Record<string, any>>
  executeAdbShell: (command: string) => Promise<void>
}

interface ManifestDependencies {
  existsSync: (path: string) => boolean
  loadJsonFromDisk: (path: string) => Promise<Record<string, any>>
  loadJsonFromNet: (url: string) => Promise<Record<string, any>>
}

const defaultManifest = {
  name: 'WebSpatialTest',
  display: 'minimal-ui',
  start_url: '/',
  scope: '/',
}

const defaultManifestDependencies: ManifestDependencies = {
  existsSync: fs.existsSync,
  loadJsonFromDisk: path => loadJsonFromDisk(path),
  loadJsonFromNet: url => loadJsonFromNet(url),
}

export async function loadPicoManifest(
  args: RunPicoArgs,
  dependencies: ManifestDependencies = defaultManifestDependencies,
): Promise<Record<string, any>> {
  if (args.manifest && args.manifestUrl) {
    throw new Error(
      '--manifest and --manifest-url cannot be used at the same time',
    )
  }

  if (args.manifestUrl) {
    return dependencies.loadJsonFromNet(args.manifestUrl)
  }

  if (args.manifest) {
    return dependencies.loadJsonFromDisk(join(process.cwd(), args.manifest))
  }

  const manifestJsonPath = join(process.cwd(), 'public/manifest.json')
  if (dependencies.existsSync(manifestJsonPath)) {
    return dependencies.loadJsonFromDisk(manifestJsonPath)
  }

  const manifestWebmanifestPath = join(
    process.cwd(),
    'public/manifest.webmanifest',
  )
  if (dependencies.existsSync(manifestWebmanifestPath)) {
    return dependencies.loadJsonFromDisk(manifestWebmanifestPath)
  }

  return { ...defaultManifest }
}

export function normalizePicoBase(base: string): string {
  let parsedBase: URL
  try {
    parsedBase = new URL(base)
  } catch {
    throw new Error('--base must be a valid HTTP or HTTPS URL')
  }

  if (!['http:', 'https:'].includes(parsedBase.protocol)) {
    throw new Error('--base must be a valid HTTP or HTTPS URL')
  }
  if (parsedBase.search || parsedBase.hash) {
    throw new Error('--base cannot contain query parameters or a hash')
  }

  if (!parsedBase.pathname.endsWith('/')) {
    parsedBase.pathname += '/'
  }
  return parsedBase.href
}

export function createPicoManifest(
  manifest: Record<string, any>,
  base: string,
): Record<string, any> {
  const icons = manifest.icons
  if (icons !== undefined && !Array.isArray(icons)) {
    throw new Error('The Web Manifest icons property must be an array')
  }

  return {
    ...manifest,
    start_url: base,
    scope: base,
    ...(icons === undefined
      ? {}
      : {
          icons: icons.map((icon: Record<string, any>) => {
            if (!icon || typeof icon.src !== 'string') {
              throw new Error('Each Web Manifest icon must have a string src')
            }
            return {
              ...icon,
              src: new URL(icon.src, base).href,
            }
          }),
        }),
  }
}

function quoteAdbShellArgument(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`
}

export function createPicoLaunchCommand(manifest: Record<string, any>): string {
  return [
    'am start',
    `-n ${PICO_WEB_ROUTER_ACTIVITY}`,
    `--es extra_manifest_json ${quoteAdbShellArgument(JSON.stringify(manifest))}`,
    '--es extra_install_type TEMPORARY',
  ].join(' ')
}

function executeAdb(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('adb', args, (error, stdout, stderr) => {
      if (error) {
        const details = stderr.trim() || error.message
        let message = `ADB failed: ${details}`

        if (error.code === 'ENOENT') {
          message =
            'ADB was not found. Install Android SDK Platform-Tools ' +
            '(https://developer.android.com/tools/releases/platform-tools), ' +
            'add its directory to PATH, and verify that "adb version" works.'
        } else if (error.code === 'EACCES' || error.code === 'EPERM') {
          message =
            'ADB could not be executed. Check the permissions of the adb ' +
            'binary in PATH and verify that "adb version" works.'
        } else if (/unauthorized/i.test(details)) {
          message =
            'The ADB device is unauthorized. Enable USB debugging on your ' +
            'PICO device and accept the debugging authorization prompt, ' +
            'then verify the connection with "adb devices".'
        } else if (/offline/i.test(details)) {
          message =
            'The ADB device is offline. Reconnect your PICO device and ' +
            'restart ADB with "adb kill-server" and "adb start-server", ' +
            'then verify the connection with "adb devices".'
        } else if (/more than one device\/emulator/i.test(details)) {
          message =
            'Multiple ADB devices are connected. Disconnect the other ' +
            'devices or set ANDROID_SERIAL to your PICO device serial ' +
            'from "adb devices", then retry.'
        } else if (
          /no devices\/emulators found|device .* not found/i.test(details)
        ) {
          message =
            'No ADB device was found. Connect your PICO device, enable USB ' +
            'debugging, and verify that it appears in "adb devices". ' +
            'If ANDROID_SERIAL is set, check that it matches the device serial.'
        }

        reject(new Error(message))
        return
      }
      resolve(stdout)
    })
  })
}

export async function checkPicoPrerequisites(): Promise<void> {
  await executeAdb(['version'])
  const state = (await executeAdb(['get-state'])).trim()
  if (state !== 'device') {
    throw new Error(
      `The ADB device is not ready (state: ${state || 'unknown'}). ` +
        'Connect your PICO device, enable USB debugging, and verify ' +
        'that "adb devices" reports its state as "device".',
    )
  }
}

async function executeAdbShell(command: string): Promise<void> {
  await executeAdb(['shell', command])
}

const defaultDependencies: RunPicoDependencies = {
  checkPrerequisites: checkPicoPrerequisites,
  loadManifest: args => loadPicoManifest(args),
  executeAdbShell,
}

export async function runPico(
  args: RunPicoArgs,
  dependencies: RunPicoDependencies = defaultDependencies,
): Promise<void> {
  const base = normalizePicoBase(args.base ?? DEFAULT_PICO_BASE)
  await dependencies.checkPrerequisites()
  const manifest = await dependencies.loadManifest(args)
  const picoManifest = createPicoManifest(manifest, base)

  await dependencies.executeAdbShell(createPicoLaunchCommand(picoManifest))
  console.log(`Launched WebSpatial App on PICO OS 6 from ${base}`)
}
