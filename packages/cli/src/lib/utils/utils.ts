import * as fs from 'fs'
import { dirname, join } from 'path'
import { ConsoleLog } from './Log'

export function parseRouter(url: string): string {
  let urlParts = url.split('/')
  urlParts.pop()
  let pathUrl: string = urlParts.join()
  while (pathUrl.indexOf(',') >= 0) {
    pathUrl = pathUrl.replace(',', '/')
  }
  return pathUrl
}

// Why not `require('@scope/pkg/package.json')`?
// Many packages define `exports` which can block direct access to `package.json`.
// This function resolves the package entrypoint first, then walks up to find the
// package root `package.json` on disk.
export function getInstalledPackageVersion(
  packageName: string,
  resolveFromDir = process.cwd(),
): string | null {
  let entry: string
  try {
    // Let Node resolve the package from the given directory.
    entry = require.resolve(packageName, { paths: [resolveFromDir] })
  } catch {
    return null
  }

  let dir = dirname(entry)
  // Walk up parent directories until we hit the package root.
  // The `20` is a safety cap to avoid pathological cases (e.g. unexpected paths).
  for (let i = 0; i < 20; i += 1) {
    const packageJsonPath = join(dir, 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (pkg?.name === packageName) {
        return typeof pkg.version === 'string' ? pkg.version : null
      }
    }

    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }

  return null
}

export const CliLog: ConsoleLog = new ConsoleLog('webspatial-builder')
