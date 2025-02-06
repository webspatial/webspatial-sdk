import * as fs from 'fs';
import { BACK_APPICON_DIRECTORY, MIDDLE_APPICON_DIRECTORY, PROJECT_DIRECTORY, PROJECT_OUT_DIRECTORY } from '../resource';
import { join } from 'path';
import { loadJsonFromDisk } from '../resource/load';
import Xcodebuild from './xcodebuild';
import Jimp = require('jimp');
const xcode = require("xcode");

export class XcodeManager{
    public static async parseProject(option:any){
        const projectPath = PROJECT_DIRECTORY + '/web-spatial.xcodeproj/project.pbxproj'
        let project = xcode.project(projectPath);

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
        project.parseSync();
        console.log("parse xcode project: ok");

        this.bindWebProject(project);
        console.log("bind web project to xcode project: ok");
        await this.bindIcon(option.icon);
        console.log("bind icon to xcode assets: ok")
        // todo
        // this.bindManifestInfo();

        try{
            fs.writeFileSync(projectPath, project.writeSync());
        }
        catch(error){
            console.log(error)
        }
        console.log("write project.pbxproj: ok")
        if (!fs.existsSync(PROJECT_OUT_DIRECTORY)) {
            fs.promises.mkdir(PROJECT_OUT_DIRECTORY, {recursive: true});
        }
        await Xcodebuild.archive();
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
            let middleIcon = new Jimp(512, 512, 0x00000000);
            middleConfig.images[0]["filename"] = middleIconFileName;
            await middleIcon.writeAsync(middleIconFullPath)
            await fs.writeFileSync(middleIconConfigPath, JSON.stringify(middleConfig));

        }
    }

    public static bindManifestInfo(){

    }
}