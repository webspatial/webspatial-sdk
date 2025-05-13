import { PWAGenerator } from '../pwa'
import { ResourceManager } from '../resource'
import { XcodeManager } from '../xcode'
import { checkBuildParams, checkStoreParams } from './check'
import { launch } from './launch'
import { ManifestInfo, PWAInitArgs } from '../types'
import Xcrun from '../xcode/xcrun'
import CliHistory from '../utils/history'

// build and export ipa
export async function build(args: any) {
  console.log('------------------- parse start -------------------')
  ResourceManager.checkPlatformPath(args['platform'])
  const manifestInfo = await doPwa(args)
  const icon = await doReadyProject(args['project'] ?? 'dist', manifestInfo)
  await doXcode(args, icon, manifestInfo)
  console.log('------------------- parse end -------------------')
  await XcodeManager.build(args['export'])
  return manifestInfo
}

// build and upload ipa to App Store Connect
export async function store(args: any) {
  ResourceManager.checkPlatformPath(args['platform'])
  checkStoreParams(args)
  /*
    There are two ways to upload ipa to App Store Connect:
    1. Using parameters from the build command, then this command will first archive and export before uploading
    2. Use the name parameter to specify the IPA name, then this command will skip archiving and exporting, and directly find the specified IPA file in the export folder and execute the upload
  */
  let appInfo = { name: 'WebSpatialTest' }
  args['buildType'] = 'app-store-connect'
  if (args['name']) {
    appInfo.name = args['name']
  } else {
    const manifestInfo = await build(args)
    appInfo.name = manifestInfo.json.name
  }
  await XcodeManager.upload(args, appInfo)
}

// build and run on simulator
export async function run(args: any) {
  const runCmd = JSON.stringify(args)
  CliHistory.init(runCmd)
  console.log('------------------- parse start -------------------')
  ResourceManager.checkPlatformPath(args['platform'])
  const manifestInfo = await doPwa(args, true)
  CliHistory.recordManifest(manifestInfo.json)
  /*
    If it is an online project, there is no need to worry about project changes, just ensure that the parameters are consistent with the previous time and there is no need to compile again.
    If it is a local project, there is a risk of project changes, so it needs to be compiled again.
    If the --tryWithoutBuild=true parameter is used, it will be judged whether it is the same as the previous command.
    If it is the same, it will be defaulted as already compiled, and the compilation will be skipped and the application will be launched directly.
  */
  if (manifestInfo.fromNet || args['tryWithoutBuild'] === 'true') {
    // If this command is a new command, go through the build process; otherwise, go through the launch process
    console.log('check manifest', CliHistory.checkManifest(manifestInfo.json))
    console.log('check test app is exist', CliHistory.checkTestAppIsExist())
    if (
      CliHistory.checkManifest(manifestInfo.json) &&
      CliHistory.checkTestAppIsExist()
    ) {
      console.log('Same as the previous record')
      await XcodeManager.runWithHistory()
      return
    }
  }
  const icon = await doReadyProject(args['project'] ?? 'dist', manifestInfo)
  await doXcode(args, icon, manifestInfo, true)
  console.log('------------------- parse end -------------------')
  await XcodeManager.runWithSimulator()
}

/**
 * PWA steps
 * 1.  Load manifestion.json
 * 2.  Check the integrity of manifestion.json parameters
 * 3.  Detecting start_url rule
 * 4.  Improve start_url, scope, display, and deeplink configurations
 **/
async function doPwa(args: any, isDev: boolean = false) {
  checkBuildParams(args, isDev)
  return await PWAGenerator.generator(args as unknown as PWAInitArgs, isDev)
}

/**
 * *Resource steps
 * 1.  If it is a local project, then
 *  A. Check and create project directory
 *  B. Mobile Web Engineering
 * 2.  Generate icon icon
 **/
async function doReadyProject(project: any, manifestInfo: ManifestInfo) {
  if (!manifestInfo.fromNet) {
    // If it is a local project, the project needs to be moved.
    await ResourceManager.moveProjectFrom(project)
    console.log('move web project: ok')
  }
  return await ResourceManager.generateIcon(manifestInfo)
}

/**
 * Xcode steps
 * 1.  Parse the project
 * 2.  Configure teamId
 * 3.  Bind web project
 * 4.  Configure icon
 * 5.  Configure manifest
 * 6.  Write project
 **/
async function doXcode(
  args: any,
  icon: any,
  manifestInfo: ManifestInfo,
  isDev: boolean = false,
) {
  await XcodeManager.parseProject(
    {
      icon,
      manifestInfo,
      teamId: args['teamId'],
      version: args['version'],
      buildType: args['buildType'],
      export: args['export'],
    },
    isDev,
  )
}
