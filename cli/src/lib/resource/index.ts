import * as fs from 'fs';
import {join} from 'path';
import { clearDir, copyDir } from './file';
import { ManifestInfo } from '../pwa';
import * as Jimp from 'jimp';
import { loadImageFromDisk, loadImageFromNet } from './load';
export const PROJECT_DIRECTORY = join(process.cwd(), "../builder/visionOSApp");
export const WEB_PROJECT_DIRECTORY = "web-spatial/web-project";
export const ASSET_DIRECTORY = "web-spatial/Assets.xcassets";
export const APPICON_DIRECTORY = "web-spatial/Assets.xcassets/AppIcon.solidimagestack/Back.solidimagestacklayer/Content.imageset";

export class ResourceManager{
    public static async moveProjectFrom(dir:string){
        // 将web工程copy到xcode工程下的web-project目录中
        const fromDirectory = join(process.cwd(), dir);
        const targetDirctory = join(PROJECT_DIRECTORY, WEB_PROJECT_DIRECTORY);
            // Ensure `targetDirectory` exists.
        if (!fs.existsSync(targetDirctory)) {
            fs.promises.mkdir(targetDirctory, {recursive: true});
        }
        else{
            // 若已存在目录，先清空
            clearDir(targetDirctory)
        }
        try{
            copyDir(fromDirectory, targetDirctory)
        }
        catch(err){
            console.log(err)
        }
    }

    public static async generateIcon(info:ManifestInfo):Promise<Jimp>{
        const manifestJson = info.json;
        const imgUrl = manifestJson.icons[0].src
        const icon = !imgUrl.startsWith("http") ? await loadImageFromDisk(imgUrl) : await loadImageFromNet(imgUrl);
        // icon.resize(512, 512);
        return icon;
        // const fileName = PROJECT_DIRECTORY + "/icon." + icon.getMIME().replace("image/", "");
        // await icon.writeAsync(fileName)
        // return fileName;
    }
}