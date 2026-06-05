import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncHeadStyles } from './useSyncHeadStyles'
import {
  disposeSyncParentHeadToChild,
  scheduleSyncParentHeadToChild,
} from './windowStyleSync'

vi.mock('./windowStyleSync', () => ({
  disposeSyncParentHeadToChild: vi.fn(),
  scheduleSyncParentHeadToChild: vi.fn(),
}))

describe('useSyncHeadStyles', () => {
  const originalMutationObserver = globalThis.MutationObserver
  const observers: Array<{
    callback: MutationCallback
    observe: ReturnType<typeof vi.fn>
    disconnect: ReturnType<typeof vi.fn>
  }> = []

  beforeEach(() => {
    vi.useFakeTimers()
    observers.length = 0
    ;(globalThis as any).MutationObserver = class {
      observe = vi.fn()
      disconnect = vi.fn()

      constructor(public callback: MutationCallback) {
        observers.push(this)
      }
    }
    vi.mocked(disposeSyncParentHeadToChild).mockClear()
    vi.mocked(scheduleSyncParentHeadToChild).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.MutationObserver = originalMutationObserver
  })

  it('syncs stylesheet text changes immediately', async () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy, {
        immediate: false,
      })
      return null
    }

    const { unmount } = render(<Test />)
    expect(observers).toHaveLength(1)
    expect(observers[0].observe).toHaveBeenCalledWith(
      document.head,
      expect.objectContaining({
        childList: true,
        characterData: true,
        subtree: true,
      }),
    )

    const style = document.createElement('style')
    const text = document.createTextNode('.a{padding:12px;}')
    style.appendChild(text)

    act(() => {
      observers[0].callback(
        [
          {
            type: 'characterData',
            target: text,
            addedNodes: [],
            removedNodes: [],
          } as unknown as MutationRecord,
        ],
        observers[0] as unknown as MutationObserver,
      )
    })

    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'immediate',
    )
    unmount()
  })

  it('keeps observing stylesheet text changes when subtree is disabled by the caller', async () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy, {
        immediate: false,
        subtree: false,
      })
      return null
    }

    const { unmount } = render(<Test />)
    expect(observers[0].observe).toHaveBeenCalledWith(
      document.head,
      expect.objectContaining({
        childList: true,
        characterData: true,
        subtree: true,
      }),
    )

    const style = document.createElement('style')
    const text = document.createTextNode('.a{padding:12px;}')
    style.appendChild(text)

    act(() => {
      observers[0].callback(
        [
          {
            type: 'characterData',
            target: text,
            addedNodes: [],
            removedNodes: [],
          } as unknown as MutationRecord,
        ],
        observers[0] as unknown as MutationObserver,
      )
    })

    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'immediate',
    )
    unmount()
  })

  it('schedules sync for CSSOM insertRule changes in parent head styles', () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy, {
        immediate: false,
      })
      return null
    }

    const { unmount } = render(<Test />)
    const style = document.createElement('style')
    document.head.appendChild(style)

    act(() => {
      style.sheet!.insertRule('.a{padding:12px;}', 0)
    })

    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'immediate',
    )
    style.remove()
    unmount()
  })

  it('restores CSSOM rule methods after the last synced child unmounts', () => {
    const childWindowA = {
      document: document.implementation.createHTMLDocument(),
    }
    const childWindowB = {
      document: document.implementation.createHTMLDocument(),
    }
    const originalInsertRule = CSSStyleSheet.prototype.insertRule
    const originalDeleteRule = CSSStyleSheet.prototype.deleteRule

    function Test() {
      useSyncHeadStyles(childWindowA as unknown as WindowProxy, {
        immediate: false,
      })
      useSyncHeadStyles(childWindowB as unknown as WindowProxy, {
        immediate: false,
      })
      return null
    }

    const { unmount } = render(<Test />)
    expect(CSSStyleSheet.prototype.insertRule).not.toBe(originalInsertRule)
    expect(CSSStyleSheet.prototype.deleteRule).not.toBe(originalDeleteRule)

    unmount()

    expect(CSSStyleSheet.prototype.insertRule).toBe(originalInsertRule)
    expect(CSSStyleSheet.prototype.deleteRule).toBe(originalDeleteRule)
  })

  it('disposes scheduled sync on unmount', () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy, {
        immediate: false,
      })
      return null
    }

    const { unmount } = render(<Test />)
    unmount()

    expect(disposeSyncParentHeadToChild).toHaveBeenCalledWith(childWindow)
  })

  it('prefers immediate when a batch mixes link stylesheet and style text changes', async () => {
    const childWindow = {
      document: document.implementation.createHTMLDocument(),
    }

    function Test() {
      useSyncHeadStyles(childWindow as unknown as WindowProxy, {
        immediate: false,
      })
      return null
    }

    const { unmount } = render(<Test />)

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://example.com/a.css'

    const style = document.createElement('style')
    const text = document.createTextNode('.a{padding:12px;}')
    style.appendChild(text)

    act(() => {
      observers[0].callback(
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
    })

    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledTimes(1)
    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledWith(
      childWindow,
      'immediate',
    )

    vi.advanceTimersByTime(1000)
    expect(scheduleSyncParentHeadToChild).toHaveBeenCalledTimes(1)

    unmount()
  })
})
