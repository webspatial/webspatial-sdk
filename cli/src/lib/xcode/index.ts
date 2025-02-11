import * as fs from 'fs';
import { PROJECT_DIRECTORY, PROJECT_EXPORT_DIRECTORY } from '../resource';
import XcodeProject from './xcodeproject';
import Xcodebuild from './xcodebuild';

export class XcodeManager{
    public static async parseProject(option:any){
        const projectPath = PROJECT_DIRECTORY + '/web-spatial.xcodeproj/project.pbxproj'
        await XcodeProject.modify(projectPath, option);
        console.log("write project.pbxproj: ok")
        if (!fs.existsSync(PROJECT_EXPORT_DIRECTORY)) {
            fs.promises.mkdir(PROJECT_EXPORT_DIRECTORY, {recursive: true});
        }
        await Xcodebuild.archive();
    }
}