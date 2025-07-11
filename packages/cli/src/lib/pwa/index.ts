import { join } from 'path'
import {
  configDeeplink,
  configDisplay,
  configId,
  configMainScene,
  configScope,
  configStartUrl,
} from './config'
import { loadJsonFromNet, loadJsonFromDisk } from '../resource/load'
import {
  checkIcons,
  checkId,
  checkManifestJson,
  checkStartUrl,
} from './validate'
import * as fs from 'fs'
import { CliLog } from '../utils/utils'
import { ManifestInfo, PWAInitArgs } from '../types'

export class PWAGenerator {
  // Supported display modes for TWA
  static DisplayModes: string[] = ['standalone', 'minimal-ui']

  private static defaultBundleId = 'com.webspatial.test'
  private static defaultManifestJson = {
    name: 'WebSpatialTest',
    display: 'minimal-ui',
    start_url: '/',
    scope: '/',
  }

  private static useDefaultManifestJson = false

  public static async generator(
    args: PWAInitArgs,
    isDev: boolean = false,
  ): Promise<ManifestInfo> {
    let manifestInfo: ManifestInfo = await this.validate(args, isDev)
    console.log('check manifest.json: ok')
    await this.config(manifestInfo, args, isDev)
    console.log('reset manifest.json: ok')
    return manifestInfo
  }

  public static async validate(
    args: PWAInitArgs,
    isDev: boolean = false,
  ): Promise<ManifestInfo> {
    let manifest: Record<string, any> = {}
    let url: string = ''
    let fromNet: boolean = false
    let useDefault = false
    // load manifest.json
    if (args['manifestUrl']) {
      url = args['manifestUrl']
      fromNet = true
      manifest = await loadJsonFromNet(args['manifestUrl'])
    } else {
      if (args['manifest']) {
        url = join(process.cwd(), args['manifest'])
      } else {
        url = join(process.cwd(), 'public/manifest.json')
        if (!fs.existsSync(url)) {
          url = join(process.cwd(), 'public/manifest.webmanifest')
        }
      }
      if (!fs.existsSync(url)) {
        if (isDev) {
          useDefault = true
          CliLog.warn(
            'manifest.json or manifest.webmanifest not found, use default in run mode',
          )
        } else {
          throw new Error('manifest.json or manifest.webmanifest not found')
        }
      }
      manifest = useDefault
        ? this.defaultManifestJson
        : await loadJsonFromDisk(url)
      manifest =
        isDev && !useDefault ? this.compareManifest(manifest) : manifest
      this.useDefaultManifestJson = useDefault
    }
    // check manifest.json
    checkManifestJson(manifest, isDev)
    let start_url = configStartUrl(manifest, args['base'] ?? '', url, fromNet)
    var isNetWeb = checkStartUrl(start_url, url, fromNet, isDev)
    manifest.start_url = start_url
    if (!isDev) checkId(manifest, args['bundleId'] ?? '')
    await checkIcons(manifest, url, isDev)
    return {
      json: manifest,
      url,
      fromNet: isNetWeb,
    }
  }

  private static compareManifest(manifest: Record<string, any>) {
    manifest.name = manifest.name ?? this.defaultManifestJson.name
    manifest.display = manifest.display ?? this.defaultManifestJson.display
    manifest.start_url =
      manifest.start_url ?? this.defaultManifestJson.start_url
    manifest.scope = manifest.scope ?? this.defaultManifestJson.scope
    return manifest
  }

  // generate manifest
  public static config(
    manifestInfo: ManifestInfo,
    args: PWAInitArgs,
    isDev: boolean,
  ) {
    let bundleId = args['bundleId'] ?? ''
    if (isDev && !manifestInfo.json.id) {
      bundleId = this.defaultBundleId
    }
    configId(manifestInfo.json, bundleId)
    configScope(manifestInfo.json)
    configDisplay(manifestInfo.json)
    configDeeplink(manifestInfo.json)
    configMainScene(manifestInfo.json)
  }
}
