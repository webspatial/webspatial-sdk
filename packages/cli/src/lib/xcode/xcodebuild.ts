import * as fs from 'fs'
import { join } from 'path'
import {
  PROJECT_DIRECTORY,
  PROJECT_BUILD_DIRECTORY,
  PROJECT_EXPORT_DIRECTORY,
} from '../resource'
import { clean } from 'semver'
import { copyDir } from '../resource/file'

const { execSync, exec } = require('child_process')

export default class Xcodebuild {
  static async project() {
    try {
      await new Promise((resolve, reject) => {
        const projectFile = PROJECT_DIRECTORY + '/web-spatial.xcodeproj'
        const execRes = execSync(
          new XcodebuildCMD().project(projectFile).list().line,
        )
        console.log(execRes.toString())
        resolve(execRes)
      })
    } catch (error) {
      console.log(error)
    }
  }

  static async list() {
    try {
      await new Promise((resolve, reject) => {
        const projectFile = PROJECT_DIRECTORY + '/web-spatial.xcodeproj'
        const execRes = execSync(
          new XcodebuildCMD().project(projectFile).list().line,
        )
        console.log(execRes.toString())
        resolve(execRes)
      })
    } catch (error) {
      console.log(error)
    }
  }

  static async archive(exportPath: string) {
    try {
      console.log('start archive')
      if (!fs.existsSync(PROJECT_EXPORT_DIRECTORY)) {
        fs.mkdirSync(PROJECT_EXPORT_DIRECTORY, { recursive: true })
      }
      return await new Promise((resolve, reject) => {
        const projectFile = PROJECT_DIRECTORY + '/web-spatial.xcodeproj'
        // Archive
        const archiveRes = execSync(
          new XcodebuildCMD()
            .project(projectFile)
            .scheme('web-spatial')
            .archive(join(PROJECT_BUILD_DIRECTORY, './pack'))
            .clean().line,
        )
        let resString = archiveRes.toString()
        if (resString.indexOf('ARCHIVE SUCCEEDED') > 0) {
          console.log(
            '------------------- ARCHIVE SUCCEEDED -------------------',
          )
          console.log('start export')
          // Export
          const outRes = execSync(
            new XcodebuildCMD()
              .output(
                join(PROJECT_BUILD_DIRECTORY, 'pack.xcarchive'),
                PROJECT_EXPORT_DIRECTORY,
                join(PROJECT_BUILD_DIRECTORY, 'ExportOptions.plist'),
              )
              .allowProvisioningUpdates().line,
          )
          resString = outRes.toString()
          if (resString.indexOf('EXPORT SUCCEEDED') > 0) {
            // copy .ipa file to export path
            const useExportPath = exportPath ?? './build'
            const path = join(process.cwd(), useExportPath)
            if (!fs.existsSync(path)) {
              fs.mkdirSync(path, { recursive: true })
            }
            copyDir(PROJECT_EXPORT_DIRECTORY, path)
            console.log(
              '------------------- EXPORT SUCCEEDED -------------------',
            )
            resolve(true)
          }
          clean(PROJECT_BUILD_DIRECTORY)
        }
        resolve(false)
      })
    } catch (error) {
      console.log(error)
    }
  }
}

export class XcodebuildCMD {
  public line = 'xcodebuild'
  public project(xcodeproj: string) {
    this.line += ` -project ${xcodeproj}`
    return this
  }

  public list() {
    this.line += ' -list'
    return this
  }

  public scheme(schemeName: string) {
    this.line += ` -scheme ${schemeName}`
    return this
  }

  public archive(path: string) {
    this.line += ` -archivePath ${path} archive`
    return this
  }

  public allowProvisioningUpdates() {
    this.line += ' -allowProvisioningUpdates'
    return this
  }

  public destination(target: string) {
    this.line += ` -destination '${target}'`
    return this
  }

  public output(archivePath: string, outPath: string, plistPath: string) {
    this.line += ` -exportArchive -archivePath ${archivePath} -exportPath ${outPath} -exportOptionsPlist ${plistPath}`
    return this
  }

  public clean() {
    this.line += ' clean'
    return this
  }
}
