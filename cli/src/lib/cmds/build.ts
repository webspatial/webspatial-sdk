
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
     **/ 
    let manifestInfo = await PWAGenerator.generator(args as unknown as InitArgs);
    /**
     * resource步骤
     * 1. 若为本地项目，则
     *  a. 检查并创建项目目录
     *  b. 移动web工程
     * 2. 生成icon图标
     **/
    if(!manifestInfo.fromNet){ // 如果为本地项目，则需要对项目进行移动
        await ResourceManager.moveProjectFrom(args["project"])
    }
    const icon = await ResourceManager.generateIcon(manifestInfo)
    console.log(icon)
    await XcodeManager.parseProject({icon});
    return true
}