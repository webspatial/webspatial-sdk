import { InitArgs, PWAGenerator } from '../pwa'
import { ResourceManager } from '../resource'
import { XcodeManager } from '../xcode'
import { checkBuildParams, checkStoreParams } from './check'
import { join } from 'path'
import * as fs from 'fs'
import { launch } from './launch'

export async function build(args: any) {
  ResourceManager.checkPlatformPath(args['platform'])
  await start(args)
}

export async function start(args: any, isDev: boolean = false): Promise<any> {
  checkBuildParams(args, isDev)
  /**
   * PWA steps
   * 1.  Load manifestion.json
   * 2.  Check the integrity of manifestion.json parameters
   * 3.  Detecting start_url rule
   * 4.  Improve start_url, scope, display, and deeplink configurations
   **/
  console.log('------------------- build start -------------------')
  let manifestInfo = await PWAGenerator.generator(
    args as unknown as InitArgs,
    isDev,
  )
  /**
   * *Resource steps
   * 1.  If it is a local project, then
   *  A. Check and create project directory
   *  B. Mobile Web Engineering
   * 2.  Generate icon icon
   **/
  if (!manifestInfo.fromNet) {
    // If it is a local project, the project needs to be moved.
    await ResourceManager.moveProjectFrom(args['project'] ?? 'dist')
    console.log('move web project: ok')
  }
  let icon = await ResourceManager.generateIcon(manifestInfo)
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
  console.log('------------------- build end -------------------')
  return manifestInfo
}

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
    const buildRes = await start(args)
    if (!buildRes) {
      return
    }
    appInfo.name = buildRes.json.name
  }
  await XcodeManager.upload(args, appInfo)
}

// build and run on simulator
export async function run(args: any) {
  let appInfo = { name: 'WebSpatialTest', id: '' }
  ResourceManager.checkPlatformPath(args['platform'])
  let runCmd = JSON.stringify(args)
  // If this command is a new command, go through the build process; otherwise, go through the launch process
  if (!checkRunHistory(runCmd) && args['tryWithoutBuild'] === 'true') {
    console.log('launch without build')
    return launch(args)
  }
  const buildRes = await start(args, true)
  if (!buildRes) {
    return
  }
  appInfo.name = buildRes.json.name
  appInfo.id = buildRes.json.id
  await XcodeManager.runWithSimulator(appInfo)
}

/*
  Every time the run command is executed,
  the current command will be recorded through run_history.txt,
  and when using the --tryWithoutBuild=true parameter,
  it will be judged whether it is the same as the previous command. 
  If it is the same, it will be defaulted as already compiled, 
  and the compilation will be skipped and the application will be launched directly
*/
function checkRunHistory(cmd: string) {
  let historyFile = join(__dirname, '../../run_history.txt')
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, '[]')
  }
  let history
  try {
    history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
    if (!Array.isArray(history)) {
      history = []
    }
  } catch (e) {
    history = []
  }
  let isNew = true
  if (history.length > 0) {
    if (history[history.length - 1].cmd === cmd) {
      isNew = false
    }
  }
  history.push({ cmd: cmd, time: new Date().toLocaleString() })
  fs.writeFileSync(historyFile, JSON.stringify(history))
  return isNew
}
