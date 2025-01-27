import { join } from 'path';
import { configDeeplink, configDisplay, configScope, configStartUrl } from './config';
import { loadJsonFromNet, loadJsonFromDisk } from '../resource/load';
import { checkIcons, checkManifestJson, checkStartUrl } from './validate';

export interface InitArgs {
  'manifest-url'?: string; // manifest服务端地址
  manifest?: string; // manifest本地地址
  project?: string; // 本地工程地址
}

export interface ManifestInfo{
  json: Record<string, any>;
  url: string;
  fromNet: boolean;
}

export class PWAGenerator {
  // Supported display modes for TWA
  static DisplayModes: string[] = ['standalone', 'minimal-ui'];

  public static async generator(args:InitArgs):Promise<ManifestInfo>{
    let manifestInfo:ManifestInfo = await this.validate(args);
    await this.config(manifestInfo);
    return manifestInfo;
  }

  // 校验manifest
  public static async validate(args:InitArgs): Promise<ManifestInfo> {
    let manifest: Record<string, any> = {};
    let url: string = "";
    let fromNet: boolean = false;
    // 拉取manifest.json
    if(args["manifest-url"]){
      url = args["manifest-url"]
      fromNet = true;
      manifest = await loadJsonFromNet(args["manifest-url"]);
    }
    else if(args["manifest"]){
      url = join(process.cwd(), args["manifest"])
      manifest = await loadJsonFromDisk(args["manifest"]);
    }
    // 校验manifest.json
    checkManifestJson(manifest)
    checkStartUrl(manifest, url, fromNet);
    await checkIcons(manifest, url)
    return {
      json: manifest,
      url,
      fromNet
    };
  }

  // 生成配置
  public static config(manifestInfo:ManifestInfo){
    configStartUrl(manifestInfo.json, manifestInfo.url, manifestInfo.fromNet);
    configScope(manifestInfo.json, manifestInfo.fromNet);
    configDisplay(manifestInfo.json);
    configDeeplink(manifestInfo.json)
  }
}