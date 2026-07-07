import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMirroredEvent } from './eventProxy'
import { BridgeGlobalState, PortalRegistration } from './shared'
import { createFakePortalWindow, createHostPlaceholder } from './testUtils'

function createFixture(placeholder: HTMLElement | null) {
  const { windowProxy, portalDocument } = createFakePortalWindow()
  const reg: PortalRegistration = {
    portalDocument,
    windowProxy,
    getPlaceholder: () => placeholder,
  }
  const state = { hostDocument: document } as BridgeGlobalState
  return { reg, state, portalDocument }
}

describe('createMirroredEvent', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('remaps target and srcElement to the placeholder', () => {
    const placeholder = createHostPlaceholder()
    const { reg, state, portalDocument } = createFixture(placeholder)
    const button = portalDocument.createElement('button')
    portalDocument.body.appendChild(button)

    let proxied: Event | null = null
    portalDocument.addEventListener('click', event => {
      proxied = createMirroredEvent(event, reg, state)
    })
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(proxied!.target).toBe(placeholder)
    expect((proxied as any).srcElement).toBe(placeholder)
    expect(proxied!.currentTarget).toBe(document)
  })

  it('builds composedPath() from the placeholder up through host document and window', () => {
    const wrapper = document.createElement('section')
    document.body.appendChild(wrapper)
    const placeholder = document.createElement('div')
    wrapper.appendChild(placeholder)
    const { reg, state, portalDocument } = createFixture(placeholder)

    const proxied = createMirroredEvent(
      new MouseEvent('pointerdown'),
      reg,
      state,
    )
    void portalDocument

    const path = proxied.composedPath()
    expect(path[0]).toBe(placeholder)
    expect(path).toContain(wrapper)
    expect(path).toContain(document.body)
    expect(path).toContain(document)
    expect(path[path.length - 1]).toBe(window)
  })

  it('forwards preventDefault to the real event', () => {
    const placeholder = createHostPlaceholder()
    const { reg, state } = createFixture(placeholder)
    const realEvent = new MouseEvent('click', { cancelable: true })

    const proxied = createMirroredEvent(realEvent, reg, state)
    proxied.preventDefault()

    expect(realEvent.defaultPrevented).toBe(true)
    expect(proxied.defaultPrevented).toBe(true)
  })

  it('forwards stopPropagation and stopImmediatePropagation to the real event', () => {
    const placeholder = createHostPlaceholder()
    const { reg, state } = createFixture(placeholder)
    const realEvent = new MouseEvent('click', { bubbles: true })
    const stopSpy = vi.spyOn(realEvent, 'stopPropagation')
    const stopImmediateSpy = vi.spyOn(realEvent, 'stopImmediatePropagation')

    const proxied = createMirroredEvent(realEvent, reg, state)
    proxied.stopPropagation()
    proxied.stopImmediatePropagation()

    expect(stopSpy).toHaveBeenCalledTimes(1)
    expect(stopImmediateSpy).toHaveBeenCalledTimes(1)
  })

  it('preserves keyboard and pointer fields', () => {
    const placeholder = createHostPlaceholder()
    const { reg, state } = createFixture(placeholder)

    const keyEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      ctrlKey: true,
    })
    const keyProxy = createMirroredEvent(keyEvent, reg, state) as KeyboardEvent
    expect(keyProxy.key).toBe('Escape')
    expect(keyProxy.code).toBe('Escape')
    expect(keyProxy.getModifierState('Control')).toBe(true)

    const mouseEvent = new MouseEvent('pointerdown', {
      clientX: 11,
      clientY: 22,
      button: 1,
    })
    const mouseProxy = createMirroredEvent(mouseEvent, reg, state) as MouseEvent
    expect(mouseProxy.clientX).toBe(11)
    expect(mouseProxy.clientY).toBe(22)
    expect(mouseProxy.button).toBe(1)
    expect(mouseProxy.type).toBe('pointerdown')
  })

  it('returns stable method identities across reads', () => {
    const placeholder = createHostPlaceholder()
    const { reg, state } = createFixture(placeholder)
    const proxied = createMirroredEvent(new MouseEvent('click'), reg, state)

    expect(proxied.preventDefault).toBe(proxied.preventDefault)
    expect(proxied.composedPath).toBe(proxied.composedPath)
  })

  it('falls back to real target and path when the placeholder is unresolvable', () => {
    const { reg, state, portalDocument } = createFixture(null)
    const button = portalDocument.createElement('button')
    portalDocument.body.appendChild(button)

    // composedPath() is only populated while the event is being dispatched,
    // so the fallback path must be observed inside the listener.
    const seen = vi.fn((proxied: Event) => {
      expect(proxied.target).toBe(button)
      expect(proxied.composedPath()).toContain(portalDocument)
      expect(proxied.currentTarget).toBe(document)
    })
    portalDocument.addEventListener('click', event => {
      seen(createMirroredEvent(event, reg, state))
    })
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(seen).toHaveBeenCalledTimes(1)
  })
})
