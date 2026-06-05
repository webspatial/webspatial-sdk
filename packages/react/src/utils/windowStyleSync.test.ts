import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __parentHeadSyncRegistryTest__,
  scheduleSyncParentHeadToChild,
  syncParentHeadToChild,
  syncStyleSheetRulesToChild,
} from './windowStyleSync'

const registerParentHeadSyncTarget =
  __parentHeadSyncRegistryTest__.registerTarget

function createChildWindow() {
  const childDocument = document.implementation.createHTMLDocument()
  return {
    document: childDocument,
    Event,
  } as unknown as WindowProxy
}

function clearParentHead() {
  document.head
    .querySelectorAll('style, link[rel="stylesheet"]')
    .forEach(node => node.remove())
}

describe('windowStyleSync', () => {
  const originalMutationObserver = globalThis.MutationObserver
  const observers: Array<{
    callback: MutationCallback
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }> = []

  beforeEach(() => {
    observers.length = 0
    ;(globalThis as any).MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()

      constructor(public callback: MutationCallback) {
        observers.push(this)
      }
    }
  })

  afterEach(() => {
    vi.useRealTimers()
    clearParentHead()
    globalThis.MutationObserver = originalMutationObserver
    __parentHeadSyncRegistryTest__.reset()
  })

  it('updates synced style nodes in place without retaining stale attributes', async () => {
    const childWindow = createChildWindow()
    const parentStyle = document.createElement('style')
    parentStyle.setAttribute('media', 'screen')
    parentStyle.textContent = '.a { color: red; }'
    document.head.appendChild(parentStyle)

    await syncParentHeadToChild(childWindow)
    const firstSyncedStyle = childWindow.document.head.querySelector(
      'style[data-webspatial-sync="1"]',
    ) as HTMLStyleElement
    expect(firstSyncedStyle).not.toBeNull()
    expect(firstSyncedStyle.getAttribute('media')).toBe('screen')
    expect(firstSyncedStyle.textContent).toContain('color: red')

    parentStyle.removeAttribute('media')
    parentStyle.setAttribute('nonce', 'next')
    parentStyle.textContent = '.a { color: blue; }'

    await syncParentHeadToChild(childWindow)
    const secondSyncedStyle = childWindow.document.head.querySelector(
      'style[data-webspatial-sync="1"]',
    ) as HTMLStyleElement

    expect(secondSyncedStyle).toBe(firstSyncedStyle)
    expect(secondSyncedStyle.getAttribute('media')).toBeNull()
    expect(secondSyncedStyle.getAttribute('nonce')).toBe('next')
    expect(secondSyncedStyle.textContent).toContain('color: blue')
    expect(
      childWindow.document.head.querySelectorAll(
        'style[data-webspatial-sync="1"]',
      ),
    ).toHaveLength(1)
  })

  it('forces full text fallback after clearing target CSSOM rules', () => {
    const source = document.createElement('style')
    source.textContent = '.a { color: red; }'
    Object.defineProperty(source, 'sheet', {
      configurable: true,
      value: {
        get cssRules() {
          throw new Error('inaccessible')
        },
      },
    })

    const target = document.createElement('style')
    let textContent = '.a { color: red; }'
    let textAssignments = 0
    Object.defineProperty(target, 'textContent', {
      configurable: true,
      get: () => textContent,
      set: value => {
        textAssignments++
        textContent = value ?? ''
      },
    })
    Object.defineProperty(target, 'sheet', {
      configurable: true,
      value: {
        cssRules: { length: 1 },
        deleteRule() {
          this.cssRules.length -= 1
        },
      },
    })

    syncStyleSheetRulesToChild(target, source)

    expect(textAssignments).toBe(1)
    expect(textContent).toBe('.a { color: red; }')
  })

  it('does not let an older async stylesheet sync append after a newer sync starts', async () => {
    vi.useFakeTimers()
    const childWindow = createChildWindow()
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://example.com/a.css'
    document.head.appendChild(link)

    const firstSync = syncParentHeadToChild(childWindow)
    const secondSync = syncParentHeadToChild(childWindow)

    await vi.advanceTimersByTimeAsync(51)
    const childLinks = childWindow.document.head.querySelectorAll(
      'link[data-webspatial-sync="1"]',
    )
    expect(childLinks).toHaveLength(1)
    childLinks[0]!.dispatchEvent(new Event('load'))

    await Promise.all([firstSync, secondSync])
  })

  it('cancels a pending delayed sync when an immediate sync is scheduled', async () => {
    vi.useFakeTimers()
    const childWindow = createChildWindow()
    const parentStyle = document.createElement('style')
    parentStyle.textContent = '.a { color: red; }'
    document.head.appendChild(parentStyle)

    scheduleSyncParentHeadToChild(childWindow, 'delayed')
    scheduleSyncParentHeadToChild(childWindow, 'immediate')

    await Promise.resolve()
    await Promise.resolve()

    const syncedStyle = childWindow.document.head.querySelector(
      'style[data-webspatial-sync="1"]',
    ) as HTMLStyleElement
    expect(syncedStyle.textContent).toContain('color: red')

    parentStyle.textContent = '.a { color: blue; }'
    await vi.advanceTimersByTimeAsync(101)

    expect(syncedStyle.textContent).toContain('color: red')
    expect(syncedStyle.textContent).not.toContain('color: blue')
  })

  it('installs one global head observer for multiple registered targets', () => {
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    const childWindowC = createChildWindow()

    const unregisterA = registerParentHeadSyncTarget(childWindowA, {
      immediate: false,
    })
    const unregisterB = registerParentHeadSyncTarget(childWindowB, {
      immediate: false,
    })
    const unregisterC = registerParentHeadSyncTarget(childWindowC, {
      immediate: false,
    })

    expect(observers).toHaveLength(1)
    expect(observers[0]!.observe).toHaveBeenCalledWith(
      document.head,
      expect.objectContaining({
        childList: true,
        characterData: true,
        subtree: true,
      }),
    )
    expect(__parentHeadSyncRegistryTest__.getActiveTargetCount()).toBe(3)

    unregisterA()
    unregisterB()
    expect(observers[0]!.disconnect).not.toHaveBeenCalled()
    unregisterC()

    expect(observers[0]!.disconnect).toHaveBeenCalledTimes(1)
    expect(__parentHeadSyncRegistryTest__.getActiveTargetCount()).toBe(0)
  })

  it('restores CSSOM rule methods after the last target unregisters', () => {
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    const originalInsertRule = CSSStyleSheet.prototype.insertRule
    const originalDeleteRule = CSSStyleSheet.prototype.deleteRule

    const unregisterA = registerParentHeadSyncTarget(childWindowA, {
      immediate: false,
    })
    const unregisterB = registerParentHeadSyncTarget(childWindowB, {
      immediate: false,
    })

    expect(CSSStyleSheet.prototype.insertRule).not.toBe(originalInsertRule)
    expect(CSSStyleSheet.prototype.deleteRule).not.toBe(originalDeleteRule)

    unregisterA()
    expect(CSSStyleSheet.prototype.insertRule).not.toBe(originalInsertRule)
    expect(CSSStyleSheet.prototype.deleteRule).not.toBe(originalDeleteRule)

    unregisterB()
    expect(CSSStyleSheet.prototype.insertRule).toBe(originalInsertRule)
    expect(CSSStyleSheet.prototype.deleteRule).toBe(originalDeleteRule)
  })

  it('broadcasts CSSOM rule changes to every active portal', async () => {
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    registerParentHeadSyncTarget(childWindowA, { immediate: false })
    registerParentHeadSyncTarget(childWindowB, { immediate: false })

    const parentStyle = document.createElement('style')
    document.head.appendChild(parentStyle)
    parentStyle.sheet!.insertRule('.cssom { opacity: .5; }', 0)

    await Promise.resolve()
    await Promise.resolve()

    for (const childWindow of [childWindowA, childWindowB]) {
      const syncedStyle = childWindow.document.head.querySelector(
        'style[data-webspatial-sync="1"]',
      ) as HTMLStyleElement
      expect(syncedStyle.textContent).toContain('opacity: .5')
    }
  })

  it('broadcast sync updates every active portal from one head mutation', async () => {
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    registerParentHeadSyncTarget(childWindowA, { immediate: false })
    registerParentHeadSyncTarget(childWindowB, { immediate: false })

    const parentStyle = document.createElement('style')
    parentStyle.textContent = '.broadcast { color: red; }'
    document.head.appendChild(parentStyle)

    observers[0]!.callback(
      [
        {
          type: 'childList',
          target: document.head,
          addedNodes: [parentStyle] as unknown as NodeList,
          removedNodes: [] as unknown as NodeList,
        } as unknown as MutationRecord,
      ],
      observers[0] as unknown as MutationObserver,
    )

    await Promise.resolve()
    await Promise.resolve()

    for (const childWindow of [childWindowA, childWindowB]) {
      const syncedStyle = childWindow.document.head.querySelector(
        'style[data-webspatial-sync="1"]',
      ) as HTMLStyleElement
      expect(syncedStyle.textContent).toContain('color: red')
    }
  })

  it('prefers immediate when a batch mixes link stylesheet and style text changes', async () => {
    vi.useFakeTimers()
    const childWindow = createChildWindow()
    registerParentHeadSyncTarget(childWindow, { immediate: false })

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://example.com/a.css'

    const style = document.createElement('style')
    const text = document.createTextNode('.a { padding: 12px; color: red; }')
    style.appendChild(text)
    document.head.appendChild(style)

    const querySpy = vi.spyOn(document.head, 'querySelectorAll')

    observers[0]!.callback(
      [
        {
          type: 'childList',
          target: document.head,
          addedNodes: [link] as unknown as NodeList,
          removedNodes: [] as unknown as NodeList,
        } as unknown as MutationRecord,
        {
          type: 'characterData',
          target: text,
          addedNodes: [],
          removedNodes: [],
        } as unknown as MutationRecord,
      ],
      observers[0] as unknown as MutationObserver,
    )

    await Promise.resolve()
    await Promise.resolve()

    const syncedStyle = childWindow.document.head.querySelector(
      'style[data-webspatial-sync="1"]',
    ) as HTMLStyleElement
    expect(syncedStyle.textContent).toContain('color: red')
    expect(
      querySpy.mock.calls.filter(([selector]) => selector === 'style'),
    ).toHaveLength(1)

    text.textContent = '.a { padding: 12px; color: blue; }'
    await vi.advanceTimersByTimeAsync(1000)

    expect(syncedStyle.textContent).toContain('color: red')
    expect(syncedStyle.textContent).not.toContain('color: blue')
    expect(
      querySpy.mock.calls.filter(([selector]) => selector === 'style'),
    ).toHaveLength(1)

    querySpy.mockRestore()
  })

  it('reads the parent head once per broadcast wave', async () => {
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    const childWindowC = createChildWindow()
    registerParentHeadSyncTarget(childWindowA, { immediate: false })
    registerParentHeadSyncTarget(childWindowB, { immediate: false })
    registerParentHeadSyncTarget(childWindowC, { immediate: false })

    const parentStyle = document.createElement('style')
    parentStyle.textContent = '.snapshot { opacity: .42; }'
    document.head.appendChild(parentStyle)

    const querySpy = vi.spyOn(document.head, 'querySelectorAll')

    observers[0]!.callback(
      [
        {
          type: 'childList',
          target: document.head,
          addedNodes: [parentStyle] as unknown as NodeList,
          removedNodes: [] as unknown as NodeList,
        } as unknown as MutationRecord,
      ],
      observers[0] as unknown as MutationObserver,
    )

    await Promise.resolve()
    await Promise.resolve()

    expect(
      querySpy.mock.calls.filter(([selector]) => selector === 'style'),
    ).toHaveLength(1)
    expect(
      querySpy.mock.calls.filter(
        ([selector]) => selector === 'link[rel="stylesheet"][href]',
      ),
    ).toHaveLength(1)
  })

  it('keeps afterHostLayout sync scoped to the requested target', async () => {
    vi.useFakeTimers()
    const childWindowA = createChildWindow()
    const childWindowB = createChildWindow()
    registerParentHeadSyncTarget(childWindowA, { immediate: false })
    registerParentHeadSyncTarget(childWindowB, { immediate: false })

    const parentStyle = document.createElement('style')
    parentStyle.textContent = '.targeted { color: blue; }'
    document.head.appendChild(parentStyle)
    const querySpy = vi.spyOn(document.head, 'querySelectorAll')
    const onComplete = vi.fn()

    scheduleSyncParentHeadToChild(childWindowB, 'afterHostLayout', onComplete)

    await vi.runAllTicks()
    await vi.advanceTimersByTimeAsync(20)
    await Promise.resolve()

    expect(
      childWindowA.document.head.querySelector(
        'style[data-webspatial-sync="1"]',
      ),
    ).toBeNull()
    expect(
      childWindowB.document.head.querySelector(
        'style[data-webspatial-sync="1"]',
      )?.textContent,
    ).toContain('color: blue')
    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(
      querySpy.mock.calls.filter(([selector]) => selector === 'style'),
    ).toHaveLength(1)
  })
})
