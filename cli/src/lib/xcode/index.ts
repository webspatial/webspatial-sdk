import * as fs from 'fs';
import { APPICON_DIRECTORY, PROJECT_DIRECTORY } from '../resource';
import { join } from 'path';
import { loadJsonFromDisk } from '../resource/load';
const xcode = require("xcode");

export class XcodeManager{
    public static async parseProject(option:any){
        const projectPath = PROJECT_DIRECTORY + '/web-spatial.xcodeproj/project.pbxproj'
        let project = xcode.project(projectPath);

        // 原pbxGroupByName方法存在bug，return为null，导致其他方法直接调用.xx会报错 
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
            return false; // 原方法此处返回null，导致其他地方调用project.pbxGroupByName("xxx").xx会报错
        }
        project.parseSync();

        this.bindWebProject(project);
        await this.bindIcon(option.icon);
        this.bindManifestInfo();

        try{
            fs.writeFileSync(projectPath, project.writeSync());
        }
        catch(error){
            console.log(error)
        }
    }

    public static bindWebProject(xcodeProject:any){
        const webSpatialKey = xcodeProject.findPBXGroupKey({path:'"web-spatial"'});
        let file = xcodeProject.addResourceFile("web-project", {lastKnownFileType:"folder"})
        xcodeProject.addToPbxGroupType(file, webSpatialKey, "PBXGroup")
        xcodeProject.removeResourceFile("web-project", {lastKnownFileType:"folder"})
    }

    public static async bindIcon(icon:any){
        if(icon){
            const iconConfigDirectory = join(PROJECT_DIRECTORY, APPICON_DIRECTORY);
            const iconConfigPath = join(iconConfigDirectory, "Contents.json");
            const iconFileName = "icon." + icon.getMIME().replace("image/", "");
            const iconFullPath = join(iconConfigDirectory, iconFileName);
            
            let iconConfig = await loadJsonFromDisk(iconConfigPath)
            /*
                config json format:
                {
                    images: [ { filename: 'icon.jpeg', idiom: 'vision', scale: '2x' } ],
                    info: { author: 'xcode', version: 1 }
                }
            */
            iconConfig.images[0]["filename"] = iconFileName;
            await icon.writeAsync(iconFullPath)
            await fs.writeFileSync(iconConfigPath, JSON.stringify(iconConfig));


        }
    }

    public static bindManifestInfo(){

    }
}