import * as fs from 'fs'
import { join } from 'path'
import { clearDir, copyDir } from './file'
import { ManifestInfo } from '../types'
import * as Jimp from 'jimp'
import { loadImageFromDisk, loadImageFromNet } from './load'
import { execSync } from 'child_process'
export let PROJECT_DIRECTORY = ''
export let PROJECT_BUILD_DIRECTORY = ''
export let PROJECT_EXPORT_DIRECTORY = ''
export let PROJECT_TEST_DIRECTORY = ''
export const WEB_PROJECT_DIRECTORY = 'web-spatial/static-web'
export const ASSET_DIRECTORY = 'web-spatial/Assets.xcassets'
export const BACK_APPICON_DIRECTORY =
  ASSET_DIRECTORY +
  '/AppIcon.solidimagestack/Back.solidimagestacklayer/Content.imageset'
export const MIDDLE_APPICON_DIRECTORY =
  ASSET_DIRECTORY +
  '/AppIcon.solidimagestack/Middle.solidimagestacklayer/Content.imageset'
export const LOGO_DIRECTORY = ASSET_DIRECTORY + '/logo.imageset'

const supportPlatform = ['visionos']

export class ResourceManager {
  public static async moveProjectFrom(dir: string) {
    // Copy the web project to the static-web directory under the xcode project
    const fromDirectory = join(process.cwd(), dir)
    const targetDirctory = join(PROJECT_DIRECTORY, WEB_PROJECT_DIRECTORY)
    // Ensure `targetDirectory` exists.
    if (!fs.existsSync(targetDirctory)) {
      fs.mkdirSync(targetDirctory, { recursive: true })
    } else {
      // If a directory already exists, clear it first
      clearDir(targetDirctory)
    }
    try {
      copyDir(fromDirectory, targetDirctory)
    } catch (err) {
      console.log(err)
    }
  }

  public static async generateIcon(info: ManifestInfo): Promise<Jimp> {
    const manifestJson = info.json
    const imgUrl = manifestJson.icons[0].src
    const icon = !imgUrl.startsWith('http')
      ? await loadImageFromDisk(imgUrl)
      : await loadImageFromNet(imgUrl)
    icon.resize(1024, 1024)
    return icon
  }

  public static initPlatform(platform: string) {
    this.setupTempPath(platform)
    this.pullPlatformModule(platform)
  }

  public static setupTempPath(platform: string) {
    const usePlatform = platform ?? supportPlatform[0]
    if (!supportPlatform.includes(usePlatform)) {
      throw new Error(
        `not support platform ${usePlatform}, now WebSpatial only support ${supportPlatform.join(',')}`,
      )
    }
    let tempDir = './node_modules/.webspatial-builder-temp'
    let tempPlatformDir = join(tempDir, `platform-${usePlatform}`)
    let tempProjectDir = join(tempPlatformDir, './project')
    let temBuildDir = join(tempPlatformDir, './build')
    let temExportDir = join(tempPlatformDir, './export')
    let temTestDir = join(tempPlatformDir, './test')
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }
    if (!fs.existsSync(tempPlatformDir)) {
      fs.mkdirSync(tempPlatformDir)
    }
    PROJECT_DIRECTORY = tempProjectDir
    PROJECT_BUILD_DIRECTORY = temBuildDir
    PROJECT_EXPORT_DIRECTORY = temExportDir
    PROJECT_TEST_DIRECTORY = temTestDir
  }

  /**
   * @description Check and set the platform path to ensure the existence of the specified platform module.
   * If the module does not exist, it will be installed automatically.
   * Also set the project directory, build directory, and export directory.
   * @param platform The name of the platform to check, defaulting to 'visionos'
   */
  public static pullPlatformModule(platform: string) {
    const usePlatform = platform ?? supportPlatform[0]
    if (!supportPlatform.includes(usePlatform)) {
      throw new Error(
        `not support platform ${usePlatform}, now WebSpatial only support ${supportPlatform.join(',')}`,
      )
    }
    let modulePath = join(
      process.cwd(),
      `node_modules/@webspatial/platform-${usePlatform}`,
    )
    // If the module does not exist in the current working directory, try to get it from the cli directory
    if (!fs.existsSync(modulePath)) {
      modulePath = join(
        __dirname,
        `../../../node_modules/@webspatial/platform-${usePlatform}`,
      )
    }
    const hasModule = fs.existsSync(modulePath)
    // If the module does not exist, execute the npm installation command
    if (!hasModule) {
      execSync(
        `cd ${join(__dirname, '../../../')} && pnpm add @webspatial/platform-${usePlatform}`,
      )
    }
    if (fs.existsSync(PROJECT_DIRECTORY)) {
      execSync(`rm -rf ${PROJECT_DIRECTORY}`)
    }
    if (!fs.existsSync(PROJECT_BUILD_DIRECTORY)) {
      fs.mkdirSync(PROJECT_BUILD_DIRECTORY)
    }
    if (!fs.existsSync(PROJECT_EXPORT_DIRECTORY)) {
      fs.mkdirSync(PROJECT_EXPORT_DIRECTORY)
    }
    if (!fs.existsSync(PROJECT_TEST_DIRECTORY)) {
      fs.mkdirSync(PROJECT_TEST_DIRECTORY)
    }
    fs.mkdirSync(PROJECT_DIRECTORY)
    copyDir(modulePath, PROJECT_DIRECTORY)
  }
}
