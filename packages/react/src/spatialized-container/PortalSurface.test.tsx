import React from 'react'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const portalSurfaceTestMocks = vi.hoisted(() => ({
  getSession: vi.fn(() => null as any),
  syncParentHeadToChild: vi.fn().mockResolvedValue([]),
  useSyncHeadStyles: vi.fn(),
}))

vi.mock('../utils', async importOriginal => {
  const actual = await importOriginal<typeof import('../utils')>()
  return {
    ...actual,
    getSession: portalSurfaceTestMocks.getSession,
  }
})

vi.mock('../utils/windowStyleSync', async importOriginal => {
  const actual =
    await importOriginal<typeof import('../utils/windowStyleSync')>()
  return {
    ...actual,
    syncParentHeadToChild: portalSurfaceTestMocks.syncParentHeadToChild,
  }
})

vi.mock('../utils/useSyncHeadStyles', () => ({
  useSyncHeadStyles: portalSurfaceTestMocks.useSyncHeadStyles,
}))

import { PortalSurface } from './PortalSurface'
import { PortalInstanceContext } from './context/PortalInstanceContext'
import { SpatialOverlayRenderTargetContext } from './context/SpatialOverlayRenderTargetContext'
import { SpatializedContainerContext } from './context/SpatializedContainerContext'

describe('PortalSurface real implementation', () => {
  const OriginalResizeObserver = globalThis.ResizeObserver
  const OriginalMutationObserver = globalThis.MutationObserver
  const OriginalDOMMatrix = globalThis.DOMMatrix

  function useFakeSpatialSession() {
    if (typeof globalThis.DOMMatrix === 'undefined') {
      globalThis.DOMMatrix = class DOMMatrix {} as typeof DOMMatrix
    }

    const childDocument =
      document.implementation.createHTMLDocument('portal-surface')
    const createSpatialized2DElement = vi.fn().mockResolvedValue({
      windowProxy: { document: childDocument } as WindowProxy,
      updateProperties: vi.fn(),
      updateTransform: vi.fn(),
      destroy: vi.fn(),
    })
    const addSpatializedElement = vi.fn()
    portalSurfaceTestMocks.getSession.mockReturnValue({
      createSpatialized2DElement,
      getSpatialScene: () => ({
        addSpatializedElement,
      }),
    })
    return { childDocument, createSpatialized2DElement, addSpatializedElement }
  }

  afterEach(() => {
    cleanup()
    globalThis.ResizeObserver = OriginalResizeObserver
    globalThis.MutationObserver = OriginalMutationObserver
    globalThis.DOMMatrix = OriginalDOMMatrix
    portalSurfaceTestMocks.getSession.mockReset()
    portalSurfaceTestMocks.getSession.mockReturnValue(null)
    portalSurfaceTestMocks.syncParentHeadToChild.mockClear()
    portalSurfaceTestMocks.useSyncHeadStyles.mockClear()
  })

  it('does not render a host element in the main document', () => {
    const { createSpatialized2DElement } = useFakeSpatialSession()

    render(
      <PortalSurface zOffset={80} backgroundMaterial="transparent">
        <div>content</div>
      </PortalSurface>,
    )

    expect(
      document.body.querySelector('[data-webspatial-portal-surface]'),
    ).toBeNull()
    expect(screen.queryByText('content')).toBeNull()
    expect(createSpatialized2DElement).toHaveBeenCalled()
  })

  it('does not create a surface for the hidden standard copy inside SpatialDiv', () => {
    const { createSpatialized2DElement } = useFakeSpatialSession()

    render(
      <SpatializedContainerContext.Provider value={{} as any}>
        <PortalSurface zOffset={80} backgroundMaterial="transparent">
          <div>content</div>
        </PortalSurface>
      </SpatializedContainerContext.Provider>,
    )

    expect(createSpatialized2DElement).not.toHaveBeenCalled()
  })

  it('creates a surface for the visible portal copy inside SpatialDiv', () => {
    const { createSpatialized2DElement } = useFakeSpatialSession()

    render(
      <SpatializedContainerContext.Provider value={{} as any}>
        <PortalInstanceContext.Provider value={{} as any}>
          <SpatialOverlayRenderTargetContext.Provider value="portal">
            <PortalSurface zOffset={80} backgroundMaterial="transparent">
              <div>content</div>
            </PortalSurface>
          </SpatialOverlayRenderTargetContext.Provider>
        </PortalInstanceContext.Provider>
      </SpatializedContainerContext.Provider>,
    )

    expect(createSpatialized2DElement).toHaveBeenCalled()
  })

  it('maps zOffset and material to native surface properties', async () => {
    const { createSpatialized2DElement } = useFakeSpatialSession()

    render(
      <PortalSurface zOffset={80} backgroundMaterial="transparent">
        content
      </PortalSurface>,
    )

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const element = await createSpatialized2DElement.mock.results[0]!.value
    expect(element.updateProperties).toHaveBeenCalledWith(
      expect.objectContaining({
        backOffset: 80,
        material: 'transparent',
      }),
    )
  })

  it('renders children only in the raised document in the spatial path', async () => {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
    globalThis.MutationObserver = class MutationObserver {
      observe() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof MutationObserver

    const { childDocument } = useFakeSpatialSession()
    const originalAppendChild = childDocument.head.appendChild.bind(
      childDocument.head,
    )
    ;(childDocument.head as any).appendChild = (node: Node) => {
      const result = originalAppendChild(node)
      if (typeof (node as any).onload === 'function') {
        ;(node as any).onload()
      }
      return result
    }

    render(
      <PortalSurface>
        <div data-testid="portal-child">portal child</div>
      </PortalSurface>,
    )

    expect(screen.queryByTestId('portal-child')).toBeNull()

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(
      childDocument.body.querySelector('[data-testid="portal-child"]'),
    ).not.toBeNull()
  })
})
