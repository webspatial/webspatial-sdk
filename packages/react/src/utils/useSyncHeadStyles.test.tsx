import { act, render } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSyncHeadStyles } from './useSyncHeadStyles'
import { syncParentHeadToChild } from './windowStyleSync'

vi.mock('./windowStyleSync', () => ({
  syncParentHeadToChild: vi.fn(),
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
    vi.mocked(syncParentHeadToChild).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.MutationObserver = originalMutationObserver
  })

  it('syncs stylesheet text changes before the next timer tick', async () => {
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
    expect(syncParentHeadToChild).not.toHaveBeenCalled()

    await act(async () => {
      await Promise.resolve()
    })

    expect(syncParentHeadToChild).toHaveBeenCalledWith(childWindow)
    unmount()
  })

  it('coalesces multiple immediate stylesheet text changes in one microtask', async () => {
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
    const text = document.createTextNode('.a{padding:12px;}')
    style.appendChild(text)
    const mutation = {
      type: 'characterData',
      target: text,
      addedNodes: [],
      removedNodes: [],
    } as unknown as MutationRecord

    act(() => {
      observers[0].callback(
        [mutation],
        observers[0] as unknown as MutationObserver,
      )
      observers[0].callback(
        [mutation],
        observers[0] as unknown as MutationObserver,
      )
    })
    expect(syncParentHeadToChild).not.toHaveBeenCalled()

    await act(async () => {
      await Promise.resolve()
    })

    expect(syncParentHeadToChild).toHaveBeenCalledTimes(1)
    expect(syncParentHeadToChild).toHaveBeenCalledWith(childWindow)
    unmount()
  })

  it('cancels queued immediate sync on unmount', async () => {
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
      unmount()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(syncParentHeadToChild).not.toHaveBeenCalled()
  })
})
