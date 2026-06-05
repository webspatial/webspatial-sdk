import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  scheduleSyncParentHeadToChild,
  syncParentHeadToChild,
  syncStyleSheetRulesToChild,
} from './windowStyleSync'

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
  afterEach(() => {
    vi.useRealTimers()
    clearParentHead()
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

    await vi.runAllTicks()
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
})
