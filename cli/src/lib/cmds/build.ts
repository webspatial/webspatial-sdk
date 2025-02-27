import { ParsedArgs } from 'minimist'
import { InitArgs, PWAGenerator } from '../pwa'
import { ResourceManager } from '../resource'
import { XcodeManager } from '../xcode'
import { checkBuildParams, checkStoreParams } from './check'

export async function start(args: ParsedArgs): Promise<any> {
  checkBuildParams(args)
  /**
   * PWA steps
   * 1.  Load manifestion.json
   * 2.  Check the integrity of manifestion.json parameters
   * 3.  Detecting start_url rule
   * 4.  Improve start_url, scope, display, and deeplink configurations
   **/
  console.log('------------------- build start -------------------')
  let manifestInfo = await PWAGenerator.generator(args as unknown as InitArgs)
  /**
   * *Resource steps
   * 1.  If it is a local project, then
   *  A. Check and create project directory
   *  B. Mobile Web Engineering
   * 2.  Generate icon icon
   **/
  if (!manifestInfo.fromNet) {
    // If it is a local project, the project needs to be moved.
    await ResourceManager.moveProjectFrom(args['project'])
    console.log('move web project: ok')
  }
  const icon = await ResourceManager.generateIcon(manifestInfo)
  console.log('generate icon: ok')
  /**
   * Xcode steps
   * 1.  Parse the project
   * 2.  Configure teamId
   * 3.  Bind web project
   * 4.  Configure icon
   * 5.  Configure manifest
   * 6.  Write project
   **/
  await XcodeManager.parseProject({
    icon,
    manifestInfo,
    teamId: args['teamId'],
    version: args['version'],
    buildType: args['buildType'],
  })
  console.log('------------------- build end -------------------')
  return manifestInfo
}

export async function store(args: ParsedArgs): Promise<boolean> {
  checkStoreParams(args)
  /*
    There are two ways to upload ipa to App Store Connect:
    1. Using parameters from the build command, then this command will first archive and export before uploading
    2. Use the name parameter to specify the IPA name, then this command will skip archiving and exporting, and directly find the specified IPA file in the export folder and execute the upload
  */

  let appInfo = { name: 'SpatialWebTest' }
  args['buildType'] = 'app-store-connect'
  if (args['name']) {
    appInfo.name = args['name']
  } else {
    const buildRes = await start(args)
    if (!buildRes) {
      return false
    }
    appInfo.name = buildRes.json.name
  }
  await XcodeManager.upload(args, appInfo)
  return true
}
