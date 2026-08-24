import { describe, expect, test } from 'vitest'

import {
  parseRuntimeCapabilityManifest,
  serializeRuntimeCapabilityManifest,
} from './capability-manifest'

describe('Runtime Capability Manifest v1', () => {
  test('parses a valid manifest and ignores duplicate future keys', () => {
    const manifest = parseRuntimeCapabilityManifest({
      manifestVersion: 1,
      runtime: {
        type: 'visionos',
        version: '1.7.0',
        buildId: 'pr-1234-a1b2c3d',
      },
      supported: ['Model', 'FutureCapability', 'FutureCapability'],
    })

    expect(manifest).toEqual({
      manifestVersion: 1,
      runtime: {
        type: 'visionos',
        version: '1.7.0',
        buildId: 'pr-1234-a1b2c3d',
      },
      supported: ['Model', 'FutureCapability'],
    })
    expect(Object.isFrozen(manifest)).toBe(true)
    expect(Object.isFrozen(manifest?.runtime)).toBe(true)
    expect(Object.isFrozen(manifest?.supported)).toBe(true)
  })

  test.each([
    undefined,
    null,
    {},
    { manifestVersion: 2, runtime: {}, supported: [] },
    {
      manifestVersion: 1,
      runtime: { type: 'puppeteer', buildId: 'test' },
      supported: [],
    },
    {
      manifestVersion: 1,
      runtime: { type: 'visionos', buildId: '' },
      supported: [],
    },
    {
      manifestVersion: 1,
      runtime: { type: 'visionos', buildId: 'test' },
      supported: [1],
    },
  ])('rejects malformed or unsupported manifest %#', candidate => {
    expect(parseRuntimeCapabilityManifest(candidate)).toBeNull()
  })

  test('serializes deterministically without changing diagnostic metadata', () => {
    const first = parseRuntimeCapabilityManifest({
      manifestVersion: 1,
      runtime: {
        type: 'picoos',
        version: '0.4.0-preview',
        buildId: 'preview-b',
      },
      supported: ['useAnimation:entity', 'Model', 'useAnimation'],
    })
    const second = parseRuntimeCapabilityManifest({
      manifestVersion: 1,
      runtime: {
        type: 'picoos',
        version: '9.9.9',
        buildId: 'stable-c',
      },
      supported: ['useAnimation', 'useAnimation:entity', 'Model'],
    })

    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(serializeRuntimeCapabilityManifest(first!)).toBe(
      '{"manifestVersion":1,"runtime":{"type":"picoos","version":"0.4.0-preview","buildId":"preview-b"},"supported":["Model","useAnimation","useAnimation:entity"]}',
    )
    expect([...first!.supported].sort()).toEqual([...second!.supported].sort())
  })
})
