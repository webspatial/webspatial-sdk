import * as fs from 'fs'
import {
  PROJECT_DIRECTORY,
  PROJECT_BUILD_DIRECTORY,
  PROJECT_EXPORT_DIRECTORY,
} from '../resource'
import XcodeProject from './xcodeproject'
import Xcodebuild from './xcodebuild'
import Xcrun from './xcrun'
import { join } from 'path'

export class XcodeManager {
  public static async parseProject(option: any, isDev: boolean = false) {
    const projectPath =
      PROJECT_DIRECTORY + '/web-spatial.xcodeproj/project.pbxproj'
    await XcodeProject.modify(projectPath, option)
    console.log('write project.pbxproj: ok')
    if (!fs.existsSync(PROJECT_EXPORT_DIRECTORY)) {
      fs.mkdirSync(PROJECT_EXPORT_DIRECTORY, { recursive: true })
    }
    if (!isDev) await Xcodebuild.archive()
  }

  public static async upload(option: any, appInfo: any) {
    if (option['u'] && option['p']) {
      // use username, password
      Xcrun.uploadApp(
        join(PROJECT_EXPORT_DIRECTORY, `${appInfo.name}.ipa`),
        option['u'],
        option['p'],
        true,
      )
    } else if (option['k'] && option['i']) {
      // use apiKey, apiIssuer
      Xcrun.uploadApp(
        join(PROJECT_EXPORT_DIRECTORY, `${appInfo.name}.ipa`),
        option['k'],
        option['i'],
        false,
      )
    }
  }

  public static async runWithSimulator(appInfo: any) {
    await Xcrun.runWithSimulator(appInfo)
  }
}
