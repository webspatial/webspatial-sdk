import {
  createSetLogLevelCommand,
  createLogMsgCommand,
  RemoteCommand,
} from '../remote-command'
import { LoggerLevel } from './LoggerLevel'
import { Logger } from './Logger'

export class NativeLogger implements Logger {
  private rpc: (cmd: RemoteCommand) => Promise<void>

  constructor(rpc: (cmd: RemoteCommand) => Promise<void>) {
    this.rpc = rpc
  }

  async setLevel(level: LoggerLevel): Promise<void> {
    return this.rpc(createSetLogLevelCommand(level))
  }

  async trace(...msg: any[]): Promise<void> {
    this.rpc(createLogMsgCommand(LoggerLevel.TRACE, msg))
  }

  async debug(...msg: any[]): Promise<void> {
    this.rpc(createLogMsgCommand(LoggerLevel.DEBUG, msg))
  }

  async info(...msg: any[]): Promise<void> {
    this.rpc(createLogMsgCommand(LoggerLevel.INFO, msg))
  }

  async warn(...msg: any[]): Promise<void> {
    this.rpc(createLogMsgCommand(LoggerLevel.WARN, msg))
  }

  async error(...msg: any[]): Promise<void> {
    this.rpc(createLogMsgCommand(LoggerLevel.ERROR, msg))
  }
}
