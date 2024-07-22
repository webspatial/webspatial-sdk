import { LoggerLevel } from "./LoggerLevel";
import { Logger } from "./Logger";


import * as log from "loglevel";
import { LogLevelNumbers } from "loglevel";

const LoggerLevelMap: Record<string, LogLevelNumbers> = {
    [LoggerLevel.TRACE]: 0,
    [LoggerLevel.DEBUG]: 1,
    [LoggerLevel.INFO]: 2,
    [LoggerLevel.WARN]: 3,
    [LoggerLevel.ERROR]: 4,
};

export class WebLogger implements Logger {
    private logger;
    constructor(name: string = '') {
        this.logger = log.getLogger(name);
    }

    async setLevel(level: LoggerLevel): Promise<void> {
        this.logger.setLevel(LoggerLevelMap[level]);
    }

    async trace(msg: any): Promise<void> {
        this.logger.trace(msg);
    }

    async debug(msg: any): Promise<void> {
        this.logger.debug(msg);
    }

    async info(msg: any): Promise<void> {
        this.logger.info(msg);
    }

    async warn(msg: any): Promise<void> {
        this.logger.warn(msg);
    }

    async error(msg: any): Promise<void> {
        this.logger.error(msg);
    }
}