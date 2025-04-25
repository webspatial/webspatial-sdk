import { execFile, execSync } from 'child_process'
import {
  PROJECT_EXPORT_DIRECTORY,
  PROJECT_BUILD_DIRECTORY,
  PROJECT_DIRECTORY,
} from '../resource'
import { join } from 'path'
import * as fs from 'fs'
import { XcodebuildCMD } from './xcodebuild'
import { clearDir } from '../resource/file'
import { CliLog } from '../utils/utils'

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
    let device = this.findSimulator()
    console.log(`use simulator: ${device.deviceId}`)
    const projectFile = PROJECT_DIRECTORY + '/web-spatial.xcodeproj'
    const testPath = PROJECT_BUILD_DIRECTORY + '/test'
    if (!fs.existsSync(PROJECT_BUILD_DIRECTORY)) {
      fs.mkdirSync(PROJECT_BUILD_DIRECTORY, { recursive: true })
    }
    if (!fs.existsSync(testPath)) {
      fs.mkdirSync(testPath, { recursive: true })
    }
    clearDir(testPath)
    const buildCMD =
      new XcodebuildCMD().project(projectFile).line +
      ` build -scheme web-spatial -destination 'platform=visionOS Simulator,id=${device.deviceId}' -derivedDataPath ${testPath}`
    console.log('start building')
    execSync(buildCMD)
    console.log('build success')
    // launch visionOS simulator
    this.launchSimulator(device)
    // install app
    console.log('installing app')
    this.installApp(testPath, device.deviceId, appInfo.name)
    console.log('install success')
    // launch app
    console.log('launch app')
    this.launchApp(device.deviceId, appInfo.id)
  }

  public static launchWithSimulator(bundleId: string) {
    let device = this.findSimulator()
    console.log(`find simulator: ${device.deviceId}`)
    // launch visionOS simulator
    this.launchSimulator(device)
    // launch app
    console.log('launch app')
    this.launchApp(device.deviceId, bundleId)
  }

  public static async shutdownSimulator() {
    let device = this.findSimulator()
    console.log(`find simulator: ${device.deviceId}`)
    if (device.state !== 'Shutdown') {
      let cmd = new XcrunCMD().simctl()
      cmd.shutdown(device.deviceId)
      execSync(cmd.line)
    } else {
      console.log('simulator is already shutdown')
    }
  }

  private static launchSimulator(device: any) {
    // boot visionOS simulator if not booted
    if (device.state === 'Shutdown') {
      let cmd = new XcrunCMD().simctl()
      cmd.boot(device.deviceId)
      execSync(cmd.line)
      // wait 10s for simulator to boot
      execSync('sleep 10')
    }
    // open simulator
    execSync('open -a Simulator --args -CurrentDeviceUDID ' + device.deviceId)
  }

  private static installApp(path: string, deviceId: string, appName: string) {
    const appFile = join(
      path,
      `Build/Products/Debug-xrsimulator/${appName}.app`,
    )
    let cmd = new XcrunCMD().simctl()
    cmd.install(deviceId, appFile)
    execSync(cmd.line)
  }

  private static launchApp(deviceId: string, bundleId: string) {
    try {
      execSync(new XcrunCMD().simctl().terminate(deviceId, bundleId).line)
    } catch (e) {}
    execSync(new XcrunCMD().simctl().launch(deviceId, bundleId).line)
    this.writeSimulatorRecord(deviceId)
  }

  /*
   * use command to find available destinations for the "web-spatial" scheme
   * command: xcodebuild -showdestinations -scheme web-spatial
   * result like:
   * { platform:visionOS, id:dvtdevice-DVTiOSDevicePlaceholder-xros:placeholder, name:Any visionOS Device }
   * { platform:visionOS Simulator, id:dvtdevice-DVTiOSDeviceSimulatorPlaceholder-xrsimulator:placeholder, name:Any visionOS Simulator Device }
   * { platform:visionOS Simulator, id:8C7AD003-4039-478F-9F94-938876D57817, OS:2.3, name:Apple Vision Pro }
   * { platform:visionOS Simulator, id:3E883774-AFD3-4E0D-884C-FA9B940F8720, OS:2.3, name:WebSpatialSimulator }
   *
   * only uuid deviceId is valid
   */
  private static parseDestinationDevices(devices: string) {
    let res = devices.split('\n')
    const uuidRegex =
      /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/
    let deviceId = ''
    for (let i = 0; i < res.length; i++) {
      if (res[i].includes('platform:visionOS Simulator')) {
        const uuid = res[i].slice(
          res[i].indexOf('id:') + 3,
          res[i].indexOf(', name'),
        )
        if (uuidRegex.test(uuid)) {
          return deviceId
        }
      }
    }
    return deviceId
  }

  /*
   * use command to find available simDevice when create a simulator
   * command: xcrun simctl list devicetypes
   * result like:
   * Apple Watch Series 2 (38mm) (com.apple.CoreSimulator.SimDeviceType.Apple-Watch-Series-2-38mm)
   * Apple Vision Pro (com.apple.CoreSimulator.SimDeviceType.Apple-Vision-Pro)
   *
   * only Apple Vision Pro is valid
   */
  private static parseSupportDevices(devices: string) {
    let res = devices.split('\n')
    for (let i = 0; i < res.length; i++) {
      if (res[i].includes('Apple Vision Pro')) {
        res[i] = res[i].replace('Apple Vision Pro', '').trim()
        res[i] = res[i].replace('(', '')
        res[i] = res[i].replace(')', '')
        return res[i]
      }
    }
    throw new Error(
      'No Apple Vision Pro simulator found! Please go to Xcode to download the Apple Vision Pro simulator',
    )
  }

  /*
   * use command to find available runtime when create a simulator
   * command: xcrun simctl list devicetypes
   * result like:
   * iOS 17.2 (17.2 - 21C62) - com.apple.CoreSimulator.SimRuntime.iOS-17-2
   * visionOS 2.3 (2.3 - 22N895) - com.apple.CoreSimulator.SimRuntime.xrOS-2-3
   *
   * only visionOS is valid
   */
  private static parseSupportRuntimes(runtimes: string) {
    let res = runtimes.split('\n')
    for (let i = 0; i < res.length; i++) {
      if (res[i].includes('visionOS')) {
        return res[i].slice(res[i].indexOf('com')).trim()
      }
    }
    throw new Error(
      'No visionOS rumtime found! Please go to Xcode to download the Apple Vision Pro simulator',
    )
  }

  /*
   * use command to find all sumlators about "Apple Vision Pro"
   * command: xcrun simctl list devices "Apple Vision Pro"
   * result like:
   * == Devices ==
   *   -- iOS 17.2 --
   *   -- visionOS 2.3 --
   *       Apple Vision Pro (8C7AD003-4039-478F-9F94-938876D57817) (Shutdown)
   *       WebSpatialSimulator (C57E4C63-BF38-4E49-B1DC-8F1775A89712) (Shutdown)
   */
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
        if (res[i].length > 0) {
          const info = res[i].split('(')
          const deviceInfo = {
            name: info[0].trim(),
            deviceId: info[1].split(')')[0].trim(),
            state: info[2].split(')')[0].trim(),
          }
          list.push(deviceInfo)
        }
      }
    }
    return list
  }
  // Try to find an available simulator, if not, create one and save the running record for the next time direct use.
  private static findSimulator() {
    // check simulator record
    let device = this.checkSimulatorRecord()
    let res
    if (device.length === 0) {
      // no record, find simulator in project destinations
      res = execSync(
        `cd ${PROJECT_DIRECTORY} && xcodebuild -showdestinations -scheme web-spatial`,
      )
      device = this.parseDestinationDevices(res.toString())
    }
    console.log(`find record: ${device}`)
    let simList = this.listSimulator()
    for (var i = 0; i < simList.length; i++) {
      // check simulator in list
      if (simList[i].deviceId === device) {
        return simList[i]
      }
    }
    // create a simulator
    CliLog.warn('no visionOS simulator found')
    CliLog.warn('try create a visionOS simulator')
    // list support device include Apple Vision Pro
    res = execSync(new XcrunCMD().simctl().listDeviceTypes().line)
    const supportDevice = this.parseSupportDevices(res.toString())
    // list support runtime include visionOS
    res = execSync(new XcrunCMD().simctl().listRuntimes().line)
    const supportRuntime = this.parseSupportRuntimes(res.toString())
    // use device and runtime to create simulator
    CliLog.info(
      `use ${supportDevice} and ${supportRuntime} to create visionOS simulator`,
    )
    res = execSync(
      new XcrunCMD().simctl().create(supportDevice, supportRuntime).line,
    )
    device = res.toString().trim()
    console.log(`create visionOS simulator: ${device}`)
    return {
      name: 'WebSpatial Simulator',
      deviceId: device,
      state: 'Shutdown',
    }
  }

  private static listSimulator() {
    let res = execSync(
      new XcrunCMD().simctl().listDevices('Apple Vision Pro').line,
    )
    return this.parseListDevices(res.toString())
  }

  private static checkSimulatorRecord() {
    let simulatorFile = join(__dirname, '../../simulator_record.txt')
    if (!fs.existsSync(simulatorFile)) {
      fs.writeFileSync(simulatorFile, '')
    }
    return fs.readFileSync(simulatorFile, 'utf-8')
  }

  private static writeSimulatorRecord(deviceId: string) {
    let simulatorFile = join(__dirname, '../../simulator_record.txt')
    if (!fs.existsSync(simulatorFile)) {
      fs.writeFileSync(simulatorFile, '')
    }
    fs.writeFileSync(simulatorFile, deviceId)
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

  public listDeviceTypes() {
    this.line += ` list devicetypes`
    return this
  }

  public listRuntimes() {
    this.line += ` list runtimes`
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

  public create(device: string, runtime: string) {
    this.line += ` create "WebSpatialSimulator" "${device}" "${runtime}"`
    return this
  }

  public shutdown(device: string) {
    this.line += ` shutdown "${device}"`
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

  public terminate(device: string, packName: string) {
    this.line += ` terminate "${device}" "${packName}"`
    return this
  }
}
