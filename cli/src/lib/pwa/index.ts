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

export interface InitArgs {
  'manifest-url'?: string // remote manifest url
  manifest?: string // local manifest path
  project?: string // local web project path
  base: string // url root
  'bundle-id'?: string // bundle id
}

export interface ManifestInfo {
  json: Record<string, any>
  url: string
  fromNet: boolean
}

export class PWAGenerator {
  // Supported display modes for TWA
  static DisplayModes: string[] = ['standalone', 'minimal-ui']

  public static async generator(
    args: InitArgs,
    isDev: boolean = false,
  ): Promise<ManifestInfo> {
    let manifestInfo: ManifestInfo = await this.validate(args, isDev)
    console.log('check manifest.json: ok')
    await this.config(manifestInfo, args, isDev)
    console.log('reset manifest.json: ok')
    return manifestInfo
  }

  public static async validate(
    args: InitArgs,
    isDev: boolean = false,
  ): Promise<ManifestInfo> {
    let manifest: Record<string, any> = {}
    let url: string = ''
    let fromNet: boolean = false
    // load manifest.json
    if (args['manifest-url']) {
      url = args['manifest-url']
      fromNet = true
      manifest = await loadJsonFromNet(args['manifest-url'])
    } else {
      url = join(process.cwd(), args['manifest'] ?? 'public/manifest.json')
      manifest = await loadJsonFromDisk(url)
    }
    // check manifest.json
    checkManifestJson(manifest)
    var isNetWeb = checkStartUrl(manifest, url, fromNet, isDev)
    if (!isDev) checkId(manifest, args['bundle-id'] ?? '')
    await checkIcons(manifest, url)
    return {
      json: manifest,
      url,
      fromNet: isNetWeb,
    }
  }

  // generate manifest
  public static config(
    manifestInfo: ManifestInfo,
    args: InitArgs,
    isDev: boolean,
  ) {
    configStartUrl(manifestInfo.json, args['base'] ?? '')
    if (!isDev) configId(manifestInfo.json, args['bundle-id'] ?? '')
    configScope(manifestInfo.json)
    configDisplay(manifestInfo.json)
    configDeeplink(manifestInfo.json)
    configMainScene(manifestInfo.json)
  }
}
