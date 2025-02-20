import * as fs from 'fs'
import {
  BACK_APPICON_DIRECTORY,
  MIDDLE_APPICON_DIRECTORY,
  PROJECT_BUILD_DIRECTORY,
  PROJECT_DIRECTORY,
} from '../resource'
import { join } from 'path'
import { loadJsonFromDisk } from '../resource/load'
import { ImageHelper } from '../resource/imageHelper'
const xcode = require('xcode')
const exportOptionsXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>destination</key>
	<string>export</string>
	<key>method</key>
	<string>BUILDTYPE</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>stripSwiftSymbols</key>
	<true/>
	<key>teamID</key>
	<string>YOURTEAMID</string>
	<key>thinning</key>
	<string>&lt;none&gt;</string>
</dict>
</plist>`

const infoPlistXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLName</key>
			<string>web-spatial</string>
			<key>CFBundleURLSchemes</key>
			<array>
				DEEPLINK
			</array>
		</dict>
	</array>
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
	</dict>
	<key>UIApplicationSceneManifest</key>
	<dict>
		<key>UIApplicationPreferredDefaultSceneSessionRole</key>
		<string>UIWindowSceneSessionRoleApplication</string>
		<key>UIApplicationSupportsMultipleScenes</key>
		<true/>
		<key>UISceneConfigurations</key>
		<dict/>
	</dict>
</dict>
</plist>
`

let useExportOptionsXML = ''

export default class XcodeProject {
  public static async modify(projectPath: string, option: any) {
    let project = xcode.project(projectPath)
    this.fixProjectFunction(project)
    project.parseSync()
    let buildType = 'release-testing'
    useExportOptionsXML = exportOptionsXML
    if (option['buildType']) {
      useExportOptionsXML = exportOptionsXML.replace(
        'BUILDTYPE',
        option['buildType'],
      )
    } else {
      useExportOptionsXML = exportOptionsXML.replace('BUILDTYPE', buildType)
    }
    if (option['teamId']) {
      this.updateTeamId(project, option['teamId'])
    }
    this.updateExportOptions()
    await this.bindIcon(option.icon)
    this.bindManifestInfo(project, option.manifestInfo.json)
    if (option['version']) {
      this.updateVersion(project, option['version'])
    }
    try {
      fs.writeFileSync(projectPath, project.writeSync())
    } catch (error) {
      console.log(error)
    }
  }

  private static fixProjectFunction(project: any) {
    // The original pbxGroupByName method has a bug where the return is null, causing other methods to call. xx directly and report an error
    project.pbxGroupByName = function (name: string) {
      var groups = this.hash.project.objects['PBXGroup'],
        key,
        groupKey
      for (key in groups) {
        // only look for comments
        if (!/_comment$/.test(key)) continue

        if (groups[key] == name) {
          groupKey = key.split(/_comment$/)[0]
          return groups[groupKey]
        }
      }
      // The original method returns null here, causing errors when calling project.pbxGroupByName ("xxx"). xx elsewhere
      return false
    }

    project.updateBuildProperty = function (
      prop: any,
      value: any,
      build: any,
      targetName: any,
    ) {
      let validConfigs = []
      const COMMENT_KEY = /_comment$/

      if (targetName) {
        const target = this.pbxTargetByName(targetName)
        const targetBuildConfigs = target && target.buildConfigurationList

        const xcConfigList = this.pbxXCConfigurationList()

        // Collect the UUID's from the configuration of our target
        for (const configName in xcConfigList) {
          if (
            !COMMENT_KEY.test(configName) &&
            targetBuildConfigs === configName
          ) {
            const buildVariants = xcConfigList[configName].buildConfigurations

            for (const item of buildVariants) {
              validConfigs.push(item.value)
            }

            break
          }
        }
      }

      var configs = this.pbxXCBuildConfigurationSection()
      for (var configName in configs) {
        if (!COMMENT_KEY.test(configName)) {
          if (targetName && !validConfigs.includes(configName)) continue

          var config = configs[configName]
          if (
            ((build && config.name === build) || !build) &&
            config.buildSettings[prop]
          ) {
            config.buildSettings[prop] = value
          }
        }
      }
    }
  }

