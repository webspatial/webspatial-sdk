import * as fs from 'fs'
import * as path from 'path'
import { Log, ConsoleLog } from '../utils/Log'

export async function version(
  log: Log = new ConsoleLog('version'),
): Promise<boolean> {
  const packageJsonFile = path.join(__dirname, '../../../package.json')
  const packageJsonContents = await (
    await fs.promises.readFile(packageJsonFile)
  ).toString()
  const packageJson = JSON.parse(packageJsonContents)
  log.info(packageJson.version)
  return true
}
