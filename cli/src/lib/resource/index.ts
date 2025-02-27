import * as fs from 'fs'
import { join } from 'path'
import { clearDir, copyDir } from './file'
import { ManifestInfo } from '../pwa'
import * as Jimp from 'jimp'
import { loadImageFromDisk, loadImageFromNet } from './load'
export const PROJECT_DIRECTORY = join(process.cwd(), '../builder/visionOSApp')
export const PROJECT_BUILD_DIRECTORY = join(PROJECT_DIRECTORY, './build')
export const PROJECT_EXPORT_DIRECTORY = join(PROJECT_DIRECTORY, './export')
export const WEB_PROJECT_DIRECTORY = 'web-spatial/static-web'
export const ASSET_DIRECTORY = 'web-spatial/Assets.xcassets'
export const BACK_APPICON_DIRECTORY =
  ASSET_DIRECTORY +
  '/AppIcon.solidimagestack/Back.solidimagestacklayer/Content.imageset'
export const MIDDLE_APPICON_DIRECTORY =
  ASSET_DIRECTORY +
  '/AppIcon.solidimagestack/Middle.solidimagestacklayer/Content.imageset'

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
    return icon
  }
}
