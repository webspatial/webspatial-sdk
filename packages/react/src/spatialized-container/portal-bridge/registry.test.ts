import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __portalBridgeTest__, registerPortalDocumentBridge } from './registry'
import { createFakePortalWindow, createHostPlaceholder } from './testUtils'

describe('portal bridge registry', () => {
  let placeholder: HTMLElement

  beforeEach(() => {
    placeholder = createHostPlaceholder()
  })

  afterEach(() => {
    __portalBridgeTest__.reset()
    document.body.innerHTML = ''
    vi.resetModules()
  })

  function registerPortal(
    register: typeof registerPortalDocumentBridge = registerPortalDocumentBridge,
  ) {
    const { windowProxy, portalDocument } = createFakePortalWindow()
    const unregister = register({
      windowProxy,
      getPlaceholder: () => placeholder,
    })
    return { windowProxy, portalDocument, unregister }
  }

  it('patches the host document on first register and restores it after the last unregister', () => {
    expect(
      Object.getOwnPropertyDescriptor(document, 'addEventListener'),
    ).toBeUndefined()

    const first = registerPortal()
    const second = registerPortal()

    expect(__portalBridgeTest__.isHostPatched()).toBe(true)
    expect(
      Object.getOwnPropertyDescriptor(document, 'addEventListener'),
    ).toBeDefined()
    expect(
      Object.getOwnPropertyDescriptor(document, 'removeEventListener'),
    ).toBeDefined()

    first.unregister()
    expect(__portalBridgeTest__.isHostPatched()).toBe(true)

    second.unregister()
    expect(__portalBridgeTest__.isHostPatched()).toBe(false)
    expect(
      Object.getOwnPropertyDescriptor(document, 'addEventListener'),
    ).toBeUndefined()
    expect(
      Object.getOwnPropertyDescriptor(document, 'removeEventListener'),
    ).toBeUndefined()
    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)
  })

  it('unregister is idempotent', () => {
    const { unregister } = registerPortal()
    unregister()
    unregister()
    expect(__portalBridgeTest__.getPortalCount()).toBe(0)
    expect(__portalBridgeTest__.isHostPatched()).toBe(false)
  })

  it('delivers exactly one call per event across unregister/re-register remounts', () => {
    const { windowProxy, portalDocument, unregister } = registerPortal()
    unregister()

    const remount = registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () => placeholder,
    })

    const listener = vi.fn()
    document.addEventListener('keydown', listener)
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
    remount()
  })

  it('supersedes a stale registration for the same portal document without duplicating mirrors', () => {
    const {
      windowProxy,
      portalDocument,
      unregister: unregisterStale,
    } = registerPortal()

    const listener = vi.fn()
    document.addEventListener('keydown', listener)

    // StrictMode-like double registration of the same document before the
    // first effect cleanup ran.
    const unregisterFresh = registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () => placeholder,
    })

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)

    // The stale unregister is superseded and must not tear down the fresh
    // registration.
    unregisterStale()
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(2)

    unregisterFresh()
    expect(__portalBridgeTest__.isHostPatched()).toBe(false)
  })

  it('shares one registry across duplicate SDK module instances', async () => {
    registerPortal()
    const listener = vi.fn()
    document.addEventListener('keydown', listener)

    // Simulate a second copy of the SDK (HMR / linked package): a fresh
    // module instance sharing the same globalThis and document.
    vi.resetModules()
    const secondCopy = await import('./registry')
    expect(secondCopy.registerPortalDocumentBridge).not.toBe(
      registerPortalDocumentBridge,
    )

    const second = registerPortal(secondCopy.registerPortalDocumentBridge)

    // The second copy sees the shared state: no double patch, and listeners
    // registered before it loaded replay onto its portal.
    expect(__portalBridgeTest__.getPortalCount()).toBe(2)
    expect(secondCopy.__portalBridgeTest__.getPortalCount()).toBe(2)

    second.portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('reset() force-tears-down patches and registrations', () => {
    registerPortal()
    document.addEventListener('keydown', vi.fn())

    __portalBridgeTest__.reset()

    expect(__portalBridgeTest__.getState()).toBeUndefined()
    expect(
      Object.getOwnPropertyDescriptor(document, 'addEventListener'),
    ).toBeUndefined()
  })
})