  private static async bindIcon(icon: any) {
    if (icon) {
      // The application icon of Apple Vision Pro requires at least 2 images, one of which is a completely opaque base image. Therefore, Spatial Web is required to provide the base image, and CLI will generate an additional completely transparent image as the middle layer.
      const iconConfigDirectory = join(
        PROJECT_DIRECTORY,
        BACK_APPICON_DIRECTORY,
      )
      const iconConfigPath = join(iconConfigDirectory, 'Contents.json')
      const iconFileName = 'icon.' + icon.getMIME().replace('image/', '')
      const iconFullPath = join(iconConfigDirectory, iconFileName)

      let iconConfig = await loadJsonFromDisk(iconConfigPath)
      /*
          JSON format for icon configuration in Xcode
          {
              images: [ { filename: 'icon.jpeg', idiom: 'vision', scale: '2x' } ],
              info: { author: 'xcode', version: 1 }
          }
      */
      iconConfig.images[0]['filename'] = iconFileName
      await icon.writeAsync(iconFullPath)
      await fs.writeFileSync(iconConfigPath, JSON.stringify(iconConfig))

      const middleIconConfigDirectory = join(
        PROJECT_DIRECTORY,
        MIDDLE_APPICON_DIRECTORY,
      )
      const middleIconConfigPath = join(
        middleIconConfigDirectory,
        'Contents.json',
      )
      const middleIconFileName = 'icon.png'
      const middleIconFullPath = join(
        middleIconConfigDirectory,
        middleIconFileName,
      )

      let middleConfig = await loadJsonFromDisk(middleIconConfigPath)
      let middleIcon = ImageHelper.createImg(512)
      middleConfig.images[0]['filename'] = middleIconFileName
      await middleIcon.writeAsync(middleIconFullPath)
      await fs.writeFileSync(middleIconConfigPath, JSON.stringify(middleConfig))
    }
  }

  private static updateTeamId(xcodeProject: any, teamId: string) {
    xcodeProject.updateBuildProperty('DEVELOPMENT_TEAM', teamId)
    useExportOptionsXML = useExportOptionsXML.replace('YOURTEAMID', teamId)
  }

  private static updateExportOptions() {
    if (!fs.existsSync(PROJECT_BUILD_DIRECTORY)) {
      fs.mkdirSync(PROJECT_BUILD_DIRECTORY, { recursive: true })
    }
    fs.writeFileSync(
      join(PROJECT_BUILD_DIRECTORY, 'ExportOptions.plist'),
      useExportOptionsXML,
    )
  }

  private static bindManifestInfo(xcodeProject: any, manifest: any) {
    xcodeProject.updateProductName(manifest.name)
    // set PRODUCT_BUNDLE_IDENTIFIER need ""
    xcodeProject.updateBuildProperty(
      'PRODUCT_BUNDLE_IDENTIFIER',
      `"${manifest.id}"`,
    )
    this.updateDeeplink(manifest.protocol_handlers ?? [])
    this.modifySwift(manifest)
  }

  private static updateVersion(xcodeProject: any, version: string) {
    xcodeProject.updateBuildProperty('CURRENT_PROJECT_VERSION', version)
  }

  private static updateDeeplink(deeplinks: Array<any>) {
    let infoPlistPath = join(PROJECT_DIRECTORY, './web-spatial/Info.plist')
    let deeplinkString = ''
    for (let i = 0; i < deeplinks.length; i++) {
      deeplinkString += `<string>${deeplinks[i].protocol}</string>`
    }
    const newInfoPlist = infoPlistXML.replace('DEEPLINK', deeplinkString)
    fs.writeFileSync(infoPlistPath, newInfoPlist)
  }

  private static modifySwift(manifest: any) {
    const manifestSwiftPath = join(
      PROJECT_DIRECTORY,
      './web-spatial/libs/webView/manifest.swift',
    )
    let manifestSwift = fs.readFileSync(manifestSwiftPath, 'utf-8')
    manifestSwift = manifestSwift.replace('START_URL', manifest.start_url)
    manifestSwift = manifestSwift.replace('SCOPE', manifest.scope)
    if (manifest.protocol_handlers) {
      let deeplinkString = ''
      for (let i = 0; i < manifest.protocol_handlers.length; i++) {
        deeplinkString += `PWADeeplinkFormat(protocolValue: "${manifest.protocol_handlers[i].protocol}", urlValue: "${manifest.protocol_handlers[i].url}"),`
      }
      manifestSwift = manifestSwift.replace(
        'PWADeeplinkFormat(protocolValue: "", urlValue: "")',
        deeplinkString,
      )
    }
    fs.writeFileSync(manifestSwiftPath, manifestSwift, 'utf-8')
  }
}
