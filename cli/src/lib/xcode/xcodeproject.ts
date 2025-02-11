import * as fs from 'fs';
import { BACK_APPICON_DIRECTORY, MIDDLE_APPICON_DIRECTORY, PROJECT_BUILD_DIRECTORY, PROJECT_DIRECTORY, PROJECT_EXPORT_DIRECTORY } from '../resource';
import { join } from 'path';
import { loadJsonFromDisk } from '../resource/load';
import { ImageHelper } from '../resource/imageHelper';
const xcode = require("xcode");
const exportOptionsXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>destination</key>
	<string>export</string>
	<key>method</key>
	<string>release-testing</string>
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

export default class XcodeProject{
    public static async modify(projectPath:string, option:any){
        let project = xcode.project(projectPath);
        this.fixProjectFunction(project);
        project.parseSync();
        if(option["teamId"]){
            this.updateTeamId(project, option["teamId"]);
        }
        this.bindWebProject(project);
        await this.bindIcon(option.icon);
        this.bindManifestInfo(project, option.manifestInfo.json);
        try{
            fs.writeFileSync(projectPath, project.writeSync());
        }
        catch(error){
            console.log(error)
        }
    }

    private static fixProjectFunction(project:any){
        // 原pbxGroupByName方法存在bug，return为null，导致其他方法直接调用.xx会报错 
        // The original pbxGroupByName method has a bug where the return is null, causing other methods to call. xx directly and report an error
        project.pbxGroupByName = function(name:string) {
            var groups = this.hash.project.objects['PBXGroup'],
                key, groupKey;
            for (key in groups) {
                // only look for comments
                if (!/_comment$/.test(key)) continue;
        
                if (groups[key] == name) {
                    groupKey = key.split(/_comment$/)[0];
                    return groups[groupKey];
                }
            }
            // 原方法此处返回null，导致其他地方调用project.pbxGroupByName("xxx").xx会报错
            // The original method returns null here, causing errors when calling project.pbxGroupByName ("xxx"). xx elsewhere
            return false;
        }

        project.updateBuildProperty = function(prop:any, value:any, build:any, targetName:any) {
            let validConfigs = [];
            const COMMENT_KEY = /_comment$/
        
            if(targetName) {
                const target = this.pbxTargetByName(targetName);
                const targetBuildConfigs = target && target.buildConfigurationList;
        
                const xcConfigList = this.pbxXCConfigurationList();
        
                // Collect the UUID's from the configuration of our target
                for (const configName in xcConfigList) {
                    if (!COMMENT_KEY.test(configName) && targetBuildConfigs === configName) {
                        const buildVariants = xcConfigList[configName].buildConfigurations;
        
                        for (const item of buildVariants) {
                            validConfigs.push(item.value);
                        }
        
                        break;
                    }
                }
            }
            
            var configs = this.pbxXCBuildConfigurationSection();
            for (var configName in configs) {
                if (!COMMENT_KEY.test(configName)) {
                    if (targetName && !validConfigs.includes(configName)) continue;
        
                    var config = configs[configName];
                    if ( ((build && config.name === build) || (!build)) && config.buildSettings[prop] ) {
                        config.buildSettings[prop] = value;
                    }
                }
            }
        }
    }

    public static bindWebProject(xcodeProject:any){
        const webSpatialKey = xcodeProject.findPBXGroupKey({path:'"web-spatial"'});
        let file = xcodeProject.addResourceFile("web-project", {lastKnownFileType:"folder"})
        xcodeProject.addToPbxGroupType(file, webSpatialKey, "PBXGroup")
        // xcodeProject.removeResourceFile("web-project", {lastKnownFileType:"folder"})
    }

    public static async bindIcon(icon:any){
        if(icon){
            // Apple Vision Pro的应用icon要求必须至少有2张图，其中一张为完全不透明的底图，因此这里要求Spatial Web提供底图，cli会额外生成一张完全透明的图作为中间图层
            // The application icon of Apple Vision Pro requires at least 2 images, one of which is a completely opaque base image. Therefore, Spatial Web is required to provide the base image, and CLI will generate an additional completely transparent image as the middle layer.
            const iconConfigDirectory = join(PROJECT_DIRECTORY, BACK_APPICON_DIRECTORY);
            const iconConfigPath = join(iconConfigDirectory, "Contents.json");
            const iconFileName = "icon." + icon.getMIME().replace("image/", "");
            const iconFullPath = join(iconConfigDirectory, iconFileName);
            
            let iconConfig = await loadJsonFromDisk(iconConfigPath)
            /*
                Xcode中对于icon配置的json格式
                JSON format for icon configuration in Xcode
                {
                    images: [ { filename: 'icon.jpeg', idiom: 'vision', scale: '2x' } ],
                    info: { author: 'xcode', version: 1 }
                }
            */
            iconConfig.images[0]["filename"] = iconFileName;
            await icon.writeAsync(iconFullPath)
            await fs.writeFileSync(iconConfigPath, JSON.stringify(iconConfig));

            const middleIconConfigDirectory = join(PROJECT_DIRECTORY, MIDDLE_APPICON_DIRECTORY);
            const middleIconConfigPath = join(middleIconConfigDirectory, "Contents.json");
            const middleIconFileName = "icon.png";
            const middleIconFullPath = join(middleIconConfigDirectory, middleIconFileName);

            let middleConfig = await loadJsonFromDisk(middleIconConfigPath)
            let middleIcon = ImageHelper.createImg(512);
            middleConfig.images[0]["filename"] = middleIconFileName;
            await middleIcon.writeAsync(middleIconFullPath)
            await fs.writeFileSync(middleIconConfigPath, JSON.stringify(middleConfig));

        }
    }

    public static updateTeamId(xcodeProject:any, teamId:string){
        xcodeProject.updateBuildProperty("DEVELOPMENT_TEAM", teamId)
        const newXml = exportOptionsXML.replace("YOURTEAMID", teamId);
        fs.writeFileSync(join(PROJECT_BUILD_DIRECTORY, "ExportOptions.plist"), newXml);
    }

    public static bindManifestInfo(xcodeProject:any, manifest:any){
        xcodeProject.updateProductName(manifest.name);
        xcodeProject.updateBuildProperty("PRODUCT_BUNDLE_IDENTIFIER", manifest.id);
        // TODO:bind deeplink
    }
}