import * as fs from 'fs';
import {join} from 'path';
import { clearDir, copyDir } from './file';
import { ManifestInfo } from '../pwa';
import { parseRouter } from '../utils/utils';
import { validateURL } from '../pwa/validate';
import * as Jimp from 'jimp';
import { ImageHelper } from './imageHelper';
export const PROJECT_DIRECTORY = join(process.cwd(), "../builder/visionOSApp");
export const WEB_PROJECT_DIRECTORY = "web-spatial/web-project";

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

    public static async generateIcon(info:ManifestInfo):Promise<string>{
        const manifestJson = info.json;
        const imgUrl = manifestJson.icons[0].src
        const icon = !imgUrl.startsWith("http") ? await Jimp.read(imgUrl) : await ImageHelper.loadImage(imgUrl);
        const fileName = PROJECT_DIRECTORY + "/icon." + icon.getMIME().replace("image/", "");
        await icon.writeAsync(fileName)
        return fileName;
    }
}