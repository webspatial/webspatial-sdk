import { execFile, execSync } from 'child_process'
import { PROJECT_EXPORT_DIRECTORY } from '../resource'
import { join } from 'path'
import * as fs from 'fs'
import { clearDir } from '../resource/file'

export default class Xcrun {
  public static async validate(
    path: string,
    key1: string,
    key2: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD().altool()
    cmd.validate(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    const res = execSync(cmd.line)
    return res.toString()
  }
  public static async uploadPackage(
    path: string,
    key1: string,
    key2: string,
    appleId: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD().altool()
    cmd.uploadPackage(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    cmd.appleId(appleId)
    const res = execSync(cmd.line)
    return res.toString()
  }

  public static async uploadApp(
    path: string,
    key1: string,
    key2: string,
    useAccount: boolean,
  ) {
    const cmd = new XcrunCMD().altool()
    cmd.uploadApp(path)
    if (useAccount) {
      cmd.authAccount(key1, key2)
    } else {
      cmd.authApi(key1, key2)
    }
    cmd.platform('visionos')
    const res = execSync(cmd.line)
    return res.toString()
  }

  public static async runWithSimulator(appInfo: any) {
    // find visionOS simulator
    let cmd = new XcrunCMD().simctl()
    cmd.listDevices('Apple Vision Pro')
    const res = execSync(cmd.line)
    const simList = this.parseListDevices(res.toString())
    if (simList.length === 0) {
      throw new Error('no visionOS simulator found')
    }
    let device = simList[0]
    for (let i = 0; i < simList.length; i++) {
      if (simList[i].state === 'Booted') {
        device = simList[i]
        break
      }
    }
    // boot visionOS simulator if not booted
    if (device.state === 'Shutdown') {
      cmd = new XcrunCMD().simctl()
      cmd.boot(device.deviceId)
      execSync(cmd.line)
    }
    // open simulator
    execSync(
      'open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app/',
    )
    // install app
    const appPath = join(PROJECT_EXPORT_DIRECTORY, 'Payload')
    const ipaFile = join(PROJECT_EXPORT_DIRECTORY, `${appInfo.name}.ipa`)
    const zipFile = join(PROJECT_EXPORT_DIRECTORY, `${appInfo.name}.zip`)
    const appFile = join(appPath, `${appInfo.name}.app`)
    try {
      // clear dir
      if (fs.existsSync(appPath)) {
        clearDir(appPath)
      }
      // rename .ipa to .zip
      if (fs.existsSync(ipaFile)) {
        fs.renameSync(ipaFile, zipFile)
      }
      // unzip and find app
      if (fs.existsSync(zipFile)) {
        execSync(`unzip -o ${zipFile} -d ${PROJECT_EXPORT_DIRECTORY}`)
        // install app to simulator
        if (fs.existsSync(appPath) && fs.existsSync(appFile)) {
          cmd = new XcrunCMD().simctl()
          cmd.install(device.deviceId, appFile)
          execSync(cmd.line)
          // launch app
          cmd = new XcrunCMD().simctl()
          cmd.launch(device.deviceId, appInfo.id)
          execSync(cmd.line)
        }
      }
    } catch (e) {}
  }

  private static parseListDevices(devices: string) {
    let res = devices.split('\n')
    let list: any[] = []
    let findIndex = -1
    for (let i = 0; i < res.length; i++) {
      if (res[i].includes('-- visionOS')) {
        findIndex = i // start add visionOS simulator
      } else if (findIndex > 0) {
        if (res[i].includes('-- ')) {
          // end add visionOS simulator
          break
        }
        const info = res[i].split('(')
        const deviceInfo = {
          name: info[0].trim(),
          deviceId: info[1].split(')')[0].trim(),
          state: info[2].split(')')[0].trim(),
        }
        list.push(deviceInfo)
      }
    }
    return list
  }
}

class XcrunCMD {
  public line = 'xcrun'

  public altool() {
    this.line += ' altool'
    return this
  }
  public simctl() {
    this.line += ' simctl'
    return this
  }

  public list() {
    this.line += ' list'
    return this
  }

  public listDevices(device: string) {
    this.line += ` list devices "${device}"`
    return this
  }

  public validate(path: string) {
    this.line += ` --validate-app -f ${path}`
    return this
  }
  public uploadApp(path: string) {
    this.line += ` --upload-app -f ${path}`
    return this
  }

  public uploadPackage(path: string) {
    this.line += ` --upload-package ${path}`
    return this
  }

  public authAccount(username: string, password: string) {
    this.line += ` -u ${username} -p ${password}`
    return this
  }

  public authApi(key: string, issuer: string) {
    this.line += ` --apiKey ${key} --apiIssuer ${issuer}`
    return this
  }

  public appleId(id: string) {
    this.line += ` --apple-id ${id}`
    return this
  }

  public platform(platform: string) {
    this.line += ` -t ${platform}`
    return this
  }

  public version(version: string) {
    this.line += ` --bundle-version ${version}`
    return this
  }

  public verbose() {
    this.line += ` --verbose`
    return this
  }

  public shutdown() {
    this.line += ` shutdown booted`
    return this
  }

  public boot(device: string) {
    this.line += ` boot "${device}"`
    return this
  }

  public install(device: string, path: string) {
    this.line += ` install "${device}" "${path}"`
    return this
  }

  public launch(device: string, packName: string) {
    this.line += ` launch "${device}" "${packName}"`
    return this
  }
}
