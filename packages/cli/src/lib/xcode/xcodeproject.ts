import * as fs from 'fs'
import {
  BACK_APPICON_DIRECTORY,
  LOGO_DIRECTORY,
  MIDDLE_APPICON_DIRECTORY,
  PROJECT_BUILD_DIRECTORY,
  PROJECT_DIRECTORY,
} from '../resource'
import { join } from 'path'
import { loadJsonFromDisk } from '../resource/load'
import { ImageHelper } from '../resource/imageHelper'
import { manifestSwiftTemplate } from './manifestSwiftTemplate'
import { SpatialSceneType } from '../utils/sceneUtils'
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
		<string>SCENE_SESSION_ROLE</string>
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
  public static async modify(
    projectPath: string,
    option: any,
    isDev: boolean = false,
  ) {
    let project = xcode.project(projectPath)
    this.fixProjectFunction(project)
    project.parseSync()
    let buildType = option['buildType']
    const buildTypeOptions = [
      'release-testing',
      'app-store-connect',
      'debugging',
      'enterprise',
    ]
    useExportOptionsXML = exportOptionsXML.replace(
      'BUILDTYPE',
      buildTypeOptions.includes(buildType) ? buildType : 'release-testing',
    )
    if (option['teamId']) {
      this.updateTeamId(project, option['teamId'])
    }
    this.updateExportOptions()
    if (option.icon) await this.bindIcon(option.icon)
    await this.bindManifestInfo(project, option.manifestInfo.json, isDev)
    if (option['version']) {
      this.updateVersion(project, option['version'])
    } else {
      this.updateVersion(project, '1.0')
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

      const logoConfigDirectory = join(PROJECT_DIRECTORY, LOGO_DIRECTORY)
      const logoConfigPath = join(logoConfigDirectory, 'Contents.json')
      let logoConfig = await loadJsonFromDisk(logoConfigPath)
      const logoFileName = 'logo.' + icon.getMIME().replace('image/', '')
      const logoFullPath = join(logoConfigDirectory, logoFileName)
      logoConfig.images[0]['filename'] = logoFileName
      await icon.writeAsync(logoFullPath)
      await fs.writeFileSync(logoConfigPath, JSON.stringify(logoConfig))
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

  private static async bindManifestInfo(
    xcodeProject: any,
    manifest: any,
    isDev: boolean = false,
  ) {
    xcodeProject.updateProductName(manifest.name)
    // set PRODUCT_BUNDLE_IDENTIFIER need ""
    if (manifest.id) {
      xcodeProject.updateBuildProperty(
        'PRODUCT_BUNDLE_IDENTIFIER',
        `"${manifest.id}"`,
      )
    }
    let tempInfoPlistXML = infoPlistXML.slice() // clone
    tempInfoPlistXML = this.updateDeeplink(
      manifest.protocol_handlers ?? [],
      tempInfoPlistXML,
    )
    tempInfoPlistXML = this.updateSceneType(
      manifest.xr_main_scene?.type,
      tempInfoPlistXML,
    )
    this.writeInfoPlist(tempInfoPlistXML)
    await this.modifySwift(manifest)
  }

  private static updateVersion(xcodeProject: any, version: string) {
    xcodeProject.updateBuildProperty('CURRENT_PROJECT_VERSION', version)
  }

  private static writeInfoPlist(infoPlistXML: string) {
    const infoPlistPath = join(PROJECT_DIRECTORY, './web-spatial/Info.plist')
    fs.writeFileSync(infoPlistPath, infoPlistXML)
  }

  private static updateSceneType(
    sceneType: SpatialSceneType,
    infoPlistXML: string,
  ): string {
    let sceneSessionRole = 'UIWindowSceneSessionRoleApplication'
    if (sceneType === 'volume') {
      sceneSessionRole = 'UIWindowSceneSessionRoleVolumetricApplication'
    }
    infoPlistXML = infoPlistXML.replace('SCENE_SESSION_ROLE', sceneSessionRole)
    return infoPlistXML
  }

  private static updateDeeplink(
    deeplinks: Array<any>,
    infoPlistXML: string,
  ): string {
    let deeplinkString = ''
    for (let i = 0; i < deeplinks.length; i++) {
      deeplinkString += `<string>${deeplinks[i].protocol}</string>`
    }
    const newInfoPlist = infoPlistXML.replace('DEEPLINK', deeplinkString)
    return newInfoPlist
  }

  private static async modifySwift(manifest: any) {
    const manifestSwiftPath = join(
      PROJECT_DIRECTORY,
      './web-spatial/manifest.swift',
    )
    const xcodePackageJsonPath = join(PROJECT_DIRECTORY, 'package.json')
    const packageJson = await loadJsonFromDisk(xcodePackageJsonPath)
    let manifestSwift = manifestSwiftTemplate
    manifestSwift = manifestSwift.replace(
      'PACKAGE_VERSION',
      packageJson.version ?? '0.0.0',
    )
    manifestSwift = manifestSwift.replace('START_URL', manifest.start_url)
    manifestSwift = manifestSwift.replace('SCOPE', manifest.scope)
    manifestSwift = manifestSwift.replace('AppName', manifest.name)
    manifestSwift = manifestSwift.replace('Description', manifest.description)
    manifestSwift = manifestSwift.replace('AppID', manifest.id)
    manifestSwift = manifestSwift.replace(
      '.minimal',
      manifest.display == 'minimal-ui' ? '.minimal' : `.${manifest.display}`,
    )
    if (manifest.protocol_handlers) {
      let deeplinkString = ''
      for (let i = 0; i < manifest.protocol_handlers.length; i++) {
        deeplinkString += `PWAProtocol(protocolValue: "${manifest.protocol_handlers[i].protocol}", url: "${manifest.protocol_handlers[i].url}"),`
      }
      manifestSwift = manifestSwift.replace(
        'PWAProtocol(protocolValue: "", url: "")',
        deeplinkString,
      )
    }

    manifestSwift = manifestSwift.replace(
      'SceneWidth',
      manifest.xr_main_scene.defaultSize.width,
    )
    manifestSwift = manifestSwift.replace(
      'SceneHeight',
      manifest.xr_main_scene.defaultSize.height,
    )
    manifestSwift = manifestSwift.replace(
      'SceneDepth',
      manifest.xr_main_scene.defaultSize.depth,
    )

    let res = 'nil'
    const resizabilities = ['minWidth', 'minHeight', 'maxWidth', 'maxHeight']
    if (manifest.xr_main_scene.resizability) {
      res = 'ResizeRange('
      for (var i = 0; i < resizabilities.length; i++) {
        if (manifest.xr_main_scene.resizability[resizabilities[i]] >= 0) {
          res += `${resizabilities[i]}: ${manifest.xr_main_scene.resizability[resizabilities[i]]},`
        }
      }
      res = res.substring(0, res.length - 1)
      res += ')'
    }
    manifestSwift = manifestSwift.replace('SceneResizability', res)

    manifestSwift = manifestSwift.replace(
      'SceneType',
      manifest.xr_main_scene.type,
    )
    manifestSwift = manifestSwift.replace(
      'WorldScaling',
      manifest.xr_main_scene.worldScaling,
    )
    manifestSwift = manifestSwift.replace(
      'WorldAlignment',
      manifest.xr_main_scene.worldAlignment,
    )
    manifestSwift = manifestSwift.replace(
      'BaseplateVisibility',
      manifest.xr_main_scene.baseplateVisibility,
    )

    fs.writeFileSync(manifestSwiftPath, manifestSwift, 'utf-8')
  }
}
