import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const testServerDir = resolve(__dirname, '../../../../apps/test-server')

describe('test-server React SDK subpath aliases', () => {
  it('maps the experimental entry before the root React SDK alias in esbuild', () => {
    const source = readFileSync(resolve(testServerDir, 'esbuild.mjs'), 'utf8')
    const experimentalSpecifier =
      "'@webspatial/react-sdk/experimental': path.resolve("
    const rootSpecifier = "'@webspatial/react-sdk': path.resolve("

    const experimentalIndex = source.indexOf(experimentalSpecifier)
    const rootIndex = source.indexOf(rootSpecifier)

    expect(experimentalIndex).toBeGreaterThanOrEqual(0)
    expect(source).toContain('/react/src/experimental.ts')
    expect(rootIndex).toBeGreaterThan(experimentalIndex)
  })

  it('maps the experimental entry in TypeScript paths', () => {
    const source = readFileSync(resolve(testServerDir, 'tsconfig.json'), 'utf8')

    expect(source).toContain('"@webspatial/react-sdk/experimental"')
    expect(source).toContain('../../packages/react/src/experimental.ts')
  })
})
