import { LoggerLevel } from './LoggerLevel'

export interface Logger {
  setLevel(level: LoggerLevel): Promise<void>
  trace(...msg: any[]): Promise<void>
  debug(...msg: any[]): Promise<void>
  info(...msg: any[]): Promise<void>
  warn(...msg: any[]): Promise<void>
  error(...msg: any[]): Promise<void>
}
