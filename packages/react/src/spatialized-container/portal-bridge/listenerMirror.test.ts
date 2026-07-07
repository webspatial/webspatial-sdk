import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { __portalBridgeTest__, registerPortalDocumentBridge } from './registry'
import { createFakePortalWindow, createHostPlaceholder } from './testUtils'

describe('portal bridge listener mirroring', () => {
  let placeholder: HTMLElement

  beforeEach(() => {
    placeholder = createHostPlaceholder()
  })

  afterEach(() => {
    __portalBridgeTest__.reset()
    document.body.innerHTML = ''
  })

  function registerPortal() {
    const { windowProxy, portalDocument } = createFakePortalWindow()
    const unregister = registerPortalDocumentBridge({
      windowProxy,
      getPlaceholder: () => placeholder,
    })
    return { windowProxy, portalDocument, unregister }
  }

  it('delivers Escape keydown from the portal document to a host document listener', () => {
    const { portalDocument } = registerPortal()
    const onKeyDown = vi.fn()
    document.addEventListener('keydown', onKeyDown)

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(onKeyDown).toHaveBeenCalledTimes(1)
    expect(onKeyDown.mock.calls[0][0].key).toBe('Escape')
  })

  it('delivers portal pointerdown with the placeholder as event.target', () => {
    const { portalDocument } = registerPortal()
    const onPointerDown = vi.fn()
    document.addEventListener('pointerdown', onPointerDown)

    const button = portalDocument.createElement('button')
    portalDocument.body.appendChild(button)
    // jsdom has no PointerEvent constructor; the mirror only keys on the
    // event type string, so MouseEvent is equivalent here.
    button.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))

    expect(onPointerDown).toHaveBeenCalledTimes(1)
    const event = onPointerDown.mock.calls[0][0]
    expect(event.target).toBe(placeholder)
    expect(event.currentTarget).toBe(document)
  })

  it('includes the placeholder and its host ancestors in composedPath()', () => {
    const { portalDocument } = registerPortal()
    const onPointerDown = vi.fn()
    document.addEventListener('pointerdown', onPointerDown)

    portalDocument.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    )

    const path = onPointerDown.mock.calls[0][0].composedPath()
    expect(path).toContain(placeholder)
    expect(path).toContain(document.body)
    expect(path).toContain(document)
    expect(path[0]).toBe(placeholder)
  })

  it('never re-dispatches events on the host document', () => {
    const { portalDocument } = registerPortal()
    const dispatchSpy = vi.spyOn(document, 'dispatchEvent')
    document.addEventListener('pointerdown', vi.fn())

    portalDocument.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    )

    expect(dispatchSpy).not.toHaveBeenCalled()
    dispatchSpy.mockRestore()
  })

  it('removeEventListener removes the mirrored portal listener and its bookkeeping', () => {
    const { portalDocument } = registerPortal()
    const onKeyDown = vi.fn()
    document.addEventListener('keydown', onKeyDown)
    document.removeEventListener('keydown', onKeyDown)

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(onKeyDown).not.toHaveBeenCalled()
    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)
  })

  it('replays existing host listeners onto a newly mounted portal document', () => {
    registerPortal()
    const onKeyDown = vi.fn()
    document.addEventListener('keydown', onKeyDown)

    const second = registerPortal()
    second.portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })

  it('does not mirror non-whitelisted event types', () => {
    const { portalDocument } = registerPortal()
    const onMouseMove = vi.fn()
    const onKeyUp = vi.fn()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('keyup', onKeyUp)

    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)

    portalDocument.body.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true }),
    )
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keyup', { key: 'a', bubbles: true }),
    )

    expect(onMouseMove).not.toHaveBeenCalled()
    expect(onKeyUp).not.toHaveBeenCalled()

    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('keyup', onKeyUp)
  })

  it('respects DOM dedupe semantics for (type, listener, capture)', () => {
    const { portalDocument } = registerPortal()
    const listener = vi.fn()
    document.addEventListener('click', listener)
    document.addEventListener('click', listener)

    portalDocument.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)

    // A different capture flag is a distinct registration: the mirrored
    // copies fire once in the capture phase and once in the bubble phase.
    document.addEventListener('click', listener, true)
    portalDocument.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(3)

    document.removeEventListener('click', listener)
    document.removeEventListener('click', listener, true)
    portalDocument.body.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(3)
  })

  it('removes capture-flagged mirrors via removeEventListener options object', () => {
    const { portalDocument } = registerPortal()
    const listener = vi.fn()
    document.addEventListener('pointerdown', listener, { capture: true })
    document.removeEventListener('pointerdown', listener, { capture: true })

    portalDocument.body.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true }),
    )
    expect(listener).not.toHaveBeenCalled()
  })

  it('supports object listeners with handleEvent', () => {
    const { portalDocument } = registerPortal()
    const listener = { handleEvent: vi.fn() }
    document.addEventListener('keydown', listener)

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener.handleEvent).toHaveBeenCalledTimes(1)

    document.removeEventListener('keydown', listener)
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener.handleEvent).toHaveBeenCalledTimes(1)
  })

  it('fires a once listener exactly once when the portal copy fires first', () => {
    const { portalDocument } = registerPortal()
    const listener = vi.fn()
    document.addEventListener('keydown', listener, { once: true })

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)

    // Neither the host original nor any portal mirror may fire again.
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)
  })

  it('fires a once listener exactly once when the host copy fires first', () => {
    const { portalDocument } = registerPortal()
    const listener = vi.fn()
    document.addEventListener('keydown', listener, { once: true })

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)
  })

  it('removes mirrors when an AbortSignal aborts', () => {
    const { portalDocument } = registerPortal()
    const listener = vi.fn()
    const controller = new AbortController()
    document.addEventListener('keydown', listener, {
      signal: controller.signal,
    })

    controller.abort()
    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(listener).not.toHaveBeenCalled()
    expect(__portalBridgeTest__.getState()?.listenerBook.size).toBe(0)
  })

  it('keeps invoking other listeners when a mirrored listener throws', () => {
    const { portalDocument } = registerPortal()
    const throwing = vi.fn(() => {
      throw new Error('boom')
    })
    const after = vi.fn()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    document.addEventListener('keydown', throwing)
    document.addEventListener('keydown', after)

    portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )

    expect(throwing).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
    consoleSpy.mockRestore()
  })

  it('stops mirroring to a portal after it unregisters', () => {
    const first = registerPortal()
    const second = registerPortal()
    const listener = vi.fn()
    document.addEventListener('keydown', listener)

    first.unregister()
    first.portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).not.toHaveBeenCalled()

    second.portalDocument.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
