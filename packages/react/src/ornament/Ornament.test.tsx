import { cleanup, render, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRuntimeCacheForTests } from '@webspatial/core-sdk/runtime'
import { Model } from '../Model'
import { Reality } from '../reality/components/Reality'
import { withSpatialized2DElementContainer } from '../spatialized-container'
import { InsideAttachmentContext } from '../reality/context/InsideAttachmentContext'
import { Ornament } from './Ornament'
import { InsideOrnamentContext } from './InsideOrnamentContext'

const mocks = vi.hoisted(() => ({
  createOrnament: vi.fn(),
  addOrnament: vi.fn(),
  syncParentHeadToChild: vi.fn(),
  useSyncHeadStyles: vi.fn(),
}))

vi.mock('../utils/getSession', () => ({
  getSession: () => ({
    createOrnament: mocks.createOrnament,
    getSpatialScene: () => ({
      addOrnament: mocks.addOrnament,
    }),
  }),
}))

vi.mock('../utils/windowStyleSync', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../utils/windowStyleSync')>()
  return {
    ...actual,
    setOpenWindowStyle: vi.fn(),
    syncParentHeadToChild: mocks.syncParentHeadToChild,
  }
})

vi.mock('../utils/useSyncHeadStyles', () => ({
  useSyncHeadStyles: mocks.useSyncHeadStyles,
}))

function setUserAgent(userAgent: string) {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })
  resetRuntimeCacheForTests()
}

function createChildWindow() {
  const childDocument = document.implementation.createHTMLDocument('ornament')
  return {
    document: childDocument,
  } as unknown as WindowProxy
}

function createDeferred<T = void>() {
  let resolve!: (value?: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve as typeof resolve
    reject = promiseReject
  })

  return { promise, resolve, reject }
}

