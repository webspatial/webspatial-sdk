import * as fs from 'fs';
import { PROJECT_DIRECTORY } from '../resource';
const xcode = require("xcode");

export class XcodeManager{
    public static parseProject(){
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
    }

    public static bindManifestInfo(){

    }
}