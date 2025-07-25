import { PingCommand } from './JSBCommand'

export function ping() {
  return new PingCommand().execute()
}
