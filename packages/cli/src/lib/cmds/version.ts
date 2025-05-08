import * as fs from 'fs'
import * as path from 'path'

export async function getVersion(): Promise<string> {
  const packageJsonFile = path.join(__dirname, '../../../package.json')
  const packageJsonContents = await (
    await fs.promises.readFile(packageJsonFile)
  ).toString()
  const packageJson = JSON.parse(packageJsonContents)
  return packageJson.version
}
