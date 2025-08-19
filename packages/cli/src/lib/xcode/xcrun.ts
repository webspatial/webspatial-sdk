import { execSync } from 'child_process'
import {
  PROJECT_BUILD_DIRECTORY,
  PROJECT_DIRECTORY,
  PROJECT_TEST_DIRECTORY,
} from '../resource'
import { join } from 'path'
import * as fs from 'fs'
import { XcodebuildCMD } from './xcodebuild'
import { clearDir } from '../resource/file'
import { CliLog } from '../utils/utils'
import CliHistory from '../utils/history'
import { BasicAppInfo, SimulatorInfo } from '../types'

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

  /**
   * @description
   * Find suitable simulator device
   * Attempt to build a testing app
   * Try running the test app on the simulator
   */
  public static async runWithSimulator() {
    let deviceList = this.findSimulator()
    if (!deviceList[0]) {
      deviceList = [this.createSimulator()]
    }
    const recordAppInfo = CliHistory.getAppInfoRecord()
    for (var i = 0; i < deviceList.length; i++) {
      if (this.buildTestApp(deviceList[i].deviceId)) {
        const launchedDeviceId = this.launchWithSimulator(
          recordAppInfo,
          deviceList[i].deviceId,
          false,
        )
        CliHistory.recordSimulator(launchedDeviceId)
        CliHistory.write()
        return
      } else {
        CliLog.error(
          `build failed on ${deviceList[i].deviceId}, try next device`,
        )
      }
    }
    CliLog.error('no simulator available')
  }

  /**
   * @description
   * Attempt to launch the app using information from the history
   */
  public static async runWithHistory() {
    const historyDeviceId = CliHistory.getSimulatorHistory()
    const historyAppInfo = CliHistory.getAppInfoRecord()
    const launchedDeviceId = this.launchWithSimulator(
      historyAppInfo,
      historyDeviceId,
    )
    CliHistory.recordSimulator(launchedDeviceId)
    CliHistory.write()
  }

  /**
   * @description
   * Find a simulator with the given deviceId
   * If no deviceId is provided, find the first available simulator
   * If no simulator is found, create a new simulator
   * @param deviceId The deviceId of the simulator to find, defaulting to the first available simulator
   * @param appInfo
   *  appInfo.name is used for installing applications
   *  appInfo.id is used to launch the application
   * @returns The simulator device uuid
   */
  public static launchWithSimulator(
    appInfo: BasicAppInfo,
    deviceId: string = '',
    needFind: boolean = true,
  ) {
    let device
    if (needFind) {
      device = this.findSimulator(deviceId)[0]
    } else {
      device = this.searchSimulator(deviceId)
    }
    if (!device || device.deviceId === '') {
      device = this.createSimulator()
    }
    console.log(`use simulator: ${device.deviceId}`)
    // launch visionOS simulator
    this.launchSimulator(device)
    try{
      this.terminateApp(device.deviceId, appInfo.id)
    }
    catch{}
    // install app
    console.log('installing app')
    this.installApp(PROJECT_TEST_DIRECTORY, device.deviceId, appInfo.name)
    console.log('install success')
    // launch app
    console.log('launch app')
    this.launchApp(device.deviceId, appInfo.id)
    return device.deviceId
  }

  public static async shutdownSimulator() {
    let device = this.findSimulator()[0]
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

  private static buildTestApp(deviceId: string) {
    const projectFile = PROJECT_DIRECTORY + '/web-spatial.xcodeproj'
    if (!fs.existsSync(PROJECT_BUILD_DIRECTORY)) {
      fs.mkdirSync(PROJECT_BUILD_DIRECTORY, { recursive: true })
    }
    if (!fs.existsSync(PROJECT_TEST_DIRECTORY)) {
      fs.mkdirSync(PROJECT_TEST_DIRECTORY, { recursive: true })
    }
    clearDir(PROJECT_TEST_DIRECTORY)
    const buildCMD =
      new XcodebuildCMD().project(projectFile).line +
      ` build -scheme web-spatial -destination 'platform=visionOS Simulator,id=${deviceId}' -derivedDataPath ${PROJECT_TEST_DIRECTORY}`
    console.log(`---- build start on ${deviceId} ----`)
    try {
      const res = execSync(buildCMD)
      if (res.toString().includes('** BUILD FAILED **')) {
        console.log(res.toString())
        return false
      }
    } catch (e) {
      console.log(e)
      return false
    }
    console.log('------------------- build end -------------------')
    return true
  }

  private static terminateApp(deviceId: string, appId: string) {
    execSync(new XcrunCMD().simctl().terminate(deviceId, appId).line)
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
    execSync(new XcrunCMD().simctl().launch(deviceId, bundleId).line)
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
    let deviceList = []
    for (let i = 0; i < res.length; i++) {
      if (res[i].includes('platform:visionOS Simulator')) {
        const uuid = res[i].slice(
          res[i].indexOf('id:') + 3,
          res[i].indexOf(', name'),
        )
        if (uuidRegex.test(uuid)) {
          deviceList.push(uuid)
          console.log(`find destination device: ${res[i]})`)
        }
      }
    }
    return deviceList
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
    let list: SimulatorInfo[] = []
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
          list.push(this.parseDeviceInfo(res[i]))
        }
      }
    }
    return list
  }

  /*
   * device info like:
   * Apple Vision Pro (8C7AD003-4039-478F-9F94-938876D57817) (Shutdown)
   */
  private static parseDeviceInfo(device: string) {
    const info = device.split('(')
    const deviceInfo = {
      name: info[0].trim(),
      deviceId: info[1].split(')')[0].trim(),
      state: info[2].split(')')[0].trim(),
    }
    return deviceInfo
  }
  // Try to find an available simulator, if not, create one and save the running record for the next time direct use.
  public static findSimulator(deviceId?: string) {
    let device: string[] = [deviceId ?? '']
    const res = execSync(
      `cd ${PROJECT_DIRECTORY} && xcodebuild -showdestinations -scheme web-spatial`,
    )
    const arr = this.parseDestinationDevices(res.toString())
    device = [...device, ...arr]
    let simList = this.listSimulator()
    // Sorting logic: Prioritize the DeviceId in the device array
    simList.sort((a, b) => {
      const aIndex = device.indexOf(a.deviceId)
      const bIndex = device.indexOf(b.deviceId)
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex // All in device, in order of device
      } else if (aIndex !== -1) {
        return -1 // Only 'a' is in the device, 'a' is in the front row
      } else if (bIndex !== -1) {
        return 1 // Only 'b' is in the device, 'b' is in the front row
      }
      return 0 // Neither 'a' nor 'b' is in the device, no change in order
    })
    console.log('find simulators:')
    console.log(simList)
    return simList
  }

  private static searchSimulator(deviceId: string) {
    const cmd =
      new XcrunCMD().simctl().listDevices('Apple Vision Pro').line +
      ` | grep ${deviceId}`
    console.log(cmd)
    let res = execSync(cmd)
    console.log(res.toString())
    return this.parseDeviceInfo(res.toString())
  }

  public static createSimulator() {
    CliLog.warn('no visionOS simulator found')
    CliLog.warn('try create a visionOS simulator')
    // list support device include Apple Vision Pro
    let res = execSync(new XcrunCMD().simctl().listDeviceTypes().line)
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
    const device = res.toString().trim()
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
