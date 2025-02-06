
import {ParsedArgs} from "minimist";
import {ConsoleLog, Log} from "../utils/Log";
import {InitArgs, PWAGenerator} from "../pwa"
import { ResourceManager } from "../resource";
import { XcodeManager } from "../xcode";


export async function start(args: ParsedArgs, log: Log = new ConsoleLog('help')): Promise<boolean>{
    /**
     * pwa步骤
     * 1. 加载manifest.json
     * 2. 检测manifest.json参数完整性
     * 3. 检测start_url规则
     * 4. 完善start_url、scope、display、deeplink配置
     * 
     * PWA steps
     * 1.  Load manifestion.json
     * 2.  Check the integrity of manifestion.json parameters
     * 3.  Detecting start_url rule
     * 4.  Improve start_url, scope, display, and deeplink configurations
     **/ 
    console.log("------------------- build start -------------------");
    let manifestInfo = await PWAGenerator.generator(args as unknown as InitArgs);
    /**
     * resource步骤
     * 1. 若为本地项目，则
     *  a. 检查并创建项目目录
     *  b. 移动web工程
     * 2. 生成icon图标
     * 
     * *Resource steps
     * 1.  If it is a local project, then
     *  A. Check and create project directory
     *  B. Mobile Web Engineering
     * 2.  Generate icon icon
     **/
    if(!manifestInfo.fromNet){ // 如果为本地项目，则需要对项目进行移动
        await ResourceManager.moveProjectFrom(args["project"])
        console.log("move web project: ok")
    }
    const icon = await ResourceManager.generateIcon(manifestInfo)
    console.log("generate icon: ok")
    await XcodeManager.parseProject({icon});
    console.log("------------------- build end -------------------");
    return true
}