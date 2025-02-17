import { join } from 'path'
import {
  configDeeplink,
  configDisplay,
  configId,
  configScope,
  configStartUrl,
} from './config'
import { loadJsonFromNet, loadJsonFromDisk } from '../resource/load'
import { checkIcons, checkManifestJson, checkStartUrl } from './validate'

export interface InitArgs {
  'manifest-url'?: string // remote manifest url
  manifest?: string // local manifest path
  project?: string // local web project path
}

export interface ManifestInfo {
  json: Record<string, any>
  url: string
  fromNet: boolean
}

export class PWAGenerator {
  // Supported display modes for TWA
  static DisplayModes: string[] = ['standalone', 'minimal-ui']

  public static async generator(args: InitArgs): Promise<ManifestInfo> {
    let manifestInfo: ManifestInfo = await this.validate(args)
    console.log('check manifest.json: ok')
    await this.config(manifestInfo)
    console.log('reset manifest.json: ok')
    return manifestInfo
  }

  public static async validate(args: InitArgs): Promise<ManifestInfo> {
    let manifest: Record<string, any> = {}
    let url: string = ''
    let fromNet: boolean = false
    // load manifest.json
    if (args['manifest-url']) {
      url = args['manifest-url']
      fromNet = true
      manifest = await loadJsonFromNet(args['manifest-url'])
    } else if (args['manifest']) {
      url = join(process.cwd(), args['manifest'])
      manifest = await loadJsonFromDisk(args['manifest'])
    }
    // check manifest.json
    checkManifestJson(manifest)
    checkStartUrl(manifest, url, fromNet)
    await checkIcons(manifest, url)
    return {
      json: manifest,
      url,
      fromNet,
    }
  }

  // generate manifest
  public static config(manifestInfo: ManifestInfo) {
    configStartUrl(manifestInfo.json, manifestInfo.url, manifestInfo.fromNet)
    configId(manifestInfo.json)
    configScope(manifestInfo.json, manifestInfo.fromNet)
    configDisplay(manifestInfo.json)
    configDeeplink(manifestInfo.json)
  }
}
