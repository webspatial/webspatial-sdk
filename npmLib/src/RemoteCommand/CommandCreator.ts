import { LoggerLevel } from "../Logger";
import { RemoteCommand } from "./RemoteCommand";

enum Commands {
    log = 'log',
    setLogLevel = 'setLogLevel'
}

export function createLogMsgCommand(logLevel: LoggerLevel, logString: any) {
    // debugger
    return new RemoteCommand(Commands.log, {logLevel, logString});
}

export function createSetLogLevelCommand(logLevel: LoggerLevel) { 
    return new RemoteCommand(Commands.setLogLevel, {logLevel});
}
