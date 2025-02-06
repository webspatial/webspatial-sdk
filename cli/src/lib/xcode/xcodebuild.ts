import { join } from "path";
import { PROJECT_DIRECTORY, PROJECT_BUILD_DIRECTORY, PROJECT_EXPORT_DIRECTORY } from "../resource";

const { execSync, exec } = require('child_process'); 

export default class Xcodebuild {
  static async run(args: string[]) {
    const output =  execSync('xcodebuild -help')
    console.log(output)
  }

  static async project(){
    try{
        await new Promise((resolve, reject) => {
            const projectFile = PROJECT_DIRECTORY + "/web-spatial.xcodeproj";
            const execRes = execSync(new XcodebuildCMD().project(projectFile).list().line)
            console.log(execRes.toString())
            resolve(execRes);
        })
    }
    catch(error){
      console.log(error)
    }
  }

  static async list(){
    try{
        await new Promise((resolve, reject) => {
            const projectFile = PROJECT_DIRECTORY + "/web-spatial.xcodeproj";
            const execRes = execSync(new XcodebuildCMD().project(projectFile).list().line)
            console.log(execRes.toString())
            resolve(execRes);
        })
    }
    catch(error){
      console.log(error)
    }
  }

  static async archive(){
    try{
        console.log("start archive")
        return await new Promise((resolve, reject) => {
            const projectFile = PROJECT_DIRECTORY + "/web-spatial.xcodeproj";
            // const simulatorDevice = "'generic/platform=visionOS'";
            // const simulatorDevice = "'platform=visionOS Simulator,name=Apple Vision Pro,OS=2.2'";
            // const execRes = execSync(new XcodebuildCMD().project(projectFile).scheme("web-spatial").archive(PROJECT_OUTPUT_DIRECTORY).destination(simulatorDevice).line)
            const archiveRes = execSync(new XcodebuildCMD().project(projectFile).scheme("web-spatial").archive(join(PROJECT_BUILD_DIRECTORY, "./pack")).clean().line)
            // console.log(execRes.toString())
            let resString = archiveRes.toString();
            if(resString.indexOf("ARCHIVE SUCCEEDED") > 0){
                console.log("------------------- ARCHIVE SUCCEEDED -------------------")
                console.log("start export")

                const outRes = execSync(new XcodebuildCMD().output(join(PROJECT_BUILD_DIRECTORY, "pack.xcarchive"), PROJECT_EXPORT_DIRECTORY, join(PROJECT_BUILD_DIRECTORY, "ExportOptions.plist")).line)
                // console.log(outRes.toString())
                resString = outRes.toString()
                if(resString.indexOf("EXPORT SUCCEEDED") > 0){
                    resolve(true);
                    console.log("------------------- EXPORT SUCCEEDED -------------------")
                }
            }
            resolve(false);
        })
    }
    catch(error){
      console.log(error)
    }
  }
}

class XcodebuildCMD{
    public line = "xcodebuild";
    public project(xcodeproj:string){
        this.line += " -project " + xcodeproj;
        return this;
    }

    public list(){
        this.line += " -list";
        return this;
    }

    public scheme(schemeName:string){
        this.line += " -scheme " + schemeName;
        return this;
    }

    public archive(path:string){
        this.line += " -archivePath " + path + " archive";
        return this;
    }

    public allowProvisioningUpdates(){
        this.line += " -allowProvisioningUpdates";
        return this;
    }

    public destination(target:string){
        this.line += " -destination " + target;
        return this;
    }

    public output(archivePath:string, outPath:string, plistPath:string){
        this.line += " -exportArchive -archivePath " + archivePath + " -exportPath " + outPath + " -exportOptionsPlist " + plistPath;
        return this;
    }

    public clean(){
        this.line += " clean";
        return this;
    }
}