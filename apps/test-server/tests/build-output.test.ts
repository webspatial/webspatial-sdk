import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { beforeAll, describe, expect, it } from 'vitest'

const distDir = new URL('../dist/', import.meta.url)
const appDir = new URL('../', import.meta.url)
const indexSourceUrl = new URL('../index.tsx', import.meta.url)

function readDistFile(path: string): string {
  return readFileSync(new URL(path, distDir), 'utf8')
}

function listDistFiles(path = '.'): string[] {
  return readdirSync(new URL(`${path}/`, distDir), { withFileTypes: true })
    .flatMap(entry => {
      const childPath = path === '.' ? entry.name : `${path}/${entry.name}`
      return entry.isDirectory() ? listDistFiles(childPath) : childPath
    })
    .sort()
}

function collectStaticJsClosure(entry: string): string[] {
  const visited = new Set<string>()
  const pending = [entry]
  const staticImportPattern =
    /import\s+(?:[^('"`]+?\s+from\s+)?["'](\.\/[^"']+\.js)["']/g

  while (pending.length > 0) {
    const file = pending.pop()!
    if (visited.has(file)) continue
    visited.add(file)

    const source = readDistFile(file)
    for (const match of source.matchAll(staticImportPattern)) {
      const imported = match[1]
      if (!imported) continue
      pending.push(imported.replace(/^\.\//, ''))
    }
  }

  return [...visited].sort()
}

describe('test-server build output', () => {
  beforeAll(() => {
    execFileSync(process.execPath, ['esbuild.mjs', '--build'], {
      cwd: appDir,
      stdio: 'pipe',
    })
  }, 60_000)

  it('keeps the real spatial implementation out of the main web entry', () => {
    const indexJs = readDistFile('index.js')
    const distFiles = listDistFiles()

    expect(indexJs.includes('init_spatial()')).toBe(false)
    expect(indexJs.includes('initPolyfill()')).toBe(false)
    expect(
      distFiles.some(file => /^chunks\/spatial-[A-Z0-9].*\.js$/i.test(file)),
    ).toBe(true)
  })

  it('serves ESM entry scripts after esbuild code splitting', () => {
    expect(existsSync(new URL('index.html', distDir))).toBe(true)
    expect(readDistFile('index.html')).toContain(
      '<script type="module" src="/index.js"></script>',
    )
  })

  it('does not expose core spatial implementation modules in the initial static graph', () => {
    const staticClosure = collectStaticJsClosure('index.js')
    const combined = staticClosure.map(readDistFile).join('\n')

    expect(combined.includes('packages/core/src/Spatial.ts')).toBe(false)
    expect(combined.includes('packages/core/src/SpatialSession.ts')).toBe(false)
    expect(combined.includes('packages/core/src/scene-polyfill.ts')).toBe(false)
  })

  it('lazy-loads routes that directly import core spatial implementation APIs', () => {
    const indexSource = readFileSync(indexSourceUrl, 'utf8')

    expect(indexSource).not.toMatch(
      /import\s+MemoryStats\s+from\s+['"]\.\/src\/pages\/memoryStats\/index['"]/,
    )
    expect(indexSource).not.toMatch(
      /import\s+SceneVolume\s+from\s+['"]\.\/src\/pages\/scene\/volume['"]/,
    )
    expect(indexSource).not.toMatch(
      /import\s+RealityLow\s+from\s+['"]\.\/src\/pages\/reality\/low['"]/,
    )
  })
})
