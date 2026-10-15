import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  __resetEntryRegistryForTests,
  __setEntryRegistryEnforcementForTests,
  getRegisteredReactSdkEntry,
  registerReactSdkEntry,
  WebSpatialMixedEntryError,
} from './entryRegistry'

describe('entryRegistry (mixed lazy/eager entry roots)', () => {
  beforeEach(() => {
    __resetEntryRegistryForTests()
    __setEntryRegistryEnforcementForTests(true)
  })

  afterEach(() => {
    __resetEntryRegistryForTests()
    vi.restoreAllMocks()
  })

  it('registers lazy then rejects eager with WebSpatialMixedEntryError', () => {
    registerReactSdkEntry('lazy')
    expect(getRegisteredReactSdkEntry()).toBe('lazy')
    expect(() => registerReactSdkEntry('eager')).toThrow(
      WebSpatialMixedEntryError,
    )
  })

  it('reports mixed import only once per page lifetime', () => {
    registerReactSdkEntry('lazy')
    expect(() => registerReactSdkEntry('eager')).toThrow()
    expect(() => registerReactSdkEntry('eager')).not.toThrow()
  })

  it('idempotent when the same kind registers twice', () => {
    registerReactSdkEntry('eager')
    registerReactSdkEntry('eager')
    expect(getRegisteredReactSdkEntry()).toBe('eager')
  })
})
