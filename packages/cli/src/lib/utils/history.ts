import { join } from 'path'
import * as fs from 'fs'
import { HistoryInfo } from '../types'
import { CliLog } from './utils'
import { PROJECT_TEST_DIRECTORY } from '../resource'

/*
  Histoy is used to record information about successful execution of the run command,
  including cmd, manifest, appInfo, simulator.
  The historical record is used to determine whether the current execution is the same as the historical execution.
  If the current execution is the same as the historical execution, the historical record will be used to avoid repeated execution.
  If the current execution is different from the historical execution, the historical record will be overwritten.
*/
export default class CliHistory {
  private static history: HistoryInfo
  private static defaultHistory: HistoryInfo = {
    cmd: '',
    manifest: {},
    appInfo: { name: '', id: '' },
    simulator: '',
  }
  private static record: HistoryInfo = {
    cmd: '',
    manifest: {},
    appInfo: { name: '', id: '' },
    simulator: '',
  }

  /* 
    If history file not exist, create it
    If history file exist, read it
    If history file is empty, use default history
  */
  public static init(cmd: string) {
    let historyFile = join(__dirname, '../../run_history.txt')
    let history = this.defaultHistory
    if (!fs.existsSync(historyFile)) {
      fs.writeFileSync(historyFile, '')
    } else {
      try {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf-8'))
        console.log('Historical records found')
      } catch (e) {
        CliLog.warn('No historical records found')
      }
    }
    this.history = history
    this.record.cmd = cmd
  }

  public static getAppInfoRecord() {
    return this.record.appInfo
  }

  public static getSimulatorRecord() {
    return this.record.simulator
  }

  public static getSimulatorHistory() {
    return this.history.simulator
  }

  public static recordManifest(manifest: Record<string, any>) {
    this.record.manifest = manifest
    this.record.appInfo.name = manifest.name
    this.record.appInfo.id = manifest.id
  }

  public static recordSimulator(simulator: string) {
    this.record.simulator = simulator
  }

  public static checkManifest(manifest: Record<string, any>) {
    return this.compareObjects(this.history.manifest, manifest)
  }

  // Check whether the test app exists
  public static checkTestAppIsExist() {
    const appInfo = this.getAppInfoRecord()
    const appFile = join(
      PROJECT_TEST_DIRECTORY,
      `Build/Products/Debug-xrsimulator/${appInfo.name}.app`,
    )
    console.log(appFile)
    return fs.existsSync(appFile)
  }

  // Compare whether two objects are equal
  private static compareObjects(
    obj1: Record<string, any>,
    obj2: Record<string, any>,
  ): boolean {
    // 1. Check if the number of properties is the same
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)
    if (keys1.length !== keys2.length) {
      return false
    }
    // 2. Deep comparison of each attribute
    for (const key of keys1) {
      const value1 = obj1[key]
      const value2 = obj2[key]
      // Dealing with undefined/null situations
      if (value1 === undefined || value2 === undefined) {
        if (value1 !== value2) return false
        continue
      }
      // Recursive comparison of nested objects
      if (typeof value1 === 'object' && value1 !== null) {
        if (!this.compareObjects(value1, value2)) return false
        continue
      }
      // Basic comparison of primitive types
      if (value1 !== value2) {
        console.log(`Mismatch found at key: ${key}`)
        return false
      }
    }
    return true
  }

  public static checkCommand(cmd: string) {
    return this.history.cmd === cmd
  }

  public static write() {
    let historyFile = join(__dirname, '../../run_history.txt')
    fs.writeFileSync(historyFile, JSON.stringify(this.record))
  }
}