describe('Ornament', () => {
  let childWindow: WindowProxy
  let destroy: ReturnType<typeof vi.fn>
  let update: ReturnType<typeof vi.fn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    childWindow = createChildWindow()
    destroy = vi.fn(() => Promise.resolve())
    update = vi.fn(() => Promise.resolve())
    mocks.createOrnament.mockReset()
    mocks.addOrnament.mockReset()
    mocks.syncParentHeadToChild.mockReset()
    mocks.useSyncHeadStyles.mockReset()
    mocks.createOrnament.mockResolvedValue({
      id: 'ornament-1',
      getWindowProxy: () => childWindow,
      destroy,
      update,
    })
    mocks.addOrnament.mockResolvedValue({ success: true })
    mocks.syncParentHeadToChild.mockResolvedValue(undefined)
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    resetRuntimeCacheForTests()
  })

  it('returns null in unsupported runtimes without rendering children', () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36')

    const { container, queryByTestId } = render(
      <Ornament>
        <div data-testid="ornament-child" />
      </Ornament>,
    )

    expect(container.children.length).toBe(0)
    expect(queryByTestId('ornament-child')).toBeNull()
    expect(mocks.createOrnament).not.toHaveBeenCalled()
  })

  it('creates, adds, syncs styles, portals children, updates, and destroys', async () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')

    const { rerender, unmount } = render(
      <Ornament attachmentAnchor="bottom" width={240} height={120}>
        <div data-testid="ornament-child">content</div>
      </Ornament>,
    )

    await waitFor(() => {
      expect(mocks.createOrnament).toHaveBeenCalledWith({
        attachmentAnchor: 'bottom',
        contentAlignment: 'back',
        visibility: 'visible',
        width: 240,
        height: 120,
        cornerRadius: {
          topLeading: 0,
          bottomLeading: 0,
          topTrailing: 0,
          bottomTrailing: 0,
        },
        backgroundMaterial: 'none',
      })
      expect(mocks.addOrnament).toHaveBeenCalledWith('ornament-1')
      expect(mocks.syncParentHeadToChild).toHaveBeenCalledWith(childWindow)
      expect(
        childWindow.document.body.querySelector(
          '[data-testid="ornament-child"]',
        ),
      ).not.toBeNull()
    })

    rerender(
      <Ornament attachmentAnchor="bottom" visibility="hidden" width={320}>
        <div data-testid="ornament-child">content</div>
      </Ornament>,
    )

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        attachmentAnchor: 'bottom',
        contentAlignment: 'back',
        visibility: 'hidden',
        width: 320,
        height: 150,
        cornerRadius: {
          topLeading: 0,
          bottomLeading: 0,
          topTrailing: 0,
          bottomTrailing: 0,
        },
        backgroundMaterial: 'none',
      })
    })

    unmount()
    expect(destroy).toHaveBeenCalled()
  })

  it('applies pending prop updates before adding after async setup', async () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')
    const styleSync = createDeferred()
    mocks.syncParentHeadToChild.mockReturnValueOnce(styleSync.promise)

    const { rerender } = render(
      <Ornament attachmentAnchor="bottom" width={240}>
        <div data-testid="ornament-child">content</div>
      </Ornament>,
    )

    await waitFor(() => {
      expect(mocks.createOrnament).toHaveBeenCalledWith({
        attachmentAnchor: 'bottom',
        contentAlignment: 'back',
        visibility: 'visible',
        width: 240,
        height: 150,
        cornerRadius: {
          topLeading: 0,
          bottomLeading: 0,
          topTrailing: 0,
          bottomTrailing: 0,
        },
        backgroundMaterial: 'none',
      })
      expect(mocks.syncParentHeadToChild).toHaveBeenCalledWith(childWindow)
    })

    rerender(
      <Ornament attachmentAnchor="bottom" visibility="hidden" width={320}>
        <div data-testid="ornament-child">content</div>
      </Ornament>,
    )

    expect(update).not.toHaveBeenCalled()
    styleSync.resolve()

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        attachmentAnchor: 'bottom',
        contentAlignment: 'back',
        visibility: 'hidden',
        width: 320,
        height: 150,
        cornerRadius: {
          topLeading: 0,
          bottomLeading: 0,
          topTrailing: 0,
          bottomTrailing: 0,
        },
        backgroundMaterial: 'none',
      })
      expect(mocks.addOrnament).toHaveBeenCalledWith('ornament-1')
      expect(
        childWindow.document.body.querySelector(
          '[data-testid="ornament-child"]',
        ),
      ).not.toBeNull()
    })

    expect(update.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.addOrnament.mock.invocationCallOrder[0],
    )
  })

  it('allows multiple Ornament instances to coexist', async () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')
    const secondWindow = createChildWindow()
    mocks.createOrnament
      .mockResolvedValueOnce({
        id: 'ornament-1',
        getWindowProxy: () => childWindow,
        destroy,
        update,
      })
      .mockResolvedValueOnce({
        id: 'ornament-2',
        getWindowProxy: () => secondWindow,
        destroy: vi.fn(() => Promise.resolve()),
        update: vi.fn(() => Promise.resolve()),
      })

    render(
      <>
        <Ornament attachmentAnchor="bottom">
          <div data-testid="ornament-one">one</div>
        </Ornament>
        <Ornament attachmentAnchor="bottom">
          <div data-testid="ornament-two">two</div>
        </Ornament>
      </>,
    )

    await waitFor(() => {
      expect(mocks.createOrnament).toHaveBeenCalledTimes(2)
      expect(mocks.addOrnament).toHaveBeenCalledWith('ornament-1')
      expect(mocks.addOrnament).toHaveBeenCalledWith('ornament-2')
      expect(
        childWindow.document.body.querySelector('[data-testid="ornament-one"]'),
      ).not.toBeNull()
      expect(
        secondWindow.document.body.querySelector(
          '[data-testid="ornament-two"]',
        ),
      ).not.toBeNull()
    })
  })

  it('does not create nested Ornament instances', () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')

    render(
      <InsideOrnamentContext.Provider value={true}>
        <Ornament>
          <div />
        </Ornament>
      </InsideOrnamentContext.Provider>,
    )

    expect(mocks.createOrnament).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[WebSpatial] Ornament cannot be used inside Ornament content.',
    )
  })

  it('does not create Ornament instances inside Attachment content', () => {
    setUserAgent('Mozilla/5.0 Chrome/120.0.0.0 Puppeteer Safari/537.36')

    render(
      <InsideAttachmentContext.Provider value={true}>
        <Ornament>
          <div />
        </Ornament>
      </InsideAttachmentContext.Provider>,
    )

    expect(mocks.createOrnament).not.toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalledWith(
      '[WebSpatial] Ornament cannot be used inside Attachment content.',
    )
  })

  it('degrades Model to native <model> inside Ornament content', () => {
    const { container } = render(
      <InsideOrnamentContext.Provider value={true}>
        <Model enable-xr src="demo.usdz" data-testid="model-fallback" />
      </InsideOrnamentContext.Provider>,
    )

    const model = container.querySelector('model')
    expect(model).not.toBeNull()
    expect(model?.getAttribute('src')).toBe('demo.usdz')
    expect(warnSpy).toHaveBeenCalledWith(
      '[WebSpatial] Model cannot be used as a spatial Model inside Ornament content. Rendering the native <model> fallback.',
    )
  })

  it('degrades SpatialDiv marker content to plain DOM inside Ornament content', () => {
    const SpatialDiv = withSpatialized2DElementContainer('div')

    const { getByTestId } = render(
      <InsideOrnamentContext.Provider value={true}>
        <SpatialDiv component="div" data-testid="spatial-div-fallback">
          plain fallback
        </SpatialDiv>
      </InsideOrnamentContext.Provider>,
    )

    const fallback = getByTestId('spatial-div-fallback')
    expect(fallback.tagName).toBe('DIV')
    expect(fallback.textContent).toBe('plain fallback')
    expect(warnSpy).toHaveBeenCalledWith(
      '[WebSpatial] div cannot be used inside Ornament content. Rendering as plain HTML.',
    )
  })

  it('renders Reality as null inside Ornament content', () => {
    const { queryByTestId } = render(
      <InsideOrnamentContext.Provider value={true}>
        <Reality>
          <div data-testid="reality-child" />
        </Reality>
      </InsideOrnamentContext.Provider>,
    )

    expect(queryByTestId('reality-child')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      '[WebSpatial] Reality cannot be used inside Ornament content.',
    )
  })
})
